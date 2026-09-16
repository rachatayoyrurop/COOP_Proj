package service

import (
	"errors"
	"time"

	"pea-room-booking/internal/config"
	"pea-room-booking/internal/model"
	"pea-room-booking/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type Claims struct {
	EmpID string         `json:"emp_id"`
	Role  model.UserRole `json:"role"`
	jwt.RegisteredClaims
}

type AuthService interface {
	Login(empID, fullName, department, email string) (string, *model.User, error)
	Register(empID, fullName, department, email string) (*model.User, error)
	ParseToken(tokenStr string) (*Claims, error)
}

type authService struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) AuthService {
	return &authService{userRepo: userRepo, cfg: cfg}
}

func (s *authService) Login(empID, fullName, department, email string) (string, *model.User, error) {
	user, err := s.userRepo.FindByEmpID(empID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, errors.New("ไม่พบผู้ใช้งานนี้ในระบบฐานข้อมูล หรือบัญชีนี้ถูกลบไปแล้ว")
		}
		return "", nil, err
	}

	// Sync fields if they changed or are provided
	user.FullName = fullName
	user.Department = department
	if email != "" {
		user.Email = email
	}

	// Override role for seeded admin accounts during simulated SSO login
	if empID == "EMP999" {
		user.Role = model.RoleSuperAdmin
	} else if empID == "EMP001" {
		user.Role = model.RoleAdmin
	}

	if err := s.userRepo.Upsert(user); err != nil {
		return "", nil, err
	}

	token, err := s.generateToken(user)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

func (s *authService) Register(empID, fullName, department, email string) (*model.User, error) {
	_, err := s.userRepo.FindByEmpID(empID)
	if err == nil {
		return nil, errors.New("รหัสพนักงานนี้ถูกใช้งานในระบบแล้ว")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	user := &model.User{
		EmpID:      empID,
		FullName:   fullName,
		Email:      email,
		Role:       model.RoleUser,
		Department: department,
	}

	if err := s.userRepo.Upsert(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) generateToken(user *model.User) (string, error) {
	claims := Claims{
		EmpID: user.EmpID,
		Role:  user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *authService) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
