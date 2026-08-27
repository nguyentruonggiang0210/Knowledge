# GitHub Trending Analytics Platform

Monorepo phân tích dữ liệu GitHub trending. Mỗi thư mục top-level là 1 service
độc lập, `docker-compose.yml` ở root điều phối chung.

## Kiến trúc

| Thư mục | Vai trò | Chạy độc lập bằng |
|---|---|---|
| `etl-spark/` | Đọc CSV 10M dòng, clean, transform, ghi kết quả xuống Postgres | `spark-submit run_pipeline.py` |
| `db/` | Schema, migration, partitioning, các query phân tích | Alembic + `psql` |
| `backend-api/` | API async phục vụ frontend, expose `/metrics` cho Prometheus | `uvicorn app.main:app` |
| `monitoring/` | Scrape metrics, alert, dashboard trực quan | `docker-compose up prometheus grafana` |
| `frontend-angular/` | Giao diện hiển thị dữ liệu, gọi API | `ng serve` |
| `docs/` | Tài liệu kiến trúc + câu trả lời tự học | — |

## Thứ tự dựng source đề xuất

1. `db/migrations` → tạo schema trước (mọi thứ phụ thuộc vào đây)
2. `etl-spark/` → chạy thử với sample nhỏ trước khi chạy full 10M dòng
3. `backend-api/` → viết route với data seed nhỏ trong `db/seeds/`
4. `monitoring/` → gắn vào sau khi API chạy ổn định
5. `frontend-angular/` → làm cuối, khi API đã có contract ổn định

## Quick start

```bash
cp .env.example .env
docker-compose up -d postgres fastapi prometheus grafana angular
# etl-spark chạy on-demand:
cd etl-spark && spark-submit run_pipeline.py
```

- FastAPI: http://localhost:8000/docs
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Angular: http://localhost:4200
