#!/usr/bin/env sh

set -eu


POSTGRES_USER=$(cat /run/secrets/postgres_user)
POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)


export POSTGRES_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgresql:${POSTGRES_PORT}/${POSTGRES_DB}"

exec "$@"
