package controller

import (
	"strconv"

	"pea-room-booking/internal/model"
	"pea-room-booking/internal/service"
	"pea-room-booking/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type RoomController struct {
	roomSvc service.RoomService
}

func NewRoomController(roomSvc service.RoomService) *RoomController {
	return &RoomController{roomSvc: roomSvc}
}

func (c *RoomController) GetAll(ctx *fiber.Ctx) error {
	includeInactive := ctx.QueryBool("include_inactive", false)
	rooms, err := c.roomSvc.GetAll(includeInactive)
	if err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, rooms)
}

func (c *RoomController) GetByID(ctx *fiber.Ctx) error {
	id, err := parseUintParam(ctx, "id")
	if err != nil {
		return response.BadRequest(ctx, "invalid room id")
	}
	room, err := c.roomSvc.GetByID(id)
	if err != nil {
		return response.NotFound(ctx, "room not found")
	}
	return response.OK(ctx, room)
}

func (c *RoomController) Create(ctx *fiber.Ctx) error {
	var room model.Room
	if err := ctx.BodyParser(&room); err != nil {
		return response.BadRequest(ctx, "invalid request body")
	}
	if room.RoomName == "" {
		return response.BadRequest(ctx, "room_name is required")
	}
	if err := c.roomSvc.Create(&room); err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.Created(ctx, room)
}

func (c *RoomController) Update(ctx *fiber.Ctx) error {
	id, err := parseUintParam(ctx, "id")
	if err != nil {
		return response.BadRequest(ctx, "invalid room id")
	}
	var room model.Room
	if err := ctx.BodyParser(&room); err != nil {
		return response.BadRequest(ctx, "invalid request body")
	}
	if err := c.roomSvc.Update(id, &room); err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, "room updated")
}

func (c *RoomController) Delete(ctx *fiber.Ctx) error {
	id, err := parseUintParam(ctx, "id")
	if err != nil {
		return response.BadRequest(ctx, "invalid room id")
	}
	if err := c.roomSvc.Delete(id); err != nil {
		return response.InternalError(ctx, err.Error())
	}
	return response.OK(ctx, "room deleted")
}

func parseUintParam(ctx *fiber.Ctx, key string) (uint, error) {
	v, err := strconv.ParseUint(ctx.Params(key), 10, 32)
	return uint(v), err
}
