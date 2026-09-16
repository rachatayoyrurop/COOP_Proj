package service

import (
	"pea-room-booking/internal/model"
	"pea-room-booking/internal/repository"
)

type UserService interface {
	GetAll() ([]model.User, error)
	GetByEmpID(empID string) (*model.User, error)
	UpdateRole(empID string, role model.UserRole) error
	Delete(empID string) error
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetAll() ([]model.User, error) {
	return s.repo.FindAll()
}

func (s *userService) GetByEmpID(empID string) (*model.User, error) {
	return s.repo.FindByEmpID(empID)
}

func (s *userService) UpdateRole(empID string, role model.UserRole) error {
	return s.repo.UpdateRole(empID, role)
}

func (s *userService) Delete(empID string) error {
	return s.repo.Delete(empID)
}
