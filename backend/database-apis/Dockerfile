ARG VERSION=3.16.0a1-slim-trixie
FROM python:${VERSION}

RUN pip install fastAPI
RUN pip install "uvicorn[standard]" 
RUN pip3 install mypy flake8

COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["some_command"]
