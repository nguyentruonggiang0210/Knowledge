# The tag is convenient for a local lab. CI must override PYTHON_IMAGE with an
# approved immutable digest, for example registry/image@sha256:<digest>.
ARG PYTHON_IMAGE=python:3.13-slim
FROM ${PYTHON_IMAGE}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin app

WORKDIR /app
COPY --chown=10001:10001 app/server.py /app/server.py

USER 10001:10001
EXPOSE 8080
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=2)"]

CMD ["python", "/app/server.py"]
