#!/bin/sh

set -eu

: ${NGINX_STUB_STATUS_SCHEME?NGINX_STUB_STATUS_SCHEME is required}
: ${NGINX_ADDR?NGINX_ADDR is required}
: ${NGINX_STUB_STATUS_PORT?NGINX_STUB_STATUS_PORT is required}
: ${NGINX_STUB_STATUS?NGINX_STUB_STATUS is required}
: ${NGINX_EXPORTER_PORT?NGINX_EXPORTER_PORT is required}

SCRAPE_URI="${NGINX_STUB_STATUS_SCHEME}://${NGINX_ADDR}:${NGINX_STUB_STATUS_PORT}/${NGINX_STUB_STATUS}"

exec nginx-prometheus-exporter \
  --nginx.scrape-uri="$SCRAPE_URI" \
  --web.listen-address=":${NGINX_EXPORTER_PORT}"
