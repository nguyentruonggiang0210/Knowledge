# 09 — Debugging lab: healthy nhưng host không gọi được

Mục tiêu: điều tra theo evidence, không mở `compose.yaml` (bản fixed) trước khi tìm ra root cause.

## Khởi động bản lỗi

```bash
docker compose -f compose.broken.yaml up --build -d --wait
docker compose -f compose.broken.yaml ps
curl --max-time 3 http://localhost:8086
```

Kỳ vọng thú vị: container **healthy**, nhưng request từ host fail. Ghi ba giả thuyết rồi điều tra:

```bash
docker compose -f compose.broken.yaml logs app
docker inspect docker-debugging-app --format '{{json .State.Health}}'
docker inspect docker-debugging-app --format '{{json .NetworkSettings.Ports}}'
docker port docker-debugging-app
docker compose -f compose.broken.yaml exec app python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8080/healthz').read())"
```

Gợi ý: published port không có nghĩa process đang listen trên interface mà veth/NAT có thể tới. Healthcheck chạy **bên trong** network namespace.

## Áp dụng bản fixed sau khi kết luận

So sánh hai file, rồi:

```bash
docker compose -f compose.yaml up -d --force-recreate --wait
curl http://localhost:8086
docker compose logs app
```

Root cause phải được mô tả cụ thể: app bind loopback trong container thay vì all container interfaces. Fix là `BIND_HOST=0.0.0.0`, không phải host network/privileged.

## Bài mở rộng

1. Đổi mapping host thành `8086:9999`, dự đoán health và host behavior.
2. Đổi healthcheck sang port sai, phân biệt “app reachable nhưng unhealthy”.
3. Đặt `BIND_HOST` thành giá trị không có trên interface, quan sát startup/exit/log.
4. Viết postmortem: impact, timeline, evidence, root cause, fix, prevention test.

```bash
docker compose down
```

Liên quan: [Bài 12](../../../Lessions/Docker/12-debugging-runbook.md).
