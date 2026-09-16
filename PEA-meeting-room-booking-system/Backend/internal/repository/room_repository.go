package repository

import (
	"time"

	"pea-room-booking/internal/model"

	"gorm.io/gorm"
)

type RoomRepository interface {
	FindAll(includeInactive bool) ([]model.Room, error)
	FindByID(id uint) (*model.Room, error)
	Create(room *model.Room) error
	Update(room *model.Room) error
	SoftDelete(id uint) error
}

type roomRepository struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) RoomRepository {
	return &roomRepository{db: db}
}

func (r *roomRepository) FindAll(includeInactive bool) ([]model.Room, error) {
	var rooms []model.Room
	var err error
	if includeInactive {
		err = r.db.Find(&rooms).Error
	} else {
		err = r.db.Where("is_active = ?", true).Find(&rooms).Error
	}
	if err != nil {
		return nil, err
	}

	// Calculate status for each room based on today's approved bookings
	now := time.Now()
	// Get start and end of today in local time
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayEnd := todayStart.AddDate(0, 0, 1)

	type BookingTime struct {
		RoomID    uint
		StartDate time.Time
		EndDate   time.Time
		Status    string
	}
	var bookings []BookingTime
	err = r.db.Model(&model.Booking{}).
		Select("room_id, start_date, end_date, status").
		Where("status = ?", "Approved").
		Where("start_date < ? AND end_date > ?", todayEnd, todayStart).
		Find(&bookings).Error
	if err != nil {
		// Just return loaded rooms on error without calculation
		return rooms, nil
	}

	for i := range rooms {
		status := "Available" // Default
		for _, b := range bookings {
			if b.RoomID == rooms[i].RoomID {
				if now.After(b.StartDate) && now.Before(b.EndDate) {
					status = "In Use"
					break // In Use occupied status takes highest precedence
				} else {
					status = "Reserved" // Upcoming booking today
				}
			}
		}
		rooms[i].Status = status
	}

	return rooms, nil
}

func (r *roomRepository) FindByID(id uint) (*model.Room, error) {
	var room model.Room
	err := r.db.Where("room_id = ?", id).First(&room).Error
	if err != nil {
		return nil, err
	}

	now := time.Now()
	var countInUse int64
	r.db.Model(&model.Booking{}).
		Where("room_id = ? AND status = ? AND start_date <= ? AND end_date >= ?", id, "Approved", now, now).
		Count(&countInUse)

	if countInUse > 0 {
		room.Status = "In Use"
	} else {
		var countToday int64
		todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		todayEnd := todayStart.AddDate(0, 0, 1)
		r.db.Model(&model.Booking{}).
			Where("room_id = ? AND status = ? AND start_date < ? AND end_date > ?", id, "Approved", todayEnd, todayStart).
			Count(&countToday)
		if countToday > 0 {
			room.Status = "Reserved"
		} else {
			room.Status = "Available"
		}
	}

	return &room, nil
}

func (r *roomRepository) Create(room *model.Room) error {
	return r.db.Create(room).Error
}

func (r *roomRepository) Update(room *model.Room) error {
	return r.db.Save(room).Error
}

func (r *roomRepository) SoftDelete(id uint) error {
	return r.db.Model(&model.Room{}).Where("room_id = ?", id).Update("is_active", false).Error
}
