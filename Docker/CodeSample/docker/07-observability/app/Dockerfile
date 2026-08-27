# syntax=docker/dockerfile:1
FROM python:3.13-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
RUN addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app app
WORKDIR /app
COPY --chown=10001:10001 server.py ./
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=2s --start-period=3s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=1)"]
ENTRYPOINT ["python", "/app/server.py"]
