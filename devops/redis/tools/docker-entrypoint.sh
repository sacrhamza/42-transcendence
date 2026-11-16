#!/usr/bin/env sh

. /run/secrets/redis_password

: ${REDIS_PORT:?REDIS_PORT is required}
: ${REDIS_PASSWORD:?REDIS_PASSWORD is required}

exec redis-server --port "${REDIS_PORT}" --requirepass "${REDIS_PASSWORD}"
