#!/usr/bin/env bash

set -eu

test_postgres() {
  docker cp ./database_tests.sh postgresql:/tmp/
  docker cp ./users.sql postgresql:/tmp/
  docker exec -it postgresql /tmp/database_tests.sh > "./logs/users-$(date -u +%Y-%m-%d-%H:%M:%S).md"
}

test_postgres
