# syntax=docker/dockerfile:1
FROM python:3.13-slim AS build

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /build
RUN python -m venv /venv
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    /venv/bin/pip install --requirement requirements.txt

FROM python:3.13-slim AS runtime

ENV PATH=/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin app
WORKDIR /app
COPY --from=build /venv /venv
COPY --chown=10001:10001 app.py migrate.py ./
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=2s --start-period=5s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/live', timeout=1)"]
CMD ["gunicorn", "--bind=0.0.0.0:8080", "--workers=2", "--threads=4", "--timeout=30", "--graceful-timeout=20", "--access-logfile=-", "--error-logfile=-", "app:app"]
