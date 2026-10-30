#!/usr/bin/env sh

set -e

# usage: log text text text, print anything passed to this function in stdout
# and print also time
# ex: log "create init file"
log() {
  if [ "${PRODUCTION}" = "true" ]
  then
    printf  "\033[35mPOSTGRES_LOG: \033[33m[%s] \033[32m$*\033[0m" "$(date '+%Y-%m-%d %H:%M:%S')"
  else
    printf  "POSTGRES_LOG: [%s] $*" "$(date '+%Y-%m-%d %H:%M:%S')"
  fi
  echo
}

DOMAIN_NAME=${DOMAIN_NAME:=localhost}


log "create server self signed certificate"
mkdir -p /etc/nginx/ssl
openssl genrsa -out /etc/nginx/ssl/server.key 4096
openssl req -x509 -key /etc/nginx/ssl/server.key \
  -out /etc/nginx/ssl/certificate.pem \
  -subj "/C=MA/ST=Marrakesh-Safi/L=bengurir/O=42-transcendence/CN=${DOMAIN_NAME}"

log "DOMAIN_NAME = ${DOMAIN_NAME}"
