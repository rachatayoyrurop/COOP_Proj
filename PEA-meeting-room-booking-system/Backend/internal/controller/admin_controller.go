package controller

import (
	"pea-room-booking/internal/model"
	"pea-room-booking/internal/service"
	"pea-room-booking/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AdminController struct {
	bookingSvc service.BookingService
	userSvc    service.UserService
}

func NewAdminController(bookingSvc service.BookingService, userSvc service.UserService) *AdminController {
	return &AdminController{bookingSvc: bookingSvc, userSvc: userSvc}
}

// GetAllBookings lists bookings with optional ?status=&room_id= filters
func (c *AdminController) GetAllBookings(ctx *fiber.Ctx) error {
	filter := service.BookingFilter{}
	if s := ctx.Query("status"); s != "" {
		filter.Status = &s
	}
	if rid := ctx.QueryInt("room_id", 0); rid > 0 {
		r := uint(rid)
		filter.RoomID = &r
	}
	bookings, err := c.bookingSvc.GetAll(filter)
	if err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, bookings)
}

func (c *AdminController) GetPendingBookings(ctx *fiber.Ctx) error {
	bookings, err := c.bookingSvc.GetPending()
	if err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, bookings)
}

// SearchByCode finds a booking by ?code=PEA-2605-XXXXXX
func (c *AdminController) SearchByCode(ctx *fiber.Ctx) error {
	code := ctx.Query("code")
	if code == "" {
		return response.BadRequest(ctx, "query param 'code' is required")
	}
	booking, err := c.bookingSvc.GetByCode(code)
	if err != nil {
		return response.NotFound(ctx, "booking not found")
	}
	return response.OK(ctx, booking)
}

func (c *AdminController) Approve(ctx *fiber.Ctx) error {
	adminEmpID := ctx.Locals("emp_id").(string)
	id, err := parseUintParam(ctx, "id")
	if err != nil {
		return response.BadRequest(ctx, "invalid booking id")
	}
	if err := c.bookingSvc.Approve(id, adminEmpID); err != nil {
		return response.BadRequest(ctx, err.Error())
	}
	return response.OK(ctx, "booking approved")
}

type rejectRequest struct {
	Reason string `json:"reason"`
}

func (c *AdminController) Reject(ctx *fiber.Ctx) error {
	adminEmpID := ctx.Locals("emp_id").(string)
	id, err := parseUintParam(ctx, "id")
	if err != nil {
		return response.BadRequest(ctx, "invalid booking id")
	}
	var req rejectRequest
	if err := ctx.BodyParser(&req); err != nil {
		return response.BadRequest(ctx, "invalid request body")
	}
	if err := c.bookingSvc.Reject(id, adminEmpID, req.Reason); err != nil {
		return response.BadRequest(ctx, err.Error())
	}
	return response.OK(ctx, "booking rejected")
}

func (c *AdminController) GetAllUsers(ctx *fiber.Ctx) error {
	users, err := c.userSvc.GetAll()
	if err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, users)
}

type updateRoleRequest struct {
	Role model.UserRole `json:"role"`
}

func (c *AdminController) UpdateUserRole(ctx *fiber.Ctx) error {
	empID := ctx.Params("emp_id")
	if empID == "" {
		return response.BadRequest(ctx, "emp_id param is required")
	}
	var req updateRoleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return response.BadRequest(ctx, "invalid request body")
	}
	if req.Role != model.RoleUser && req.Role != model.RoleAdmin && req.Role != model.RoleSuperAdmin {
		return response.BadRequest(ctx, "role must be User, Admin, or SuperAdmin")
	}
	if err := c.userSvc.UpdateRole(empID, req.Role); err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, "user role updated")
}

func (c *AdminController) GetBookingLogs(ctx *fiber.Ctx) error {
	logs, err := c.bookingSvc.GetBookingLogs()
	if err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, logs)
}

func (c *AdminController) DeleteUser(ctx *fiber.Ctx) error {
	empID := ctx.Params("emp_id")
	if empID == "" {
		return response.BadRequest(ctx, "emp_id param is required")
	}
	if err := c.userSvc.Delete(empID); err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, "user deleted successfully")
}
