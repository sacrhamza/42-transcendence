FROM alpine:3.24.2 as base

RUN apk add gettext

FROM prom/prometheus:v3.13.4

# NOTE: this is not a smart move but i need envsubst
# there is other options like:
# 1. use cat with heredoc
# 2. use eval
# all of them has bad effects

COPY --from=base /usr/lib/libintl* /usr/lib/
COPY --from=base /lib/ld-*  /lib/
COPY --from=base /usr/bin/envsubst /usr/bin/
RUN mkdir /etc/prometheus/scrapes.d

COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# or

# FROM base
#
# COPY --from=prom/prometheus:v3.13.4 /bin/prometheus /bin/
# COPY --from=prom/prometheus:v3.13.4 /bin/promtool /bin/
#
# RUN mkdir /etc/prometheus/scrapes.d
#
# COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/
#
# ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
