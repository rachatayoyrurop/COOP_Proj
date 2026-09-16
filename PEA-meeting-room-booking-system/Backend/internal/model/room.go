package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// StringArray serialises as a PostgreSQL JSONB array.
type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	b, err := json.Marshal(s)
	return string(b), err
}

func (s *StringArray) Scan(value interface{}) error {
	var raw []byte
	switch v := value.(type) {
	case []byte:
		raw = v
	case string:
		raw = []byte(v)
	default:
		return fmt.Errorf("cannot scan type %T into StringArray", value)
	}
	return json.Unmarshal(raw, s)
}

type Room struct {
	RoomID      uint        `gorm:"primaryKey;autoIncrement" json:"room_id"`
	RoomName    string      `gorm:"not null"                 json:"room_name"`
	Building    string      `json:"building"`
	Capacity    int         `json:"capacity"`
	MicCount    int         `json:"mic_count"`
	PcCount     int         `json:"pc_count"`
	ScreenCount int         `json:"screen_count"`
	Images      StringArray `gorm:"type:jsonb;default:'[]'"  json:"images"`
	IsActive    bool        `gorm:"default:true"             json:"is_active"`
	Status      string      `gorm:"-"                        json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}
