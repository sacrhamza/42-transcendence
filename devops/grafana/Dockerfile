ARG VERSION='13.0.14-slim'
FROM grafana/grafana:${VERSION}

COPY --chmod=0755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
