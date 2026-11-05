ARG VERSION=3.16-rc-trixie
FROM python:${VERSION}

# Use the same uv version as the local development environment.
# COPY --from=ghcr.io/astral-sh/uv:0.9.13 /uv /uvx /bin/
RUN pip install fastapi[standard]
RUN pip install uv
WORKDIR /app

# Install locked dependencies first so source changes don't invalidate this layer.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project
# RUN pip install fastAPI
# RUN pip install "uvicorn[standard]" 
# RUN pip3 install mypy flake8

# Add the FastAPI application.
COPY srcs/ ./srcs/

# Add the entrypoint shell script
COPY --chmod=755 ./tools/docker-entrypoint.sh /usr/local/bin/

EXPOSE 8000

# Launch the script, listen on all container interfaces so other containers can reach the API.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["uv", "run", "--no-sync", "fastapi", "run", "srcs/main.py", "--host", "0.0.0.0", "--port", "8000"]
