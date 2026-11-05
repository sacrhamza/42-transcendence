#!/usr/bin/env sh

set -eu


. /run/secrets/suf_user
. /run/secrets/suf_password


export POSTGRES_URL="postgresql://${SUF_USER}:${SUF_PASSWORD}@postgresql:${POSTGRES_PORT}/${POSTGRES_DB}"

npx prisma db pull

exec "$@"