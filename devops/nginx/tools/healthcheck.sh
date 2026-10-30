#!/usr/bin/env sh

set -e

ADDR="127.0.0.1"

# when using wget i see log of nginx about getting sigchild from a process
# and after some analytics i found that the process is ssl_client
# that wget uses it
wget   "$ADDR:${NGINX_STUB_STATUS_PORT}/${NGINX_STUB_STATUS}"
wget  --no-check-certificate https://"$ADDR:${NGINX_PORT}/"
