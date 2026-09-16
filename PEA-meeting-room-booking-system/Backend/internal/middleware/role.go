package middleware

import (
	"pea-room-booking/internal/model"
	"pea-room-booking/pkg/response"

	"github.com/gofiber/fiber/v2"
)

func RequireRole(roles ...model.UserRole) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		roleStr, ok := ctx.Locals("role").(string)
		if !ok {
			return response.Unauthorized(ctx, "unauthorized")
		}
		userRole := model.UserRole(roleStr)
		for _, r := range roles {
			if userRole == r {
				return ctx.Next()
			}
		}
		return response.Forbidden(ctx, "insufficient permissions")
	}
}
