FROM mariadb

RUN apt update
RUN apt install -y gettext-base

RUN apt install -y vim

WORKDIR /docker-entrypoint-initdb.d
COPY ./tools/init.sh .
RUN chmod +x ./init.sh

CMD ["mariadbd"]
