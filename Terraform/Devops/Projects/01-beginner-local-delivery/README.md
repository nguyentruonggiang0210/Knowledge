# Project 01 - Ship một API local-first có thể vận hành

## Bài toán

Xây một API quản lý danh sách công việc hoặc inventory nhỏ, lưu dữ liệu trong PostgreSQL và chạy hoàn toàn trên máy cá nhân bằng Docker Compose. Mục tiêu không phải viết nhiều feature; mục tiêu là chứng minh bạn biết biến source code thành một dịch vụ **build được, test được, quan sát được, rollback được và dọn sạch được**.

Ngôn ngữ tùy chọn: Go, Python, Java, .NET hoặc Node.js. Giữ API nhỏ để dành thời gian cho DevOps.

## Kiến trúc

```mermaid
flowchart LR
  D[Developer] --> G[Git repository]
  G --> CI[CI: lint, unit test, build, scan]
  CI --> IMG[Versioned container image]
  IMG --> APP[API container]
  U[Local client] -->|HTTP| APP
  APP --> DB[(PostgreSQL volume)]
  APP --> M[/metrics endpoint]
  APP --> L[Structured stdout logs]
  M --> P[Prometheus optional]
  P --> V[Grafana optional]
```

## Yêu cầu

### Functional

- `POST /items`, `GET /items`, `GET /items/{id}`, `DELETE /items/{id}` hoặc domain tương đương.
- `GET /health/live`: process còn sống; không phụ thuộc database.
- `GET /health/ready`: chỉ trả success khi app sẵn sàng nhận traffic và truy cập database được.
- `GET /metrics`: request count, latency histogram, error count và database dependency status.
- Database migration có version; app không tự sửa schema mơ hồ khi nhiều replica.

### Delivery

- Multi-stage Dockerfile, chạy bằng non-root user, image tag bằng semantic version hoặc commit SHA.
- `compose.yaml` có app, database và health checks; dependency dựa trên health, không chỉ startup order.
- `.env.example` chỉ chứa tên biến và giá trị không nhạy cảm; `.env` nằm trong `.gitignore`.
- CI chạy lint, unit test, integration test, build image và vulnerability/dependency scan.
- Một lệnh hoặc script cho `start`, `test`, `smoke`, `logs`, `stop`, `clean`.

### Non-functional

- Request log dạng JSON hoặc key-value, có timestamp, level, method, route, status, duration và correlation ID; không log token/password/body nhạy cảm.
- Graceful shutdown và connection timeout hợp lý.
- Retry database có giới hạn + backoff; không retry request không idempotent mù quáng.
- README ghi prerequisite, cách chạy từ môi trường sạch và known limitations.

## Milestone

| Mốc | Output | Gate để đi tiếp |
|---|---|---|
| M0 - Contract | API spec, [ADR](../../Templates/ADR.md), threat sketch | Scope nhỏ, success criteria rõ |
| M1 - App | CRUD, migration, unit/integration tests | Test pass từ clean checkout |
| M2 - Container | Dockerfile, Compose, health check, non-root | Rebuild/restart không mất dữ liệu ngoài dự kiến |
| M3 - Operability | Structured logs, metrics, dashboard/queries | Tìm được lỗi DB và request chậm trong 10 phút |
| M4 - Delivery | CI, image tag, smoke test, rollback | Bad release được phát hiện và rollback |
| M5 - Evidence | README, [runbook](./RUNBOOK.md), demo/timeline, cleanup | Tất cả acceptance criteria có bằng chứng |

## Lab thực hành

Tên file/lệnh có thể khác theo ngôn ngữ, nhưng repository phải cung cấp command contract tương đương.

### Lab 1 - Clean build

```powershell
git clone <repository-url>
Set-Location <repository-folder>
Copy-Item .env.example .env
docker compose config
docker compose build --pull
docker compose up -d
docker compose ps
```

Không đặt secret thật trong lệnh hoặc README. Người chạy tự điền `.env` cục bộ hoặc dùng secret mechanism của môi trường.

### Lab 2 - Smoke và persistence

```powershell
curl.exe -fsS http://localhost:8080/health/live
curl.exe -fsS http://localhost:8080/health/ready
curl.exe -fsS -X POST http://localhost:8080/items -H "Content-Type: application/json" -d '{"name":"demo"}'
curl.exe -fsS http://localhost:8080/items
docker compose restart app
curl.exe -fsS http://localhost:8080/items
```

Đổi port/path theo implementation. Smoke script phải tự fail với exit code khác 0 khi assertion sai.

### Lab 3 - Failure và recovery

1. Dừng database nhưng giữ app chạy.
2. Xác nhận liveness vẫn pass, readiness fail, metric/log phản ánh dependency lỗi.
3. Khởi động database; đo thời gian app ready trở lại.
4. Deploy một image cố ý trả 500; xác nhận smoke test chặn release.
5. Rollback về image tag trước theo [runbook](./RUNBOOK.md).

### Lab 4 - Backup/restore local

1. Tạo dữ liệu mẫu và dump database ra thư mục bị ignore.
2. Xóa một record có chủ đích.
3. Restore vào database tạm, không overwrite bản đang chạy ngay.
4. So sánh row count/checksum và ghi thời gian restore.

## Security

- Container non-root, filesystem read-only nếu framework cho phép, drop Linux capabilities không cần.
- Không publish database port ra ngoài host nếu không cần; app và DB dùng private Compose network.
- Pin base image/digest theo quy trình nâng cấp; scan CVE và dependency license.
- Validate input, giới hạn body/request, parameterized query; threat model theo [template](../../Templates/THREAT-MODEL.md).
- Redact credential, connection string và dữ liệu cá nhân khỏi log/evidence.

## Cost

Dự án mặc định local-first: không cần tài khoản cloud. Ghi lại CPU/RAM/disk của containers và giới hạn Compose để học capacity. Nếu đẩy image lên registry trả phí, đặt retention và xóa tag thử nghiệm.

## Observability

- Dashboard tối thiểu: request rate, error rate, p50/p95 latency, readiness và DB errors.
- Một alert giả lập có condition + duration + link [runbook](./RUNBOOK.md); không alert trên mọi log line.
- Correlation ID xuất hiện ở response header và log.
- Evidence gồm query/dashboard với dữ liệu test, không chứa payload nhạy cảm.

## Reliability

- Health semantics đúng: liveness không restart app chỉ vì DB tạm lỗi; readiness bảo vệ traffic.
- Graceful shutdown hoàn tất request đang chạy trong deadline.
- Migration và rollback có compatibility rule; không phụ thuộc restore để rollback code thông thường.
- Backup chỉ được coi là hợp lệ sau restore test.

## Acceptance criteria

- [ ] Người khác chạy được dự án từ clean checkout bằng README.
- [ ] Unit + integration + smoke tests pass trong CI và local.
- [ ] Image chạy non-root, có version/commit label và scan report.
- [ ] App không nhận traffic khi DB unavailable nhưng process không restart loop.
- [ ] Structured log và metric trả lời được một request lỗi từ correlation ID.
- [ ] Bad release bị smoke test phát hiện; rollback hoàn tất theo thời gian mục tiêu tự chọn.
- [ ] Backup restore vào DB tạm thành công và có consistency evidence.
- [ ] Repo không chứa `.env`, secret, private key, database dump hoặc image artifact lớn.
- [ ] `docker compose down --volumes` dọn sạch toàn bộ resource local có chủ đích.
- [ ] README có “Known limitations” và bước tiếp theo, không tự nhận production-ready.

## Cleanup

```powershell
docker compose down --volumes --remove-orphans
docker compose ps --all
```

Chỉ prune image/cache toàn máy khi bạn hiểu phạm vi; không đưa `docker system prune -a` vào script cleanup mặc định. Database dump dùng làm evidence phải được mask/encrypt hoặc xóa an toàn.

## Portfolio evidence

- Link pull request cho một thay đổi và CI run tương ứng.
- Test summary, image metadata/scan đã redact.
- Ảnh hoặc JSON export của dashboard khi DB failure.
- Incident timeline ngắn cho bad release bằng [template](../../Templates/INCIDENT-TIMELINE.md).
- Runbook có timestamp diễn tập và thời gian recovery thực đo.
