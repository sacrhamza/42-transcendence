#!/usr/bin/env sh

set -e 

random_text() {
	len=$1
	tr -dc [:alnum:] < /dev/urandom | head -c "${len}"
}

echo '
MINIO_API_PORT=9999
MINIO_WEBUI_PORT=8000

NGINX_STUB_STATUS_SCHEME=http
NGINX_ADDR=nginx
NGINX_STUB_STATUS_PORT=8888
NGINX_STUB_STATUS=/stub_status

NGINX_EXPORTER=6000
' > .env

mkdir -p minio/minio_data

echo "
MINIO_ROOT_USER='$(random_text 10)'
MINIO_ROOT_PASSWORD='$(random_text 10)'
" > ./minio/minio_creds.sh

