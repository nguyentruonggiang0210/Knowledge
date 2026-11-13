# Docker code samples

Các sample độc lập, chạy từ chính thư mục chứa `compose.yaml`/`Dockerfile`. Port host mặc định đều bind `127.0.0.1` để không vô tình mở ra LAN.

| Sample | Chủ đề | Port |
|---|---|---|
| [01-first-container](01-first-container/README.md) | Image/container/port cơ bản | 8080 |
| [02-buildkit-go](02-buildkit-go/README.md) | Go multi-stage, cache, non-root, multi-platform | 8082 |
| [03-networking-lab](03-networking-lab/README.md) | DNS, bridge, segmentation | 8081 |
| [04-storage-backup](04-storage-backup/README.md) | Named volume, backup/restore drill | Không publish |
| [05-compose-production](05-compose-production/README.md) | API + migration + PostgreSQL + proxy | 8083 |
| [06-security-hardening](06-security-hardening/README.md) | Read-only, tmpfs, capability, limits | 8084 |
| [07-observability](07-observability/README.md) | JSON logs, Prometheus metrics | 8085, 9090 |
| [08-build-secret](08-build-secret/README.md) | BuildKit secret mount | Không publish |
| [09-debugging-lab](09-debugging-lab/README.md) | Điều tra bind address/published port | 8086 |

## Nguyên tắc chạy

1. Đọc README và `docker compose config` trước.
2. Không chạy đồng thời sample dùng cùng project name nhiều lần.
3. Dùng `docker compose down` sau lab; chỉ thêm `-v` nếu README nói rõ data disposable và bạn xác nhận volume.
4. Image tags ưu tiên khả năng chạy lab. Dự án production phải pin/promote digest đã kiểm thử và cập nhật có quy trình.
5. Một số lệnh dùng `curl`; PowerShell có thể dùng `Invoke-RestMethod`.

Mục lục giáo trình: [Lessions/Docker](../../Lessions/Docker/README.md).
