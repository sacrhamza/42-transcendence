ARG VERSION=26-bookworm-slim
FROM node:${VERSION}


WORKDIR /app

# prisma needs openssl
RUN apt update -y
RUN apt install openssl -y

COPY . .
RUN npm install
RUN npm run build

COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
