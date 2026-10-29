#!/usr/bin/env sh

set -e

log() {
	PURPLE='\033[35m'
	RESET='\033[0m'
	YELLOW='\033[33m'
	GREEN='\033[32m'
	echo -e "${PURPLE}MINIO_LOG: ${YELLOW}[$(date '+%Y-%m-%d %H:%M')] ${GREEN}$*${RESET}"
}

DOMAIN_NAME=${DOMAIN_NAME:=localhost}


mkdir /etc/nginx/ssl
openssl genrsa -out /etc/nginx/ssl/server.key 4096
openssl req -x509 -key ssl/private/server.key -out ssl/certs/certificate.pem -subj "/C=US/ST=ls/L=hey/O=hey/CN=${DOMAIN_NAME}"

log "DOMAIN_NAME = ${DOMAIN_NAME}"
