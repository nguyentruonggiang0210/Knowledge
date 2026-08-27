# syntax=docker/dockerfile:1

# The React bundle is built and validated on the local workstation first.
# This image is deliberately runtime-only because the content sync scripts need
# the sibling knowledge folders that are not part of this Docker build context.
FROM nginx:stable-alpine

LABEL org.opencontainers.image.title="Summarize Knowledge Web" \
      org.opencontainers.image.description="Responsive React learning atlas" \
      org.opencontainers.image.source="local-workspace"

RUN rm -f /etc/nginx/conf.d/default.conf

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx dist/ /usr/share/nginx/html/

# nginx listens on an unprivileged port and writes its PID/temp files to /tmp,
# so the container can run as nginx with every Linux capability dropped.
USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

STOPSIGNAL SIGQUIT

