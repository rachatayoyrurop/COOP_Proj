package main

import (
	"log"

	"pea-room-booking/internal/config"
	"pea-room-booking/internal/database"
	"pea-room-booking/internal/route"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg)
	app := route.Setup(db, cfg)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
