package service

import (
	"pea-room-booking/internal/model"
	"pea-room-booking/internal/repository"
)

type RoomService interface {
	GetAll(includeInactive bool) ([]model.Room, error)
	GetByID(id uint) (*model.Room, error)
	Create(room *model.Room) error
	Update(id uint, input *model.Room) error
	Delete(id uint) error
}

type roomService struct {
	repo repository.RoomRepository
}

func NewRoomService(repo repository.RoomRepository) RoomService {
	return &roomService{repo: repo}
}

func (s *roomService) GetAll(includeInactive bool) ([]model.Room, error) {
	return s.repo.FindAll(includeInactive)
}

func (s *roomService) GetByID(id uint) (*model.Room, error) {
	return s.repo.FindByID(id)
}

func (s *roomService) Create(room *model.Room) error {
	room.IsActive = true
	return s.repo.Create(room)
}

func (s *roomService) Update(id uint, input *model.Room) error {
	room, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	room.RoomName = input.RoomName
	room.Building = input.Building
	room.Capacity = input.Capacity
	room.MicCount = input.MicCount
	room.PcCount = input.PcCount
	room.ScreenCount = input.ScreenCount
	room.Images = input.Images
	return s.repo.Update(room)
}

func (s *roomService) Delete(id uint) error {
	return s.repo.SoftDelete(id)
}
