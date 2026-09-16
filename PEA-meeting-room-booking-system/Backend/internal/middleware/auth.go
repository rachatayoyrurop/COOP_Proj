package middleware

import (
	"strings"

	"pea-room-booking/internal/service"
	"pea-room-booking/pkg/response"

	"github.com/gofiber/fiber/v2"
)

func Auth(authSvc service.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		authHeader := ctx.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return response.Unauthorized(ctx, "missing or invalid authorization header")
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := authSvc.ParseToken(tokenStr)
		if err != nil {
			return response.Unauthorized(ctx, "invalid or expired token")
		}

		ctx.Locals("emp_id", claims.EmpID)
		ctx.Locals("role", string(claims.Role))
		return ctx.Next()
	}
}
