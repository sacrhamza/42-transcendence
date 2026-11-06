COMPOSE  = docker compose up --build

up:
	$(COMPOSE)	


down:
	docker compose down

all: up

fastapi-backend:
	$(COMPOSE) "$@"


frontend:
	$(COMPOSE) "$@"

database:
	$(COMPOSE) "postgresql"

fclean: clean
	echo fclean


clean:
	echo clean


.PHONY: database
