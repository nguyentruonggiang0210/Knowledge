# Lesson 16 — Operations, drift, troubleshooting, cost và DR

## Mục tiêu

- Vận hành Terraform day-2 bằng runbook và evidence.
- Phát hiện/phân loại/reconcile drift an toàn.
- Debug graph/state/provider/OCI API theo tầng.
- Quản lý cost, upgrade và disaster recovery có diễn tập.

## Troubleshooting theo tầng

~~~mermaid
flowchart TD
  C[Configuration/type/address] --> G[Graph/unknown/lifecycle]
  G --> S[State/backend/lock]
  S --> P[Provider schema/version/auth]
  P --> A[OCI API: IAM/quota/work request/rate]
  A --> R[Runtime: network/OS/app/data]
~~~

Đừng đổi HCL ngẫu nhiên. Xác định layer, resource address, operation/request ID,
timestamp, provider/core version và last known good plan.

## Diagnostic toolkit

| Công cụ | Mục đích |
|---|---|
| terraform validate/console | Type/reference/expression |
| terraform graph | Dependency/parallelism |
| terraform plan/show -json | Diff, unknown, replacement reason |
| terraform state list/show | Binding hiện tại |
| terraform providers/schema -json | Version/schema |
| TF_LOG / TF_LOG_PATH | Core/provider trace ngắn hạn |
| OCI work request/API request ID | Server-side status/support trace |
| Audit/Logging/Monitoring | Ai đổi gì và runtime signal |

Log có thể chứa secret/header/state value. Chỉ bật mức cần thiết, lưu vị trí bảo
mật, redact và xóa theo incident retention. Không paste full trace công khai.

## Common incidents

### Partial apply

Terraform không transaction toàn cục. Giữ state/error, không restore state cũ mù.
Kiểm OCI object đã tạo, chạy full plan lại, sửa nguyên nhân và roll-forward. Nếu
resource orphan không vào state, import hoặc xóa sau xác minh ownership.

### IAM/quota/capacity/eventual consistency

- 401/403: identity/profile/region/policy/dynamic group, policy propagation.
- 404 ngay sau create: eventual consistency/region/compartment/OCID.
- 409: name/state/work request conflict.
- 429/5xx: rate limit/service issue; provider retry, giảm parallelism có bằng chứng.
- Capacity/quota/limit: chọn AD/shape, request limit hoặc capacity design; retry mù
  không tạo capacity.

Ghi OPC request ID nếu có trước khi mở support case.

### Stale lock

Kiểm pipeline/process/job và backend object; chỉ force-unlock đúng ID khi writer
chắc chắn không còn. Sau đó full plan. Hai writer sống có thể gây state loss.

### Replacement bất ngờ

Đọc provider schema/changelog và plan path gây replacement. Có thể là immutable
argument, address change, provider bug/default normalization. Không thêm
ignore_changes trước khi hiểu ownership.

## Drift lifecycle

~~~mermaid
flowchart LR
  D[Scheduled plan exit 2] --> T[Triage owner/risk]
  T --> R{Decision}
  R -->|Unauthorized| REV[Revert via Terraform]
  R -->|Approved intent| CFG[Update config/import/refresh-only]
  R -->|New owner| H[Handoff removed/import]
  REV --> N[Full no-change plan]
  CFG --> N
  H --> N
~~~

Drift có thể từ console, another state, service automation, provider default hoặc
API behavior. Emergency manual change có ticket/expiry rồi reconcile sớm. Scheduled
drift job chỉ cần read/plan identity nếu có thể và phải alert code 2.

refresh-only cập nhật state theo remote mà không đổi remote; nó không tự nghĩa
remote change đúng. Review trước apply -refresh-only.

## Cost/FinOps

- Estimate plan diff, nhưng giá/discount/usage thay đổi; đối chiếu billing thật.
- Defined tags owner/cost_center/environment; tag coverage policy.
- Budget/alert, quota và sandbox TTL/janitor.
- Right-size compute/LB/database, autoscaling limits và scheduled non-prod.
- Network egress, NAT/LB, cross-region, backup/version retention thường bị bỏ sót.
- Destroy lab, nhưng kiểm orphan volume/public IP/snapshot/object version.
- Cost anomaly → owner/runbook, không auto-destroy production.

## Upgrade operations

1. Inventory Terraform/provider/module/backend version và deprecation.
2. Backup/version state; đọc changelog/upgrade guide.
3. PR chỉ nâng dependency; init -upgrade và review lock.
4. Static/unit/mock/integration/upgrade-from-old-state tests.
5. Rollout dev → staging → prod nhỏ; plan/no-change/smoke.
6. Rollback binary/provider chỉ khi state schema compatible; thường roll-forward.

Không chạy init -upgrade trong mỗi deploy.

## Disaster Recovery

Phân biệt:

- Code/module/lock recovery từ Git/artifact.
- Terraform state recovery từ versioned backend/ORM export.
- Cloud infrastructure recreate.
- Application data restore/replication.
- Secret/KMS/certificate availability.
- DNS/traffic failover và client cache.

~~~mermaid
flowchart LR
  PRI[Primary region] -->|data replication| DR[DR region]
  GIT[Git + module artifacts] --> DR
  ST[State backup/version] --> DR
  K[KMS/secrets strategy] --> DR
  DNS[DNS steering/runbook] --> DR
  OBS[Independent monitoring] --> DNS
~~~

RPO là lượng dữ liệu có thể mất; RTO là thời gian khôi phục. “Terraform apply lại”
không bảo đảm hai số đó. DR region cần subscription, quota/capacity, image/artifact,
network peering, secret/key và policy sẵn. State primary/DR nên tránh một điểm khóa
chung nếu mục tiêu failure independence.

Test game day: failover, validate data/app, giữ audit, rồi failback. Paper plan
không đủ.

## Lab tabletop

- [incident-drill.md](lab/incident-drill.md): 6 tình huống day-2.
- [drift-check.ps1](lab/drift-check.ps1): mẫu xử lý exit code.
- [cost-dr-checklist.md](lab/cost-dr-checklist.md): worksheet.

Chạy script chỉ trong root module/state sandbox đã xác minh.

## Hoạt động

1. Tạo manual tag drift, scheduled plan phát hiện và reconcile ba cách.
2. Mô phỏng partial apply bằng permission denial, điều tra state/remote.
3. Diễn tập stale lock mà không gỡ writer sống.
4. Nâng provider major trong branch và chạy old-state compatibility test.
5. Restore một version state sandbox rồi tìm object “bị quên”.
6. DR game day đo RTO/RPO và ghi gap/corrective action.

## Lỗi thường gặp

- Restore state cũ để “rollback” partial apply.
- target/ignore_changes trở thành workflow hằng ngày.
- TF_LOG lưu lâu và leak secret.
- Drift job tự apply production.
- Backup state được coi là backup database.
- DR chưa có quota/key/DNS/failback test.

## Tiêu chí hoàn thành

- Triage incident theo layer có evidence, không thao tác state mù.
- Drift runbook phân loại revert/accept/handoff.
- Cost ownership và DR RTO/RPO được đo qua diễn tập.

