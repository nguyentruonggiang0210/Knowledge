# Runbook - Local API unavailable hoặc release lỗi

> Trạng thái ban đầu: `UNVERIFIED`. Đổi thành `VERIFIED` chỉ sau khi một người khác diễn tập thành công.

## Metadata

| Trường | Giá trị cần điền |
|---|---|
| Service | `<service-name>` |
| Owner | `<team/contact>` |
| Severity | Local exercise / portfolio |
| Dashboard | `<local URL hoặc query>` |
| Last tested | `<YYYY-MM-DD + người test>` |
| Known-good image | `<immutable tag/digest>` |

## Trigger

- `/health/ready` fail liên tục trên 60 giây;
- smoke test trả exit code khác 0;
- error rate hoặc p95 latency vượt ngưỡng của project;
- release mới làm mất chức năng hoặc migration lỗi.

## Safety

1. Không xóa volume trước khi đã xác định có cần dữ liệu để điều tra/restore không.
2. Không in `.env` hoặc connection string vào terminal capture.
3. Ghi timestamp và command/result quan trọng vào incident timeline.

## Triage trong 5 phút

```powershell
docker compose ps
curl.exe -sS -i http://localhost:8080/health/live
curl.exe -sS -i http://localhost:8080/health/ready
docker compose logs --since 10m app
docker compose logs --since 10m db
docker stats --no-stream
```

Phân loại:

| Dấu hiệu | Khả năng | Hành động đầu |
|---|---|---|
| Liveness fail | process/crash/config lỗi | xem exit code/app logs, rollback image |
| Live pass, ready fail | database/migration/dependency | kiểm tra DB health, disk, migration |
| Ready pass, API lỗi | regression/data/request path | chạy smoke theo endpoint, rollback release |
| Latency cao, CPU/RAM cao | saturation/leak/query chậm | thu metric/profile an toàn, giới hạn traffic test |

## Mitigation A - Database tạm unavailable

1. Xác nhận DB container và volume còn tồn tại.
2. Kiểm tra log cho lỗi disk, authentication hoặc migration mà không tiết lộ credential.
3. Khởi động lại **chỉ DB** nếu lỗi transient đã hiểu: `docker compose up -d db`.
4. Chờ DB health pass; xác nhận app tự reconnect có backoff.
5. Chạy readiness, smoke và kiểm tra dữ liệu mẫu.

Không recreate volume để chữa lỗi database.

## Mitigation B - Rollback bad release

1. Xác định image digest/tag tốt gần nhất từ CI, không dùng tag mutable `latest`.
2. Cập nhật biến image/version về digest tốt trong file cấu hình được quản lý.
3. Chạy `docker compose config` để kiểm tra render.
4. Chạy `docker compose up -d --no-deps app`.
5. Xác nhận container đang dùng đúng digest, rồi chạy health + smoke.
6. Nếu schema không backward-compatible, dừng và dùng change/restore plan đã duyệt; không tự hạ migration.

## Verify recovery

- [ ] Live và ready pass liên tục ít nhất 2 phút.
- [ ] CRUD smoke test pass và không tạo duplicate.
- [ ] Error rate trở về baseline; không có restart loop.
- [ ] Dữ liệu trước incident vẫn đọc được.
- [ ] Image digest và migration version đúng mong đợi.

## Escalation

Nếu chưa recover trong `<10 phút>` hoặc nghi dữ liệu hỏng:

- ngừng thao tác thay đổi dữ liệu;
- giữ volume/log/evidence;
- tạo incident timeline và chuyển sang restore database tạm;
- nhờ `<owner/reviewer>` quyết định promote restored copy hay tiếp tục sửa.

## Sau recovery

- Hoàn thiện [postmortem blameless](../../Templates/POSTMORTEM-BLAMELESS.md).
- Tạo action có owner/due date cho detection, test hoặc automation thiếu.
- Cập nhật runbook bằng điều đã học và diễn tập lại từ clean checkout.
