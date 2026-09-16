package repository

import (
	"pea-room-booking/internal/model"

	"gorm.io/gorm"
)

type UserRepository interface {
	FindByEmpID(empID string) (*model.User, error)
	Upsert(user *model.User) error
	FindAll() ([]model.User, error)
	UpdateRole(empID string, role model.UserRole) error
	Delete(empID string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByEmpID(empID string) (*model.User, error) {
	var user model.User
	err := r.db.Where("emp_id = ?", empID).First(&user).Error
	return &user, err
}

func (r *userRepository) Upsert(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) FindAll() ([]model.User, error) {
	var users []model.User
	err := r.db.Order("full_name ASC").Find(&users).Error
	return users, err
}

func (r *userRepository) UpdateRole(empID string, role model.UserRole) error {
	var count int64
	if err := r.db.Model(&model.User{}).Where("emp_id = ?", empID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		newUser := model.User{
			EmpID:    empID,
			FullName: "พนักงาน " + empID,
			Role:     role,
		}
		return r.db.Create(&newUser).Error
	}
	return r.db.Model(&model.User{}).
		Where("emp_id = ?", empID).
		Update("role", role).Error
}

func (r *userRepository) Delete(empID string) error {
	return r.db.Where("emp_id = ?", empID).Delete(&model.User{}).Error
}
