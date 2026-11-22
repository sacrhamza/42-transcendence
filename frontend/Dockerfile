ARG VERSION=26-bookworm-slim
FROM node:${VERSION}


WORKDIR /app


RUN npm install
RUN npm install -g @angular/cli

ENTRYPOINT ["npm", "start"]
