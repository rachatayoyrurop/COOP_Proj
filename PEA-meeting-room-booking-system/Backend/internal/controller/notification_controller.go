package controller

import (
	"fmt"
	"time"

	"pea-room-booking/internal/model"
	"pea-room-booking/pkg/response"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type NotificationController struct {
	db *gorm.DB
}

func NewNotificationController(db *gorm.DB) *NotificationController {
	return &NotificationController{db: db}
}

type NotificationItem struct {
	ID        uint      `json:"id"`
	Text      string    `json:"text"`
	Time      string    `json:"time"`
	Unread    bool      `json:"unread"`
	CreatedAt time.Time `json:"created_at"`
}

func (ctrl *NotificationController) GetNotifications(ctx *fiber.Ctx) error {
	empID := ctx.Locals("emp_id").(string)
	role := ctx.Locals("role").(string)

	var items []NotificationItem

	if role == "Admin" || role == "SuperAdmin" {
		// 1. Fetch pending bookings in GORM
		var pendingBookings []model.Booking
		err := ctrl.db.Preload("Room").Preload("User").
			Where("status = ?", "Pending").
			Order("created_at DESC").
			Find(&pendingBookings).Error
		if err == nil {
			for _, b := range pendingBookings {
				timeDiff := formatRelativeTime(b.CreatedAt)
				roomName := "ห้องประชุม"
				if b.Room.RoomID != 0 {
					roomName = b.Room.RoomName
				}
				text := fmt.Sprintf("มีคำขอจองห้องประชุมใหม่รอการอนุมัติ: %s - หัวเรื่อง \"%s\"", roomName, b.Title)
				items = append(items, NotificationItem{
					ID:        b.BookingID,
					Text:      text,
					Time:      timeDiff,
					Unread:    true,
					CreatedAt: b.CreatedAt,
				})
			}
		}

		// 2. Fetch recent cancellation logs
		var canceledLogs []model.BookingLog
		err = ctrl.db.Preload("Booking.Room").
			Where("action = ?", "canceled").
			Order("created_at DESC").
			Limit(5).
			Find(&canceledLogs).Error
		if err == nil {
			for _, log := range canceledLogs {
				if log.Booking != nil {
					timeDiff := formatRelativeTime(log.CreatedAt)
					roomName := "ห้องประชุม"
					if log.Booking.Room.RoomID != 0 {
						roomName = log.Booking.Room.RoomName
					}
					text := fmt.Sprintf("ผู้ใช้งานได้ยกเลิกคำขอจองรหัส %s (%s)", log.Booking.BookingCode, roomName)
					items = append(items, NotificationItem{
						ID:        100000 + log.LogID, // avoid ID collision with pending bookings
						Text:      text,
						Time:      timeDiff,
						Unread:    true,
						CreatedAt: log.CreatedAt,
					})
				}
			}
		}
	} else {
		// Standard User: fetch logs for their bookings (actions approved/rejected/canceled)
		var userLogs []model.BookingLog
		var bookingIDs []uint
		err := ctrl.db.Model(&model.Booking{}).Where("emp_id = ?", empID).Pluck("booking_id", &bookingIDs).Error
		if err == nil && len(bookingIDs) > 0 {
			err = ctrl.db.Preload("Booking").Preload("Booking.Room").
				Where("booking_id IN ?", bookingIDs).
				Where("action IN ?", []string{"approved", "rejected"}).
				Order("created_at DESC").
				Limit(10).
				Find(&userLogs).Error
		}
		
		if err == nil {
			for _, log := range userLogs {
				if log.Booking != nil {
					timeDiff := formatRelativeTime(log.CreatedAt)
					roomName := "ห้องประชุม"
					if log.Booking.Room.RoomID != 0 {
						roomName = log.Booking.Room.RoomName
					}

					var actionText string
					if log.Action == "approved" {
						actionText = "ได้รับการอนุมัติเรียบร้อยแล้ว"
					} else {
						actionText = "ไม่ได้รับการอนุมัติ"
						if log.Remark != "" {
							actionText += fmt.Sprintf(" (เหตุผล: %s)", log.Remark)
						}
					}

					text := fmt.Sprintf("การจองรหัส %s (%s) ของคุณ%s", log.Booking.BookingCode, roomName, actionText)
					items = append(items, NotificationItem{
						ID:        log.LogID,
						Text:      text,
						Time:      timeDiff,
						Unread:    true,
						CreatedAt: log.CreatedAt,
					})
				}
			}
		}
	}

	// Fallback if empty — use a fixed past timestamp so it never appears as "new" unread
	if len(items) == 0 {
		items = append(items, NotificationItem{
			ID:        0,
			Text:      "ยินดีต้อนรับเข้าสู่ระบบจองห้องประชุม PEA การไฟฟ้าส่วนภูมิภาค",
			Time:      "",
			Unread:    false,
			CreatedAt: time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC),
		})
	}

	return response.OK(ctx, items)
}

func formatRelativeTime(t time.Time) string {
	diff := time.Since(t)
	if diff.Minutes() < 1 {
		return "เมื่อสักครู่"
	}
	if diff.Hours() < 1 {
		return fmt.Sprintf("%.0f นาทีที่แล้ว", diff.Minutes())
	}
	if diff.Hours() < 24 {
		return fmt.Sprintf("%.0f ชั่วโมงที่แล้ว", diff.Hours())
	}
	return t.Format("02/01/2006")
}
