# 05 - Anti-patterns Terraform đa cloud

## 1. “Đổi prefix resource là xong migration”

**Biểu hiện:** đổi `oci_core_vcn` thành `aws_vpc`/`azurerm_virtual_network`, giữ nguyên subnet và IAM model.

**Vì sao sai:** AWS subnet là zonal, OCI/Azure subnet thường regional; Internet access, route và firewall semantics khác.

**Làm đúng:** ánh xạ intent, ghi feature gap, thiết kế target-native và test packet path/failure mode.

## 2. Một module khổng lồ có `var.cloud`

**Biểu hiện:** hàng trăm `count = var.cloud == ... ? 1 : 0`, output dùng `try`, module yêu cầu cả ba provider.

**Hậu quả:** interface là “mẫu số chung nhỏ nhất”, plan khó đọc, dependency/provider alias khó quản, test matrix bùng nổ.

**Làm đúng:** module implementation riêng mỗi cloud, contract input/output tương đồng khi thật sự hữu ích.

## 3. Một state cho toàn enterprise

**Biểu hiện:** OCI, AWS, Azure, prod và dev cùng state/run.

**Hậu quả:** blast radius và thời gian plan lớn; một lock chặn mọi team; một credential cần quyền cực rộng.

**Làm đúng:** tách theo trust/lifecycle/owner/environment/region; publish contract nhỏ giữa stack.

## 4. Dùng Terraform workspace làm security boundary duy nhất

**Biểu hiện:** cùng backend key pattern và credential, chỉ `workspace select prod` để đổi môi trường.

**Hậu quả:** chọn nhầm workspace dễ apply prod, không tạo isolation IAM/account/subscription.

**Làm đúng:** production có backend/state/identity/account boundary riêng; workspace chỉ dùng khi các instance thực sự đồng cấu hình và guardrail đủ mạnh.

## 5. Credential dài hạn trong code hoặc state

**Biểu hiện:** access key/client secret/private key trong provider, tfvars hoặc module output.

**Hậu quả:** rò qua Git, plan, state, log, cache runner; rotation khó.

**Làm đúng:** OIDC/workload/managed identity, role session ngắn; secret manager chỉ khi federation không khả thi. Rotate ngay nếu từng commit, không chỉ xóa dòng Git hiện tại.

## 6. Tin rằng `sensitive = true` mã hóa secret

`sensitive` chỉ che hiển thị ở nhiều chỗ. Giá trị có thể vẫn nằm trong state/plan. Dùng remote state encrypted, access control chặt; ưu tiên ephemeral/write-only flow khi provider/resource hỗ trợ.

## 7. Hard-code zone, image và account context

**Biểu hiện:** `ap-southeast-1a`, AMI/image ID, subscription/account ID rải trong module.

**Hậu quả:** AZ name có thể map physical location khác, image khác region, code apply nhầm scope.

**Làm đúng:** data source/approved image catalog, explicit root inputs, precondition/account allowlist và output context trong plan pipeline.

## 8. Cho phép public ingress `0.0.0.0/0` vào SSH/RDP

**Làm đúng:** Session Manager/Bastion/VPN/just-in-time access; nếu lab bắt buộc thì giới hạn IP cá nhân và TTL, không copy vào production.

## 9. Tạo NAT Gateway/LB/DB chỉ để validate syntax

Các tài nguyên managed có thể tính phí theo giờ/capacity dù không có traffic. Dùng `terraform init -backend=false`, `validate`, mock/module test cho syntax; integration test ở sandbox có budget/TTL và destroy evidence.

## 10. Giả định resource “trống” là miễn phí

Public IPv4, NAT, log ingestion, KMS request, snapshot, DNS zone, LB và managed firewall có thể tính phí độc lập. Luôn kiểm tra calculator/pricing page hiện tại và bill sau lab.

## 11. Copy OCPU thành vCPU 1:1

CPU generation, SMT, memory bandwidth, storage/network limit và burst khác. Benchmark theo throughput/latency/SLO, rồi rightsizing bằng telemetry.

## 12. Đồng nhất OCI compartment với AWS account/Azure resource group

Không có mapping cố định. Chọn target boundary theo isolation, billing, quota, policy inheritance, owner và lifecycle. Có compartment nên thành AWS account/Azure subscription; có compartment chỉ nên thành resource group/tag.

## 13. Port OCI IAM policy thành wildcard

**Biểu hiện:** vì khó map `manage` nên cấp `Action = "*"` hoặc Owner ở subscription.

**Làm đúng:** trace API cần dùng, tách deploy/runtime, dùng condition/scope/resource policy và giảm quyền theo access evidence.

## 14. Nhầm guardrail với quyền cấp phát

- AWS SCP/RCP giới hạn maximum permission, không tự grant action cho role.
- Azure Policy enforce/audit resource state, không thay role assignment.
- Network firewall không thay IAM/data-plane authorization.

Thiết kế authorization theo nhiều lớp nhưng biết rõ vai trò từng lớp.

## 15. Dùng `depends_on` khắp nơi

Terraform đã suy ra dependency qua reference. `depends_on` rộng làm nhiều value thành unknown và plan bảo thủ.

**Làm đúng:** reference output/attribute thật; chỉ dùng explicit dependency cho quan hệ side-effect API không thể biểu diễn.

## 16. Dùng `time_sleep` để chữa eventual consistency

Sleep làm pipeline chậm và vẫn flaky. Trước tiên kiểm tra provider version/issue, readiness API, retry/timeout và dependency. Chỉ dùng delay có bằng chứng, giới hạn và comment link issue/điều kiện gỡ bỏ.

## 17. Lạm dụng `ignore_changes`

`ignore_changes = all` biến Terraform thành công cụ create-once và che drift bảo mật/cost.

**Làm đúng:** chỉ ignore field có external controller rõ ràng, comment owner/source-of-truth, test drift và review định kỳ.

## 18. Dùng `-target` như workflow hằng ngày

`-target` dành cho exceptional recovery/troubleshooting; nó có thể bỏ qua phần graph cần reconcile. Sau thao tác phải chạy full plan. Thiết kế state/module nhỏ hơn nếu full plan quá lớn.

## 19. Tắt lock bằng `-lock=false`

Hai writer có thể gây lost update/corrupt state. Điều tra holder/run; chỉ `force-unlock` lock của chính run đã chết sau khi xác minh, dùng lock ID và audit.

## 20. Sửa JSON state bằng tay hoặc `state push -force`

Có thể phá lineage/serial và mapping. Dùng `moved`, `import`, `removed`, `state mv/rm` theo runbook; pull encrypted backup trước thao tác state.

## 21. Một pipeline role là admin cả ba cloud

Compromise một CI job sẽ mất cả enterprise. Dùng role riêng cloud/account/env, OIDC condition chặt, apply sau approval, session ngắn và central audit.

## 22. Dùng `terraform_remote_state` như database tích hợp

Reader thường cần quyền đọc toàn snapshot, có thể thấy data ngoài outputs. Coupling deployment tăng.

**Làm đúng:** publish API/config parameter/service catalog contract nhỏ; dùng remote state khi đã đánh giá quyền và coupling.

## 23. Active/active multi-cloud mà không thiết kế data conflict

Hai frontend sống không làm database active/active an toàn. Phải định nghĩa source of truth, consistency, idempotency, ordering, conflict resolution, failback và test partition.

## 24. Centralize toàn bộ raw logs sang một cloud

Có thể tăng egress, latency, compliance risk và tạo failure dependency. Lọc/redact/aggregate gần nguồn, giữ audit bắt buộc tại cloud nguồn, centralize signal cần điều tra.

## 25. Destroy là bằng chứng duy nhất rằng hết chi phí

Terraform chỉ xóa resource trong state và có thể gặp retention/soft-delete/orphan. Sau destroy phải kiểm tra inventory/bill: public IP, disk, snapshot, backup vault, DNS zone, log workspace, NAT/LB và resource tạo bởi controller.

## 26. Nâng provider major cùng lúc với migration production

Khó phân biệt lỗi do provider breaking change và lỗi architecture migration. Tách PR/phase: nâng và đạt no-op plan trước, rồi migration; đọc upgrade guide và canary nonprod.

## 27. Dùng tên mutable để tìm resource production

Tên/tag có thể trùng hoặc đổi. Khi interface cần ổn định, publish canonical ID/ARN/ARM ID qua contract có owner/version; query bằng nhiều điều kiện và assert chỉ có một kết quả.

## 28. Không có exit strategy

Managed database/serverless/API đặc thù làm portability đắt. Không nhất thiết tránh chúng; phải ghi rõ lock-in được chấp nhận vì lợi ích nào, export format, backup portability và chi phí exit.

## Review nhanh trước merge

```text
[ ] Không secret/private key trong diff
[ ] Provider/module version và lock diff có chủ đích
[ ] Đúng account/subscription/tenancy, region và state
[ ] Không wildcard IAM/public admin ingress
[ ] Không unexpected replace/delete
[ ] Backup/rollback cho resource stateful
[ ] Cost của IP/NAT/LB/log/egress đã xét
[ ] Observability, owner, tags và runbook đầy đủ
```
