#!/usr/bin/env sh

echo "
#NGINX
NGINX_STUB_STATUS_SCHEME=http
NGINX_ADDR=nginx
NGINX_STUB_STATUS_PORT=8888
NGINX_STUB_STATUS=/stub_status

NGINX_PORT=3000

# ========================== POSTGRESQL ========================== #
POSTGRES_DB=postgres
# to generate a strong  password you can use: openssl rand -base64 32, 32 means 32 char
POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
POSTGRES_USER_FILE=/run/secrets/postgres_user
PGDATA=/var/lib/postgresql
" > .env


mkdir -p secrets/postgresql/suf

printf "SUF_USER=suf" > ./secrets/postgresql/suf/suf_user
echo "SUF_PASSWORD=$(openssl rand -base64 32)" > ./secrets/postgresql/suf/suf_password

printf "postgres" > ./secrets/postgresql/postgres_user
openssl rand -base64 32 > ./secrets/postgresql/postgres_password
