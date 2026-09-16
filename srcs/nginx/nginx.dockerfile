FROM nginx:1.31.6-alpine-slim

RUN rm -rf /etc/nginx/conf.d/default.conf

