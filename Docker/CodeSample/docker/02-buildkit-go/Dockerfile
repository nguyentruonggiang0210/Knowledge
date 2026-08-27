# syntax=docker/dockerfile:1
FROM golang:alpine AS build

WORKDIR /src
COPY go.mod ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY cmd/ ./cmd/
ARG TARGETOS
ARG TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64} \
    go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM alpine:3.23 AS runtime
RUN apk add --no-cache ca-certificates \
    && addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app app
COPY --from=build --chown=10001:10001 /out/server /usr/local/bin/server
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=2s --start-period=3s --retries=3 \
  CMD ["/usr/local/bin/server", "healthcheck"]
ENTRYPOINT ["/usr/local/bin/server"]

FROM runtime AS debug
USER root
RUN apk add --no-cache curl busybox-extras
USER 10001:10001
