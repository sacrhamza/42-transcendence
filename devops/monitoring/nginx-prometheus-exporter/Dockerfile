ARG VERSION='3.24.2'

FROM alpine:${VERSION}
COPY --from=nginx/nginx-prometheus-exporter /usr/bin/* /usr/bin/

COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
