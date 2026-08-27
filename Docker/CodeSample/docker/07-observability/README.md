# 07 — Observability: structured logs + Prometheus

App Python stdlib phát JSON logs và Prometheus text metrics. Prometheus scrape qua service DNS trên network nội bộ.

## Chạy và tạo traffic

```bash
docker compose up --build -d --wait
curl http://localhost:8085/
curl http://localhost:8085/work?ms=120
curl http://localhost:8085/not-found
docker compose logs --tail 20 app
```

Mở Prometheus tại <http://localhost:9090> và query:

- `up{job="sample-app"}`
- `sample_http_requests_total`
- `rate(sample_http_requests_total[1m])`
- `sample_http_request_duration_seconds_sum / sample_http_request_duration_seconds_count`

Hoặc gọi API Prometheus:

```bash
curl "http://localhost:9090/api/v1/query?query=up%7Bjob%3D%22sample-app%22%7D"
```

## Docker signals

```bash
docker stats --no-stream
docker events --since 10m --filter type=container
docker inspect docker-observability-app --format '{{json .State.Health}}'
docker inspect docker-observability-app --format '{{json .HostConfig.LogConfig}}'
```

## Failure drill

1. Dừng app, quan sát Prometheus `up` về 0 và Docker events.
2. Start lại, quan sát counter reset (app in-memory) và `up` phục hồi.
3. Tạo nhiều request rồi kiểm tra log rotation config; không cố làm đầy disk.

Prometheus sample chỉ để học scrape; production cần persistent/remote storage, retention, authentication/TLS, alert manager, HA/capacity và bảo vệ endpoint metrics.

```bash
docker compose down
```

Liên quan: [Bài 11](../../../Lessions/Docker/11-observability.md).
