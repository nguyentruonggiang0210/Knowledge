# 02 — BuildKit + Go multi-stage

API không dependency ngoài, có graceful shutdown, JSON log và binary healthcheck. Dockerfile có cache mounts, runtime non-root và target debug riêng.

## Build và chạy

```bash
docker build --target runtime -t deep-docker/go-api:dev .
docker run --rm -d --name go-api -p 127.0.0.1:8082:8080 deep-docker/go-api:dev
curl http://localhost:8082/
curl http://localhost:8082/healthz
docker logs go-api
docker stop --time 15 go-api
```

PowerShell có thể dùng `Invoke-RestMethod http://localhost:8082/healthz` thay `curl` alias tùy cấu hình.

## Chứng minh non-root và health

```bash
docker inspect go-api --format '{{.Config.User}} {{json .State.Health}}'
docker top go-api
docker image history deep-docker/go-api:dev
```

## Thử cache

Build hai lần với output plain, lần hai phải reuse phần lớn steps:

```bash
docker buildx build --progress=plain --target runtime -t deep-docker/go-api:dev .
```

Sửa chuỗi response trong `cmd/server/main.go`, build lại. Download module vẫn được cache. Không xóa cache chỉ để làm build “chạy được”; hiểu layer nào invalid trước.

## Debug target

```bash
docker build --target debug -t deep-docker/go-api:debug .
docker run --rm -it --entrypoint sh deep-docker/go-api:debug
```

Production dùng target `runtime`, không cài curl/shell tool chỉ để debug.

## Multi-platform

Lệnh sau build và push manifest nhiều platform; thay image bằng registry bạn có quyền. Không chạy `--push` nếu chưa muốn thay đổi registry.

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t REGISTRY/NAMESPACE/go-api:git-SHA --push .
```

Các base tags trong lab là tag dễ chạy, không phải policy production. Hãy resolve và pin digest đã duyệt trong dự án thật.

Liên quan: [Bài 03](../../../Lessions/Docker/03-image-layer-registry.md), [Bài 04](../../../Lessions/Docker/04-dockerfile-thuc-chien.md), [Bài 05](../../../Lessions/Docker/05-buildkit-buildx.md).
