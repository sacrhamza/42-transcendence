FROM redis:8.10.3-alpine

USER redis

COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
