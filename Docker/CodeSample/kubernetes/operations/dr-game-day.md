# Disaster recovery game day

## Scenario

Chọn một: namespace/app bị xóa, storage corruption, zone loss, control-plane/etcd loss, region loss hoặc credential/KMS unavailable. Ghi rõ những gì **không** mô phỏng để tránh kết luận quá mức.

## Safety gate

- [ ] Chỉ chạy sandbox/isolated restore target; context và account được hai người xác nhận.
- [ ] Không chạy delete/restore đè production.
- [ ] Backup source read-only; Secret/key không đưa vào log/chat.
- [ ] Có stop condition, owner, budget/cleanup plan.

## Objectives

- Business service: ____________________
- RPO: ____________________
- RTO: ____________________
- Last known good backup/timezone: ____________________
- Success validation/checksum/business transaction: ____________________

## Timeline

| UTC | Hành động | Bằng chứng/kết quả | Người phụ trách |
|---|---|---|---|
| | Detect/declare | | |
| | Provision isolated target | | |
| | Restore identity/keys/config | | |
| | Restore cluster objects | | |
| | Restore data | | |
| | Validate and measure | | |
| | Cleanup | | |

## Validation

- [ ] API/controllers/add-ons healthy, correct version.
- [ ] Workload Ready không chỉ Running; Service/Endpoint/DNS/TLS test pass.
- [ ] Database/schema/checksum/row counts và business transaction pass.
- [ ] Identity, Secret rotation, external dependencies và audit work.
- [ ] Observability/alerts/backup resume; không trỏ nhầm production endpoints.
- [ ] Actual RPO/RTO được đo, không ước lượng.

## Review

Ghi manual steps, missing artifact/permission/quota, stale docs, bottleneck lớn nhất và action có owner/deadline/test. Backup job success không phải success criterion; restore + business validation mới là bằng chứng.
