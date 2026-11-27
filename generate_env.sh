#!/usr/bin/env bash

echo "
#NGINX
NGINX_STUB_STATUS_SCHEME=http
NGINX_ADDR=nginx
NGINX_STUB_STATUS_PORT=8888
NGINX_STUB_STATUS=/stub_status

NGINX_PORT=6666

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
NGINX_EXPORTER_PORT=9001


#============================== Nodemailer config =================#
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM='Transcendence <synadesigner@gmail.com>'

JWT_ACCESS_SECRET=4ed6d28a164f0bf77dca28577e5e51278a7899e23c403883d1adfee9f96bd36e
JWT_REFRESH_SECRET=e7d3f67da4e4f6eab8644be961f7da66b2023d95f2b0fe0d1703030c32f36da4

#=============================PROMETHEUS================================#
PROMETHEUS_PORT=9000

#================================ NESTJS BACKEND========================#
NESTJS_PORT=6000
NEST_URL='http://localhost:6000/'

#=============================ELK STACK=================================#
ELASTIC_PORT=3000
ELASTIC_DATA_DIR='/var/lib/elasticsearch/'
ELASTIC_LOGS_DIR='/var/log/elasticsearch/'

#============================EXPORTERS==================================#
POSTGRES_EXPORTER_PORT=9121
ALERTMANGER_PORT=9121
GF_SERVER_HTTP_PORT=9121


#=============================GRAFANA====================================#
GF_SERVER_HTTP_PORT=7800
GF_PATH_LOGS=/var/logs/grafana
GF_PATH_PROVISIONING=/etc/grafana/provisioning/

" > .env


mkdir -p secrets/postgresql/suf

printf "SUF_USER=suf" > ./secrets/postgresql/suf/suf_user
echo "SUF_PASSWORD=$(openssl rand -hex 32)" > ./secrets/postgresql/suf/suf_password

printf "postgres" > ./secrets/postgresql/postgres_user
openssl rand -hex 32 > ./secrets/postgresql/postgres_password

mkdir -p secrets/redis
REDIS_PASSWORD=$(openssl rand -hex 32)
printf "%s" "REDIS_PASSWORD='$REDIS_PASSWORD'"  > ./secrets/redis/redis_password

mkdir -p secrets/redis_exporter/

source .env

echo "{
    \"redis://redis:${REDIS_PORT}\": \"${REDIS_PASSWORD}\"
}" > secrets/redis_exporter/redis_exporter.json


create_pass() {
  file="$1"
  if [ -f "$1" ]
  then
  chmod 777 "$1"
  fi
  openssl rand -hex 32 > "$file"
  # chown 1000:1000 "$file"
  chmod 400 "$file"
}

# create grafana secrets
create_pass ./secrets/grafana/grafana_password
echo -n 'hamza' > ./secrets/grafana/grafana_user


mkdir -p ./secrets/elasticsearch
create_pass ./secrets/elasticsearch/elastic_password
