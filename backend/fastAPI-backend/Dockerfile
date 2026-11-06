ARG VERSION=3.16-rc-trixie
FROM python:${VERSION}

WORKDIR /app

COPY ./requirements.txt ./requirements.txt

RUN pip install --no-cache --upgrade -r ./requirements.txt

COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

COPY ./srcs/ ./srcs/

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["fastapi", "run", "srcs/main.py", "--host", "0.0.0.0", "--port", "8080"]
