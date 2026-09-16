package repository

import (
	"pea-room-booking/internal/model"

	"gorm.io/gorm"
)

type BookingLogRepository interface {
	Create(log *model.BookingLog) error
	FindByBookingID(bookingID uint) ([]model.BookingLog, error)
	FindAll() ([]model.BookingLog, error)
}

type bookingLogRepository struct {
	db *gorm.DB
}

func NewBookingLogRepository(db *gorm.DB) BookingLogRepository {
	return &bookingLogRepository{db: db}
}

func (r *bookingLogRepository) Create(log *model.BookingLog) error {
	return r.db.Create(log).Error
}

func (r *bookingLogRepository) FindByBookingID(bookingID uint) ([]model.BookingLog, error) {
	var logs []model.BookingLog
	err := r.db.Preload("Booking").Preload("Booking.Room").Preload("Booking.User").Preload("Operator").Where("booking_id = ?", bookingID).Order("created_at ASC").Find(&logs).Error
	return logs, err
}

func (r *bookingLogRepository) FindAll() ([]model.BookingLog, error) {
	var logs []model.BookingLog
	err := r.db.Preload("Booking").Preload("Booking.Room").Preload("Booking.User").Preload("Operator").Order("created_at DESC").Find(&logs).Error
	return logs, err
}
