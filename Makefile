COMPOSE  = docker compose up --build

up:
	$(COMPOSE)	



all: up

fastapi-backend:
	$(COMPOSE) "$@"


frontend:
	$(COMPOSE) "$@"

fclean: clean
	echo fclean


clean:
	echo clean



