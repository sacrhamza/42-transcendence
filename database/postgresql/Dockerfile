ARG VERSION='18-alpine'

FROM postgres:${VERSION}

COPY --chmod=0755 ./tools/psql_healthcheck.sh /usr/local/bin

RUN apk add gettext
