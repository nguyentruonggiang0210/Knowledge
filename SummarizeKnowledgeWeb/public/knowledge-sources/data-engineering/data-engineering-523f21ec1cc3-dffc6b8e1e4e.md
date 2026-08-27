# Kiến trúc tổng thể

```
 CSV 10M dòng
      │
      ▼
 ┌──────────────┐   JDBC batch   ┌────────────┐   async SQL   ┌───────────┐   HTTP    ┌────────────┐
 │  etl-spark   │ ─────────────▶ │ PostgreSQL │ ────────────▶ │ backend   │ ────────▶ │  Angular   │
 │ (PySpark)    │                │ (partition)│               │ (FastAPI) │           │ (frontend) │
 └──────────────┘                └────────────┘               └─────┬─────┘           └────────────┘
        │                                                           │ /metrics
        │ push metrics                                              ▼
        ▼                                                    ┌────────────┐   scrape   ┌───────────┐
   Pushgateway ──────────────────────────────────────────▶  │ Prometheus │ ─────────▶ │  Grafana  │
                                                             └────────────┘            └───────────┘
```

## Luồng dữ liệu

1. **etl-spark** đọc CSV, clean/transform (RANK, LAG/LEAD, aggregate), ghi kết quả
   xuống Postgres qua JDBC; đồng thời đẩy metrics job lên Pushgateway.
2. **PostgreSQL** lưu schema chuẩn hóa; bảng `repo_daily_stats` partition theo tháng.
3. **backend-api** (FastAPI async) đọc Postgres, expose REST `/api/v1/*` và `/metrics`.
4. **Prometheus** scrape FastAPI + Pushgateway; **Grafana** trực quan hóa.
5. **frontend-angular** gọi API, hiển thị trending / growth chart / language stats.

## Nguyên tắc

- Mỗi service build/run độc lập, ghép chung qua `docker-compose.yml`.
- etl-spark là batch job on-demand, không chạy 24/7 (dùng Airflow nếu cần lịch chạy).
