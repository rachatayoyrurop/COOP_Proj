package route

import (
	"pea-room-booking/internal/config"
	"pea-room-booking/internal/controller"
	"pea-room-booking/internal/middleware"
	"pea-room-booking/internal/model"
	"pea-room-booking/internal/repository"
	"pea-room-booking/internal/service"

	"github.com/gofiber/fiber/v2"
	fiberCors "github.com/gofiber/fiber/v2/middleware/cors"
	fiberLogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, cfg *config.Config) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName: "PEA Room Booking API v1",
	})

	app.Use(recover.New())
	app.Use(fiberLogger.New())
	app.Use(fiberCors.New(fiberCors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// --- wire up dependencies ---
	roomRepo := repository.NewRoomRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	userRepo := repository.NewUserRepository(db)
	logRepo := repository.NewBookingLogRepository(db)

	emailSvc := service.NewEmailService(cfg)
	authSvc := service.NewAuthService(userRepo, cfg)
	roomSvc := service.NewRoomService(roomRepo)
	bookingSvc := service.NewBookingService(bookingRepo, logRepo, roomRepo, userRepo, emailSvc)
	userSvc := service.NewUserService(userRepo)

	authCtrl := controller.NewAuthController(authSvc)
	roomCtrl := controller.NewRoomController(roomSvc)
	bookingCtrl := controller.NewBookingController(bookingSvc)
	adminCtrl := controller.NewAdminController(bookingSvc, userSvc)
	notificationCtrl := controller.NewNotificationController(db)

	authMW := middleware.Auth(authSvc)
	adminMW := middleware.RequireRole(model.RoleAdmin, model.RoleSuperAdmin)
	superAdminMW := middleware.RequireRole(model.RoleSuperAdmin)

	// --- routes ---
	api := app.Group("/api/v1")

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Auth
	auth := api.Group("/auth")
	auth.Post("/login", authCtrl.Login)
	auth.Post("/register", authCtrl.Register)
	auth.Get("/me", authMW, authCtrl.Me)

	// Notifications
	api.Get("/notifications", authMW, notificationCtrl.GetNotifications)

	// Rooms — public read
	rooms := api.Group("/rooms")
	rooms.Get("/", roomCtrl.GetAll)
	rooms.Get("/:id", roomCtrl.GetByID)

	// Bookings — authenticated users
	bookings := api.Group("/bookings", authMW)
	bookings.Post("/", bookingCtrl.Create)
	bookings.Get("/my", bookingCtrl.GetMyBookings)
	bookings.Get("/calendar", bookingCtrl.GetCalendar)
	bookings.Get("/:id", bookingCtrl.GetByID)
	bookings.Put("/:id/cancel", bookingCtrl.Cancel)

	// Admin — Admin + SuperAdmin
	admin := api.Group("/admin", authMW, adminMW)
	admin.Get("/bookings", adminCtrl.GetAllBookings)
	admin.Get("/bookings/pending", adminCtrl.GetPendingBookings)
	admin.Get("/bookings/search", adminCtrl.SearchByCode)
	admin.Put("/bookings/:id/approve", adminCtrl.Approve)
	admin.Put("/bookings/:id/reject", adminCtrl.Reject)

	// Super Admin — room & user management
	sa := api.Group("/superadmin", authMW, superAdminMW)
	sa.Post("/rooms", roomCtrl.Create)
	sa.Put("/rooms/:id", roomCtrl.Update)
	sa.Delete("/rooms/:id", roomCtrl.Delete)
	sa.Get("/users", adminCtrl.GetAllUsers)
	sa.Put("/users/:emp_id/role", adminCtrl.UpdateUserRole)
	sa.Delete("/users/:emp_id", adminCtrl.DeleteUser)
	sa.Get("/booking-logs", adminCtrl.GetBookingLogs)

	return app
}
