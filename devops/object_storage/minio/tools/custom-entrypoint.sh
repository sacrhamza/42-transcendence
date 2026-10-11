#!/usr/bin/env bash

set -e

source /run/secrets/minio_creds.sh

: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"
: "${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
: "${MINIO_API_PORT:?MINIO_API_PORT is required}"
: "${MINIO_WEBUI_PORT:?MINIO_WEBUI_PORT is required}"

log() {
	PURPLE='\033[35m'
	RESET='\033[0m'
	YELLOW='\033[33m'
	GREEN='\033[32m'
	echo -e "${PURPLE}MINIO_LOG: ${YELLOW}[$(date '+%Y-%m-%d %H:%M')] ${GREEN}$*${RESET}"
}

# NOTE: function used to extract and set access key and secret key
# using native bash funcionalities, -1 get the last element in an array
function set_creds() {
	read -r -a access_array
	read -r -a secret_array

	prometheus_access_key="${access_array[-1]}"
	prometheus_secret_key="${secret_array[-1]}"
}

generate_prometheus() {
	# NOTE: that command outputs prometheus minio config yaml
	mc admin prometheus generate 'myaistor-prometheus' cluster > /scrapes.d/minio_prometheus.yml
}

# temprory server
log "run minio temprory server"
"$@" &

# NOTE: the minio server pid is unused
minio_server_pid="$!"

log "sleep until server is live"
until curl -sSf  "http://minio:${MINIO_API_PORT}/minio/health/live"
do
	sleep 0.5
done

log "server is live"
log "set local alias"
mc alias set local "http://minio:${MINIO_API_PORT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

log "set prometheus_secret_key and prometheus_access_key"
set_creds <<< "$(mc admin accesskey create local --name "prometheus-scrape" --description "Used by Prometheus to scrape metrics" --policy /minio/prometheus-scrape.json)"

log "set prometheus alias 'myaistor-prometheus'"
mc alias set 'myaistor-prometheus' "http://minio:${MINIO_API_PORT}" "${prometheus_access_key}" "${prometheus_secret_key}"

log "generate prometheus config"
generate_prometheus

log "stop minio temprory server"
mc admin service stop local

log "exec minio server"
exec docker-entrypoint.sh "$@"
