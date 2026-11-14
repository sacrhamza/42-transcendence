#!/usr/bin/env bash

echo "
#NGINX
NGINX_STUB_STATUS_SCHEME=http
NGINX_ADDR=nginx
NGINX_STUB_STATUS_PORT=8888
NGINX_STUB_STATUS=/stub_status

NGINX_PORT=3000

# ========================== POSTGRESQL ========================== #
POSTGRES_DB=postgres
# to generate a strong  password you can use: openssl rand -hex 32, 32 means 32 char
POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
POSTGRES_USER_FILE=/run/secrets/postgres_user
PGDATA=/var/lib/postgresql
POSTGRES_PORT=5432

# ========================== REDIS ========================== #
REDIS_PORT=6379

# ======================== NGINX EXPORTER ======================= #
NGINX_EXPORTER_PORT=9000


#============================== Nodemailer config =================#
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM='Transcendence <synadesigner@gmail.com>'

JWT_ACCESS_SECRET=4ed6d28a164f0bf77dca28577e5e51278a7899e23c403883d1adfee9f96bd36e
JWT_REFRESH_SECRET=e7d3f67da4e4f6eab8644be961f7da66b2023d95f2b0fe0d1703030c32f36da4

#================================ NESTJS BACKEND========================#
NESTJS_PORT=6000
" > .env


mkdir -p secrets/postgresql/suf

printf "SUF_USER=suf" > ./secrets/postgresql/suf/suf_user
echo "SUF_PASSWORD=$(openssl rand -hex 32)" > ./secrets/postgresql/suf/suf_password

printf "postgres" > ./secrets/postgresql/postgres_user
openssl rand -hex 32 > ./secrets/postgresql/postgres_password

mkdir -p secrets/redis

printf "%s" "REDIS_PASSWORD='$(openssl rand -hex 32)'"  > ./secrets/redis/redis_password
