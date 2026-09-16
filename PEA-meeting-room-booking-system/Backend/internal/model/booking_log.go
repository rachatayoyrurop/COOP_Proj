package model

import "time"

type BookingLog struct {
	LogID     uint      `gorm:"primaryKey;autoIncrement" json:"log_id"`
	BookingID uint      `gorm:"not null;index"           json:"booking_id"`
	Booking   *Booking  `gorm:"foreignKey:BookingID"     json:"booking,omitempty"`
	ChangedBy string    `gorm:"not null"                 json:"changed_by"`
	Operator  *User     `gorm:"foreignKey:ChangedBy;references:EmpID" json:"operator,omitempty"`
	Action    string    `gorm:"not null"                 json:"action"`
	OldStatus string    `json:"old_status"`
	NewStatus string    `json:"new_status"`
	Remark    string    `json:"remark"`
	CreatedAt time.Time `json:"created_at"`
}
