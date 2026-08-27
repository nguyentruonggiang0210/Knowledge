# 04 - Checklist migration OCI → AWS/Azure

Checklist này bao phủ cả **migration workload** và **chuyển quyền quản lý sang Terraform**. Không chạy cutover chỉ vì `terraform apply` thành công.

## 0. Xác định phạm vi

- [ ] Ghi business outcome: giảm latency, exit datacenter/cloud, DR, compliance hay tối ưu chi phí.
- [ ] Chọn đích: AWS, Azure, hoặc cả hai; ghi lý do định lượng.
- [ ] Xác định workload owner, platform owner, security, data owner, approver và on-call.
- [ ] Chốt downtime window, RTO, RPO, performance SLO và success criteria.
- [ ] Chốt in-scope/out-of-scope: app, data, identity, DNS, certificate, observability, CI/CD, backup.
- [ ] Chọn strategy cho từng component: rehost, replatform, refactor, repurchase, retain, retire.
- [ ] Tạo rollback/failback criteria trước khi thay đổi production.

## 1. Discovery OCI nguồn

### Inventory và dependency

- [ ] Export inventory theo tenancy/compartment/region và đối chiếu bằng billing/tag/resource search.
- [ ] Liệt kê VCN, subnet, route table, NSG, Security List, DRG, gateway, public/private IP.
- [ ] Liệt kê Compute shape/OCPU/RAM, image, boot/block volume, metadata, cloud-init, autoscaling.
- [ ] Liệt kê LB/backend/health check/certificate/WAF/DNS record và TTL.
- [ ] Liệt kê database engine/version/option/charset/timezone/extension, HA, backup, replica.
- [ ] Liệt kê Object Storage bucket, lifecycle, retention/legal hold, replication, pre-authenticated request.
- [ ] Liệt kê secret/key/certificate; xác định key nào export được, key nào phải rotate/re-encrypt.
- [ ] Liệt kê Queue/Streaming/event triggers, ordering, retry, DLQ và idempotency.
- [ ] Liệt kê Audit/Monitoring/Logging/APM alarm, dashboard, retention và SIEM flow.
- [ ] Vẽ dependency app-to-app, app-to-data, on-prem, SaaS, IP allowlist và third-party license.
- [ ] Đo traffic/throughput/IOPS/latency/concurrency/peak season ít nhất một chu kỳ phù hợp.

### IAM và governance

- [ ] Export group, dynamic group, federation, policy ở tenancy và compartment cha/con.
- [ ] Xác định quyền thực dùng; loại wildcard không cần thiết thay vì copy nguyên trạng.
- [ ] Inventory tag namespace/default, Security Zone, Cloud Guard và quota/limit.
- [ ] Xác định break-glass, key rotation, audit retention và segregation of duties.

### Terraform hiện tại

- [ ] Ghi Terraform/provider/module version và lưu `.terraform.lock.hcl`.
- [ ] Xác định backend, lock, encryption, versioning, state owner và recovery procedure.
- [ ] Chạy plan refresh-only; phân loại drift có chủ đích và drift trái phép.
- [ ] Tìm secret/plaintext trong code, tfvars, outputs, state và CI logs; lập kế hoạch rotate.
- [ ] Liệt kê resource đang import/manual, `ignore_changes`, `prevent_destroy`, `-target` debt.

## 2. Target landing zone

### Chung

- [ ] Chọn region theo service availability, latency, residency, DR pairing và quota.
- [ ] Reserve CIDR không overlap với OCI/on-prem/cloud khác; cập nhật IPAM.
- [ ] Tạo account/subscription boundary cho prod/nonprod/security/log/network phù hợp.
- [ ] Thiết lập federation, MFA, break-glass và workload identity.
- [ ] Thiết lập policy guardrail: allowed region/SKU, encryption, public access, required tags.
- [ ] Tạo remote state bootstrap tách biệt, encryption/versioning/lock/private access/audit.
- [ ] Tạo CI OIDC trust với plan/apply role tách và protected environment approval.
- [ ] Xác minh service quota và capacity; request tăng trước rehearsal.
- [ ] Bật billing export, budget, anomaly alert và owner/cost tags.

### Nếu đích là AWS

- [ ] Chọn Organization/OU/account topology; SCP/RCP không chặn pipeline ngoài ý muốn.
- [ ] Thiết kế IAM Identity Center/role, trust policy, permissions boundary và resource policy.
- [ ] Chọn AZ bằng data/API; dùng AZ ID nếu phối hợp physical zone cross-account.
- [ ] Mỗi AWS subnet gắn đúng một AZ; thiết kế public/private/isolated subnet cho từng AZ.
- [ ] Kiểm tra route, SG stateful, NACL stateless và ephemeral return ports.
- [ ] Bật CloudTrail/Config/GuardDuty/Security Hub theo governance design.
- [ ] Với S3 state: bucket versioning, encryption, block public access, object-prefix IAM và `use_lockfile = true`.

### Nếu đích là Azure

- [ ] Chọn Management Group/subscription/Resource Group topology và Azure Policy inheritance.
- [ ] Chọn Entra group/service principal/managed identity; role assignment đúng management/data plane.
- [ ] Kiểm tra Resource Provider cần đăng ký; AzureRM v5 mặc định không tự đăng ký.
- [ ] Kiểm tra logical-to-physical zone mapping khi cần phối hợp cross-subscription.
- [ ] Nhớ subnet Azure là regional; VM/LB/disk/service mới chọn zonal hoặc zone-redundant mode.
- [ ] Thiết kế NSG priority, effective routes/security rules, Private DNS Zone và Private Endpoint.
- [ ] Bật Activity Log, Defender for Cloud/Azure Policy, diagnostic settings và Log Analytics theo policy.
- [ ] Với Blob state: Entra data-plane auth, blob lease lock, versioning/soft delete, firewall/private endpoint.

## 3. Thiết kế mapping và gap analysis

- [ ] Với mỗi OCI service, ghi target service, API/feature gap, owner, test và fallback.
- [ ] Không quy đổi OCPU/vCPU theo số lượng đơn thuần; benchmark workload thật.
- [ ] So sánh disk IOPS/throughput/latency, burst, queue depth và attachment limits.
- [ ] So sánh LB algorithm, idle timeout, source IP, TLS policy, health probe và draining.
- [ ] So sánh DB feature/extension, collation, transaction isolation, backup/PITR và major upgrade.
- [ ] So sánh object lifecycle, retention lock, versioning, multipart limit, signed URL semantics.
- [ ] So sánh queue delivery/ordering/dedup/retry/DLQ và streaming partition/retention.
- [ ] Xác định feature không có 1:1 và ra Architecture Decision Record.
- [ ] Tính full cost gồm IPv4, NAT, LB, log, KMS/secret requests, snapshot và egress.

## 4. Xây Terraform đích

- [ ] Tách root module theo account/subscription, region, environment và lifecycle boundary.
- [ ] Provider/root module giới hạn version; lock file được review/commit.
- [ ] Credential không nằm trong code/tfvars; CI dùng OIDC/managed identity/role.
- [ ] Module interface có validation, meaningful outputs, tags và documentation.
- [ ] Không copy resource OCI rồi chỉ đổi prefix; viết implementation theo semantics cloud đích.
- [ ] Dùng data source cho AZ/image/subscription context khi ID có thể thay đổi; pin image version cho production.
- [ ] Tạo explicit security rules theo traffic matrix; không mở `0.0.0.0/0` cho admin port.
- [ ] Encryption, backup, retention, deletion protection và diagnostics được khai báo.
- [ ] Có `precondition`/policy check cho input nguy hiểm; plan không tạo tài nguyên ngoài target scope.
- [ ] `fmt`, `validate`, lint/security test, module test và plan sandbox đều pass.
- [ ] Rehearsal destroy sandbox xác nhận không còn billable orphan.

## 5. Data migration

- [ ] Chọn full load + CDC/replication hoặc backup/restore; ghi expected lag.
- [ ] Kiểm tra tool/format/version compatibility và character encoding.
- [ ] Mã hóa in transit/at rest; credential migration scope hẹp và hết hạn.
- [ ] Thực hiện dry run bằng snapshot production đã mask nếu chứa sensitive data.
- [ ] So sánh row/object count, checksum, constraint/index, sequence và sample business query.
- [ ] Test performance trên target với dataset/caching gần thực tế.
- [ ] Xử lý freeze window hoặc dual write; có reconciliation và idempotency.
- [ ] Backup OCI nguồn trước cutover và xác minh restore, không chỉ backup status.
- [ ] Xác định retention/decommission date sau sign-off và legal hold.

## 6. Application và integration

- [ ] Build immutable image/artifact; scan và sign; không copy mutable VM thủ công nếu tránh được.
- [ ] Externalize endpoint/config; secret lấy qua workload identity.
- [ ] Kiểm tra metadata endpoint differences và bắt buộc IMDSv2 trên AWS khi dùng EC2.
- [ ] Thay SDK endpoint/region/credential chain; test timeout, retry, backoff và rate limit.
- [ ] Test session state, cache warmup, scheduled jobs, singleton worker và distributed lock.
- [ ] Update allowlist/firewall/SaaS callback/license bound to IP/host/account.
- [ ] Phát hành certificate và DNS validation trước cutover.
- [ ] Instrument trace/metric/log và correlation ID trước khi đưa traffic.

## 7. Rehearsal và kiểm thử

- [ ] Chạy end-to-end ở nonprod bằng cùng pipeline/role/module version với prod.
- [ ] Functional, integration, contract, load, soak và security test pass.
- [ ] Failure injection: một instance/zone/dependency/tunnel hỏng; xác minh recovery.
- [ ] Backup restore và DR/failback rehearsal đo RTO/RPO thật.
- [ ] Quan sát alert tới đúng on-call; dashboard/log/trace đủ điều tra.
- [ ] Chạy cost estimate và theo dõi bill sandbox thực để hiệu chỉnh.
- [ ] Runbook cutover/rollback được người không viết nó walkthrough.
- [ ] Change window, stakeholder communication, status page và escalation tree sẵn sàng.

## 8. Cutover

- [ ] Freeze thay đổi infrastructure/schema ngoài kế hoạch.
- [ ] Chụp config/state/backup cuối; xác minh state lock và không có apply khác.
- [ ] Giảm DNS TTL trước đủ lâu nếu dùng DNS cutover.
- [ ] Sync data cuối, đo replication lag và chạy consistency checks.
- [ ] Scale target tới capacity dự kiến, warm cache và chạy smoke test private/canary.
- [ ] Chuyển một phần traffic/consumer; theo dõi error rate, latency, saturation và business KPI.
- [ ] Tăng traffic theo gate; ghi timestamp và version ở mỗi bước.
- [ ] Dừng/disable writer nguồn đúng thứ tự để tránh split-brain.
- [ ] Xác nhận external integrations và người dùng ở nhiều network/location.
- [ ] Chỉ tuyên bố thành công khi qua observation window và success criteria.

## 9. Rollback/failback

- [ ] Trigger định lượng: error rate, data divergence, latency, security incident hoặc deadline.
- [ ] Quyền quyết định rollback rõ ràng; không tranh luận trong incident.
- [ ] Nếu target đã nhận write, có quy trình reconcile về source trước khi đảo traffic.
- [ ] DNS/traffic rule rollback đã test và certificate còn hợp lệ.
- [ ] Không destroy target trong incident; bảo toàn log/state/evidence.
- [ ] Sau rollback, rotate credential tạm và tạo problem review.

## 10. Sau migration

- [ ] Chạy drift plan và inventory target; reconcile manual hotfix bằng code/import.
- [ ] Xác nhận backup schedule, restore test, retention, monitor và security finding.
- [ ] Rightsize sau khi đủ telemetry; không tối ưu dựa trên một ngày.
- [ ] Review bill gồm egress/IPv4/NAT/log và cập nhật forecast.
- [ ] Chuyển on-call/runbook/ownership, đào tạo vận hành cloud đích.
- [ ] Thu hồi migration role, temp firewall, replication link và staging data.
- [ ] Decommission OCI theo dependency graph và retention/legal approval.
- [ ] Release public IP, volume, snapshot, LB, NAT, DNS record và reservation không dùng.
- [ ] Rotate secret/key đã xuất hiện trong migration tooling/log.
- [ ] Archive decision, test evidence, final topology và lessons learned.

## 11. Terraform state: thao tác nào dùng khi nào?

| Tình huống | Cách đúng | Cảnh báo |
|---|---|---|
| Đổi tên/move resource trong cùng configuration | `moved` block, sau đó plan | Review rằng remote object không đổi. |
| Move address giữa hai state cùng remote object/provider type | Backup state, lock cả hai, `terraform state mv` có kiểm soát | Rehearse và có rollback; không chạy song song. |
| Đưa resource AWS/Azure đã tạo ngoài Terraform vào quản lý | Viết config, dùng `import` block/`terraform import`, plan tới no-op | Import không tạo config đầy đủ. |
| OCI resource được migrate thành resource AWS/Azure mới | Tạo/import resource **đích** vào state đích; giữ state nguồn tới decommission | Không dùng `state mv` để biến OCID thành ARN/ARM ID. |
| Xóa khỏi quản lý nhưng giữ resource | `removed` block với `destroy = false` hoặc `state rm` theo procedure | Resource trở thành unmanaged; ghi owner và lifecycle. |
| Provider/state backend migration | Backup, đọc official guide, `terraform init -migrate-state`, verify lineage/serial | Không sửa JSON state bằng tay; không `state push -force` nếu chưa có recovery plan. |

### Gate cuối trước production apply

```text
[ ] Đúng cloud identity/account/subscription/tenancy
[ ] Đúng region và backend/state key
[ ] Lock đang hoạt động; không có run khác
[ ] Plan từ đúng commit, chưa hết hạn và đã được duyệt
[ ] Không có unexpected delete/replace/public exposure
[ ] Cost/quota/capacity đã duyệt
[ ] Backup + rollback đã xác minh
[ ] Monitoring/on-call/change window sẵn sàng
```
