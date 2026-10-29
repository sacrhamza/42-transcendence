ARG VERSION=26-bookworm-slim
FROM node:${VERSION}


COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["some_command"]
