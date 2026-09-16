package controller

import (
	"pea-room-booking/internal/service"
	"pea-room-booking/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AuthController struct {
	authSvc service.AuthService
}

func NewAuthController(authSvc service.AuthService) *AuthController {
	return &AuthController{authSvc: authSvc}
}

type loginRequest struct {
	EmpID      string `json:"emp_id"`
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Email      string `json:"email"`
}

// Login handles SSO callback — accepts emp_id, full_name, department from SSO payload
// and returns a JWT for subsequent requests.
func (c *AuthController) Login(ctx *fiber.Ctx) error {
	var req loginRequest
	if err := ctx.BodyParser(&req); err != nil {
		return response.BadRequest(ctx, "invalid request body")
	}
	if req.EmpID == "" || req.FullName == "" {
		return response.BadRequest(ctx, "emp_id and full_name are required")
	}

	token, user, err := c.authSvc.Login(req.EmpID, req.FullName, req.Department, req.Email)
	if err != nil {
		return response.BadRequest(ctx, err.Error())
	}
	return response.OK(ctx, fiber.Map{"token": token, "emp_id": user.EmpID, "user": user})
}

// Register handles new user registration inside GORM
func (c *AuthController) Register(ctx *fiber.Ctx) error {
	var req loginRequest
	if err := ctx.BodyParser(&req); err != nil {
		return response.BadRequest(ctx, "invalid request body")
	}
	if req.EmpID == "" || req.FullName == "" {
		return response.BadRequest(ctx, "emp_id and full_name are required")
	}

	user, err := c.authSvc.Register(req.EmpID, req.FullName, req.Department, req.Email)
	if err != nil {
		return response.BadRequest(ctx, err.Error())
	}
	return response.OK(ctx, fiber.Map{"emp_id": user.EmpID, "user": user})
}

func (c *AuthController) Me(ctx *fiber.Ctx) error {
	return response.OK(ctx, fiber.Map{
		"emp_id": ctx.Locals("emp_id"),
		"role":   ctx.Locals("role"),
	})
}
