#!/usr/bin/env sh

set -e

wget -O /dev/null  127.0.0.1:${NGINX_STUB_STATUS_PORT}/${NGINX_STUB_STATUS}
