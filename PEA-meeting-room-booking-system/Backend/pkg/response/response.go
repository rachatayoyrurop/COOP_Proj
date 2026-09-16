package response

import "github.com/gofiber/fiber/v2"

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(ctx *fiber.Ctx, data interface{}) error {
	return ctx.Status(fiber.StatusOK).JSON(APIResponse{Success: true, Data: data})
}

func Created(ctx *fiber.Ctx, data interface{}) error {
	return ctx.Status(fiber.StatusCreated).JSON(APIResponse{Success: true, Data: data})
}

func BadRequest(ctx *fiber.Ctx, msg string) error {
	return ctx.Status(fiber.StatusBadRequest).JSON(APIResponse{Success: false, Message: msg})
}

func Unauthorized(ctx *fiber.Ctx, msg string) error {
	return ctx.Status(fiber.StatusUnauthorized).JSON(APIResponse{Success: false, Message: msg})
}

func Forbidden(ctx *fiber.Ctx, msg string) error {
	return ctx.Status(fiber.StatusForbidden).JSON(APIResponse{Success: false, Message: msg})
}

func NotFound(ctx *fiber.Ctx, msg string) error {
	return ctx.Status(fiber.StatusNotFound).JSON(APIResponse{Success: false, Message: msg})
}

func InternalError(ctx *fiber.Ctx, msg string) error {
	return ctx.Status(fiber.StatusInternalServerError).JSON(APIResponse{Success: false, Message: msg})
}
