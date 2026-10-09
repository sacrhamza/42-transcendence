#!/usr/bin/env bash

set -e

log() {
	echo "MINIO_LOG: [$(date)] $@"
}

# NOTE: function used to extract and set access key and secret key
# using native bash funcionalities, -1 get the last element in an array
function set_creds() {
	read -r -a access_array
	read -r -a secret_array

	prometheus_access_key="${access_array[-1]}"
	prometheus_secret_key="${secret_array[-1]}"

	log "set prometheus_secret_key and prometheus_access_key"
	echo $prometheus_access_key
	echo $prometheus_secret_key
}

# temprory server
log "run minio temprory server"
"$@" &
minio_server_pid="$!"


mc alias set local http://localhost:${MINIO_WEBUI_PORT} "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"


# mc alias set local
mc admin accesskey create local --name "prometheus-scrape" --description "Used by Prometheus to scrape metrics" --policy /minio/prometheus-scrape.json | set_creds

log "set prometheus alias 'myaistor-prometheus'"
mc alias set myaistor-prometheus http://minio:minio_api_port "${prometheus_access_key}" "${prometheus_secret_key}"


log "stop minio temprory server"
mc admin service stop local


# # setup prometheus config
# log "setup prometheus config and put it in ${PROMETHEUS_SCRAPE_DIR}"
#
# # exec $@
log "exec minio server"
exec "$@"
