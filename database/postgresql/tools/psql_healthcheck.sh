#!/usr/bin/env sh

set -e

# load env from  suf_user
# the expected format is key=value, SUF_USER='username'
. /run/secrets/suf_user

# check if SUF_USER and POSTGRES_DB
# are not empty
if [ -z "$SUF_USER" ] || [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_PORT" ]
then
  printf "no SUF_USER, SUF_PASSWORD" 1>&2
  exit 1
fi

# test postgresql is healthy or not
pg_isready --port="$POSTGRES_PORT" --username="$SUF_USER"   --dbname="$POSTGRES_DB"
