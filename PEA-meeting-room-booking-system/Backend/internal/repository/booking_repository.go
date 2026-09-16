package repository

import (
	"errors"
	"time"

	"pea-room-booking/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrBookingOverlap = errors.New("room is already booked for this time slot")

type BookingQueryFilter struct {
	RoomID *uint
	Status *string
	EmpID  *string
}

type BookingRepository interface {
	Create(booking *model.Booking) error
	CreateWithOverlapCheck(booking *model.Booking) error
	FindByID(id uint) (*model.Booking, error)
	FindByCode(code string) (*model.Booking, error)
	FindByEmpID(empID string) ([]model.Booking, error)
	FindAll(filter BookingQueryFilter) ([]model.Booking, error)
	FindPending() ([]model.Booking, error)
	Update(booking *model.Booking) error
	HasOverlap(roomID uint, start, end time.Time, excludeID uint) (bool, error)
	FindForCalendar(roomID *uint, year, month int) ([]model.Booking, error)
}

type bookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB) BookingRepository {
	return &bookingRepository{db: db}
}

func (r *bookingRepository) Create(booking *model.Booking) error {
	return r.db.Create(booking).Error
}

func (r *bookingRepository) CreateWithOverlapCheck(booking *model.Booking) error {
	return r.db.Transaction(func(tx *gorm.DB) error {

		var room model.Room

		if err := tx.
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("room_id").
			First(&room, booking.RoomID).Error; err != nil {
			return err
		}

		var count int64

		if err := tx.
			Model(&model.Booking{}).
			Where("room_id = ?", booking.RoomID).
			Where(
				"status NOT IN ?",
				[]string{
					string(model.StatusRejected),
					string(model.StatusCanceled),
				},
			).
			Where(
				"start_date < ? AND end_date > ?",
				booking.EndDate,
				booking.StartDate,
			).
			Count(&count).Error; err != nil {
			return err
		}

		if count > 0 {
			return ErrBookingOverlap
		}

		return tx.Create(booking).Error
	})
}

func (r *bookingRepository) FindByID(id uint) (*model.Booking, error) {
	var booking model.Booking
	err := r.db.Preload("Room").Preload("User").First(&booking, id).Error
	return &booking, err
}

func (r *bookingRepository) FindByCode(code string) (*model.Booking, error) {
	var booking model.Booking
	err := r.db.Preload("Room").Preload("User").
		Where("booking_code = ?", code).First(&booking).Error
	return &booking, err
}

func (r *bookingRepository) FindByEmpID(empID string) ([]model.Booking, error) {
	var bookings []model.Booking
	err := r.db.Preload("Room").
		Where("emp_id = ?", empID).
		Order("created_at DESC").
		Find(&bookings).Error
	return bookings, err
}

func (r *bookingRepository) FindAll(filter BookingQueryFilter) ([]model.Booking, error) {
	var bookings []model.Booking
	q := r.db.Preload("Room").Preload("User").Order("created_at DESC")
	if filter.RoomID != nil {
		q = q.Where("room_id = ?", *filter.RoomID)
	}
	if filter.Status != nil {
		q = q.Where("status = ?", *filter.Status)
	}
	if filter.EmpID != nil {
		q = q.Where("emp_id = ?", *filter.EmpID)
	}
	err := q.Find(&bookings).Error
	return bookings, err
}

func (r *bookingRepository) FindPending() ([]model.Booking, error) {
	var bookings []model.Booking
	err := r.db.Preload("Room").Preload("User").
		Where("status = ?", model.StatusPending).
		Order("created_at ASC").
		Find(&bookings).Error
	return bookings, err
}

func (r *bookingRepository) Update(booking *model.Booking) error {
	return r.db.Save(booking).Error
}

func (r *bookingRepository) HasOverlap(roomID uint, start, end time.Time, excludeID uint) (bool, error) {
	var count int64
	q := r.db.Model(&model.Booking{}).
		Where("room_id = ?", roomID).
		Where("status NOT IN ?", []string{string(model.StatusRejected), string(model.StatusCanceled)}).
		Where("start_date < ? AND end_date > ?", end, start)
	if excludeID > 0 {
		q = q.Where("booking_id != ?", excludeID)
	}
	err := q.Count(&count).Error
	return count > 0, err
}

func (r *bookingRepository) FindForCalendar(roomID *uint, year, month int) ([]model.Booking, error) {
	var bookings []model.Booking
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0)

	q := r.db.Select("booking_id, booking_code, room_id, emp_id, title, start_date, end_date, status").
		Where("start_date >= ? AND start_date < ?", startOfMonth, endOfMonth).
		Where("status NOT IN ?", []string{string(model.StatusRejected), string(model.StatusCanceled)})
	if roomID != nil {
		q = q.Where("room_id = ?", *roomID)
	}
	err := q.Find(&bookings).Error
	return bookings, err
}
