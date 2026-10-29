FROM quay.io/minio/aistor/minio

COPY --chmod=7555 ./tools/custom-entrypoint.sh /usr/local/bin

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
