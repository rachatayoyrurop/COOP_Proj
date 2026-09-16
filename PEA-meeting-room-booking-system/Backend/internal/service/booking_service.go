package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"pea-room-booking/internal/model"
	"pea-room-booking/internal/repository"
)

type BookingFilter struct {
	RoomID *uint
	Status *string
	EmpID  *string
}

type CreateBookingRequest struct {
	RoomID           uint      `json:"room_id"`
	Title            string    `json:"title"`
	RefNote          string    `json:"ref_note"`
	Objective        string    `json:"objective"`
	StartDate        time.Time `json:"start_date"`
	EndDate          time.Time `json:"end_date"`
	SnackPrice       float64   `json:"snack_price"`
	ParticipantCount int       `json:"participant_count"`
}

type BookingService interface {
	Create(req *CreateBookingRequest, empID string) (*model.Booking, error)
	GetByID(id uint) (*model.Booking, error)
	GetByCode(code string) (*model.Booking, error)
	GetMyBookings(empID string) ([]model.Booking, error)
	GetAll(filter BookingFilter) ([]model.Booking, error)
	GetPending() ([]model.Booking, error)
	Approve(id uint, adminEmpID string) error
	Reject(id uint, adminEmpID, reason string) error
	Cancel(id uint, empID string) error
	GetCalendar(roomID *uint, year, month int) ([]model.Booking, error)
	GetBookingLogs() ([]model.BookingLog, error)
}

type bookingService struct {
	repo     repository.BookingRepository
	logRepo  repository.BookingLogRepository
	roomRepo repository.RoomRepository
	userRepo repository.UserRepository
	emailSvc EmailService
}

func NewBookingService(repo repository.BookingRepository, logRepo repository.BookingLogRepository, roomRepo repository.RoomRepository, userRepo repository.UserRepository, emailSvc EmailService) BookingService {
	return &bookingService{
		repo:     repo,
		logRepo:  logRepo,
		roomRepo: roomRepo,
		userRepo: userRepo,
		emailSvc: emailSvc,
	}
}

func (s *bookingService) Create(req *CreateBookingRequest, empID string) (*model.Booking, error) {
	if req.RoomID == 0 || req.Title == "" {
		return nil, errors.New("room_id and title are required")
	}
	if !req.EndDate.After(req.StartDate) {
		return nil, errors.New("end_date must be after start_date")
	}

	now := time.Now()

	if !req.StartDate.After(now) {
		return nil, errors.New("start_date must be in the future")
	}
	if req.ParticipantCount < 1 {
		return nil, errors.New("participant_count must be at least 1")
	}
	if req.SnackPrice != 0 && req.SnackPrice != 15 && req.SnackPrice != 25 && req.SnackPrice != 35 {
		return nil, errors.New("snack_price must be 0, 15, 25, or 35")
	}

	// Verify room exists and is active
	room, err := s.roomRepo.FindByID(req.RoomID)
	if err != nil {
		return nil, errors.New("cannot book an inactive or non-existent room")
	}
	if !room.IsActive {
		return nil, errors.New("cannot book an inactive room")
	}

	booking := &model.Booking{
		BookingCode:      generateBookingCode(),
		RoomID:           req.RoomID,
		EmpID:            empID,
		Title:            req.Title,
		RefNote:          req.RefNote,
		Objective:        req.Objective,
		StartDate:        req.StartDate,
		EndDate:          req.EndDate,
		SnackPrice:       req.SnackPrice,
		ParticipantCount: req.ParticipantCount,
		Status:           model.StatusPending,
	}

	if err := s.repo.CreateWithOverlapCheck(booking); err != nil {
		return nil, err
	}

	_ = s.logRepo.Create(&model.BookingLog{
		BookingID: booking.BookingID,
		ChangedBy: empID,
		Action:    "created",
		NewStatus: string(model.StatusPending),
	})

	// Email dispatch disabled — notifications via bell icon only

	return booking, nil
}

func (s *bookingService) GetByID(id uint) (*model.Booking, error) {
	return s.repo.FindByID(id)
}

func (s *bookingService) GetByCode(code string) (*model.Booking, error) {
	return s.repo.FindByCode(code)
}

func (s *bookingService) GetMyBookings(empID string) ([]model.Booking, error) {
	return s.repo.FindByEmpID(empID)
}

func (s *bookingService) GetAll(filter BookingFilter) ([]model.Booking, error) {
	return s.repo.FindAll(repository.BookingQueryFilter{
		RoomID: filter.RoomID,
		Status: filter.Status,
		EmpID:  filter.EmpID,
	})
}

func (s *bookingService) GetPending() ([]model.Booking, error) {
	return s.repo.FindPending()
}

func (s *bookingService) Approve(id uint, adminEmpID string) error {
	booking, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if booking.Status != model.StatusPending {
		return fmt.Errorf("cannot approve a booking with status: %s", booking.Status)
	}

	oldStatus := booking.Status
	booking.Status = model.StatusApproved
	booking.ApprovedBy = &adminEmpID

	if err := s.repo.Update(booking); err != nil {
		return err
	}

	_ = s.logRepo.Create(&model.BookingLog{
		BookingID: booking.BookingID,
		ChangedBy: adminEmpID,
		Action:    "approved",
		OldStatus: string(oldStatus),
		NewStatus: string(model.StatusApproved),
	})

	// Email dispatch disabled — notifications via bell icon only

	return nil
}

func (s *bookingService) Reject(id uint, adminEmpID, reason string) error {
	booking, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if booking.Status != model.StatusPending {
		return fmt.Errorf("cannot reject a booking with status: %s", booking.Status)
	}

	oldStatus := booking.Status
	booking.Status = model.StatusRejected
	booking.RejectReason = &reason

	if err := s.repo.Update(booking); err != nil {
		return err
	}

	_ = s.logRepo.Create(&model.BookingLog{
		BookingID: booking.BookingID,
		ChangedBy: adminEmpID,
		Action:    "rejected",
		OldStatus: string(oldStatus),
		NewStatus: string(model.StatusRejected),
		Remark:    reason,
	})

	// Email dispatch disabled — notifications via bell icon only

	return nil
}

func (s *bookingService) Cancel(id uint, empID string) error {
	booking, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if booking.EmpID != empID {
		return errors.New("you can only cancel your own bookings")
	}
	if booking.Status == model.StatusRejected || booking.Status == model.StatusCanceled {
		return fmt.Errorf("cannot cancel a booking with status: %s", booking.Status)
	}

	oldStatus := booking.Status
	booking.Status = model.StatusCanceled

	if err := s.repo.Update(booking); err != nil {
		return err
	}

	_ = s.logRepo.Create(&model.BookingLog{
		BookingID: booking.BookingID,
		ChangedBy: empID,
		Action:    "canceled",
		OldStatus: string(oldStatus),
		NewStatus: string(model.StatusCanceled),
	})
	return nil
}

func (s *bookingService) GetCalendar(roomID *uint, year, month int) ([]model.Booking, error) {
	return s.repo.FindForCalendar(roomID, year, month)
}

func (s *bookingService) GetBookingLogs() ([]model.BookingLog, error) {
	return s.logRepo.FindAll()
}

// generateBookingCode produces a unique code like PEA-2605-1A2B3C
func generateBookingCode() string {
	b := make([]byte, 3)
	_, _ = rand.Read(b)
	return fmt.Sprintf("PEA-%s-%s", time.Now().Format("0601"), strings.ToUpper(hex.EncodeToString(b)))
}
