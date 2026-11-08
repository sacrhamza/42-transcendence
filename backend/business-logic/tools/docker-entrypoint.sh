#!/usr/bin/env sh

set -eu


. /run/secrets/suf_user
. /run/secrets/suf_password
. /run/secrets/redis_password

: "${SUF_USER:?POSTGRES_DB is required}"
: "${SUF_PASSWORD:?SUF_PASSWORD is required}"
: "${POSTGRES_PORT:?POSTGRES_PORT is required}"
: "${REDIS_PORT:?REDIS_PORT is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${REDIS_PASSWORD:?REDIS_PASSWORD is required}"

export POSTGRES_URL="postgresql://${SUF_USER}:${SUF_PASSWORD}@postgresql:${POSTGRES_PORT}/${POSTGRES_DB}"
export REDIS_URL="redis://default:${REDIS_PASSWORD}@redis:${REDIS_PORT}"

npx prisma db pull

exec "$@"