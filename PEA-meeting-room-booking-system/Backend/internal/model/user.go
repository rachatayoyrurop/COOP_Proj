package model

import "time"

type UserRole string

const (
	RoleUser       UserRole = "User"
	RoleAdmin      UserRole = "Admin"
	RoleSuperAdmin UserRole = "SuperAdmin"
)

type User struct {
	EmpID      string    `gorm:"primaryKey"                       json:"emp_id"`
	FullName   string    `gorm:"not null"                         json:"full_name"`
	Email      string    `json:"email"`
	Role       UserRole  `gorm:"type:user_role;default:'User'"    json:"role"`
	Department string    `json:"department"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
