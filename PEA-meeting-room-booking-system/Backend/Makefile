BINARY=./bin/server.exe
MAIN=./cmd/main.go

.PHONY: run build dev tidy test

run:
	go run $(MAIN)

build:
	go build -o $(BINARY) $(MAIN)

dev:
	air -c .air.toml

tidy:
	go mod tidy

test:
	go test ./... -v
