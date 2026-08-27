# syntax=docker/dockerfile:1
FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/sample-api ./

FROM scratch
LABEL org.opencontainers.image.title="sample-api" \
      org.opencontainers.image.description="Minimal Kubernetes curriculum HTTP service"
COPY --from=build /out/sample-api /sample-api
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/sample-api"]
