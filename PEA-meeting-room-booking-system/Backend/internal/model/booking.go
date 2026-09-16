package model

import "time"

type BookingStatus string

const (
	StatusPending  BookingStatus = "Pending"
	StatusApproved BookingStatus = "Approved"
	StatusRejected BookingStatus = "Rejected"
	StatusCanceled BookingStatus = "Canceled"
)

type Booking struct {
	BookingID        uint          `gorm:"primaryKey;autoIncrement"              json:"booking_id"`
	BookingCode      string        `gorm:"uniqueIndex;size:20;not null"          json:"booking_code"`
	RoomID           uint          `gorm:"not null"                              json:"room_id"`
	Room             Room          `gorm:"foreignKey:RoomID"                     json:"room,omitempty"`
	EmpID            string        `gorm:"not null"                              json:"emp_id"`
	User             User          `gorm:"foreignKey:EmpID;references:EmpID"     json:"user,omitempty"`
	Title            string        `gorm:"not null"                              json:"title"`
	RefNote          string        `json:"ref_note"`
	Objective        string        `json:"objective"`
	StartDate        time.Time     `gorm:"not null"                              json:"start_date"`
	EndDate          time.Time     `gorm:"not null"                              json:"end_date"`
	SnackPrice       float64       `json:"snack_price"`
	ParticipantCount int           `json:"participant_count"`
	Status           BookingStatus `gorm:"type:booking_status;default:'Pending'" json:"status"`
	ApprovedBy       *string       `json:"approved_by"`
	RejectReason     *string       `json:"reject_reason"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}
