package controller

import (
	"time"

	"pea-room-booking/internal/service"
	"pea-room-booking/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type BookingController struct {
	bookingSvc service.BookingService
}

func NewBookingController(bookingSvc service.BookingService) *BookingController {
	return &BookingController{bookingSvc: bookingSvc}
}

func (c *BookingController) Create(ctx *fiber.Ctx) error {
	empID := ctx.Locals("emp_id").(string)
	var req service.CreateBookingRequest
	if err := ctx.BodyParser(&req); err != nil {
		return response.BadRequest(ctx, "invalid request body")
	}
	booking, err := c.bookingSvc.Create(&req, empID)
	if err != nil {
		return response.BadRequest(ctx, err.Error())
	}
	return response.Created(ctx, booking)
}

func (c *BookingController) GetMyBookings(ctx *fiber.Ctx) error {
	empID := ctx.Locals("emp_id").(string)
	bookings, err := c.bookingSvc.GetMyBookings(empID)
	if err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, bookings)
}

func (c *BookingController) GetByID(ctx *fiber.Ctx) error {
	id, err := parseUintParam(ctx, "id")
	if err != nil {
		return response.BadRequest(ctx, "invalid booking id")
	}
	booking, err := c.bookingSvc.GetByID(id)
	if err != nil {
		return response.NotFound(ctx, "booking not found")
	}
	return response.OK(ctx, booking)
}

func (c *BookingController) Cancel(ctx *fiber.Ctx) error {
	empID := ctx.Locals("emp_id").(string)
	id, err := parseUintParam(ctx, "id")
	if err != nil {
		return response.BadRequest(ctx, "invalid booking id")
	}
	if err := c.bookingSvc.Cancel(id, empID); err != nil {
		return response.BadRequest(ctx, err.Error())
	}
	return response.OK(ctx, "booking canceled")
}

func (c *BookingController) GetCalendar(ctx *fiber.Ctx) error {
	var roomID *uint
	if rid := ctx.QueryInt("room_id", 0); rid > 0 {
		r := uint(rid)
		roomID = &r
	}
	now := time.Now()
	year := ctx.QueryInt("year", now.Year())
	month := ctx.QueryInt("month", int(now.Month()))

	bookings, err := c.bookingSvc.GetCalendar(roomID, year, month)
	if err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, bookings)
}
