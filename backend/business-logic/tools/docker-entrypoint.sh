#!/usr/bin/env sh

set -eu


. /run/secrets/suf_user
. /run/secrets/suf_password

: "${SUF_USER:?POSTGRES_DB is required}"
: "${SUF_PASSWORD:?SUF_PASSWORD is required}"
: "${POSTGRES_PORT:?POSTGRES_PORT is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

export POSTGRES_URL="postgresql://${SUF_USER}:${SUF_PASSWORD}@postgresql:${POSTGRES_PORT}/${POSTGRES_DB}"

exec "$@"
