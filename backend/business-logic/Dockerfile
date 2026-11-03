ARG VERSION=26-bookworm-slim
FROM node:${VERSION}

WORKDIR /app

COPY . .
RUN npm install
RUN npm i -g @nestjs/cli@12.0.11
RUN npm run build

COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
