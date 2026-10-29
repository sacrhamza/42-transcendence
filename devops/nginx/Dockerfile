FROM nginx:1.31.6-alpine-slim

RUN apk add openssl
COPY --chmod=755 ./tools/healthcheck.sh  /usr/local/bin/healthcheck.sh
