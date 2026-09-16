package database

import (
	"fmt"
	"log"

	"pea-room-booking/internal/config"
	"pea-room-booking/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Bangkok",
		cfg.DBHost, cfg.DBUser, cfg.DBPass, cfg.DBName, cfg.DBPort, cfg.DBSSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Info),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	createEnumTypes(db)

	if err := db.AutoMigrate(
		&model.User{},
		&model.Room{},
		&model.Booking{},
		&model.BookingLog{},
	); err != nil {
		log.Fatalf("auto-migrate failed: %v", err)
	}

	seedDefaultUsers(db)

	log.Println("database connected and migrated")
	return db
}

func seedDefaultUsers(db *gorm.DB) {
	defaultUsers := []model.User{
		{
			EmpID:      "EMP001",
			FullName:   "ผู้ดูแลระบบ (Admin)",
			Department: "กองคอมพิวเตอร์",
			Email:      "admin@pea.co.th",
			Role:       model.RoleAdmin,
		},
		{
			EmpID:      "EMP999",
			FullName:   "ผู้ดูแลระบบสูงสุด (SuperAdmin)",
			Department: "กองระบบสารสนเทศ",
			Email:      "superadmin@pea.co.th",
			Role:       model.RoleSuperAdmin,
		},
		{
			EmpID:      "EMP123",
			FullName:   "สมชาย ใจดี",
			Department: "กองบัญชีและการเงิน",
			Email:      "somchai@pea.co.th",
			Role:       model.RoleUser,
		},
	}

	for _, u := range defaultUsers {
		var count int64
		_ = db.Model(&model.User{}).Where("emp_id = ?", u.EmpID).Count(&count)
		if count == 0 {
			_ = db.Create(&u)
		}
	}
}

// createEnumTypes creates PostgreSQL ENUM types if they don't exist.
// Must run before AutoMigrate so GORM can reference the types in column definitions.
func createEnumTypes(db *gorm.DB) {
	statements := []string{
		`DO $$ BEGIN
			IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
				CREATE TYPE user_role AS ENUM ('User', 'Admin', 'SuperAdmin');
			END IF;
		END $$;`,

		`DO $$ BEGIN
			IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
				CREATE TYPE booking_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Canceled');
			END IF;
		END $$;`,
	}

	for _, stmt := range statements {
		if err := db.Exec(stmt).Error; err != nil {
			log.Fatalf("failed to create enum type: %v", err)
		}
	}
}
