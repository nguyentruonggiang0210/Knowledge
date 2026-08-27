# Runbook - OCI primary sang AWS/Azure DR và failback

> Tùy chỉnh cho một DR cloud cụ thể. Runbook chưa có command/link thật và chưa diễn tập phải gắn nhãn `UNVERIFIED`.

## Metadata

| Trường | Giá trị cần điền |
|---|---|
| Service / owner | `<service> / <team>` |
| Primary / DR | `OCI <region>` / `<AWS|Azure region>` |
| RTO / RPO | `<minutes>` / `<minutes or data units>` |
| Replication/backup dashboard | `<link>` |
| Traffic control | `<link/tool + owner>` |
| Primary/DR state references | `<two separate references>` |
| Incident escalation | `<contacts>` |
| Last test | `<timestamp, result, report>` |

## Preconditions duy trì hằng ngày

- Standby readiness/synthetic test pass theo lịch.
- Backup freshness và replication lag trong RPO.
- DR quota/capacity, image digest, certificate, DNS, secret và identity còn hợp lệ.
- Runbook access có ít nhất hai người; break-glass được test/audit.
- Không có unexpected Terraform drift ở cả primary và DR.

## Declaration gate

Incident Commander cùng service/data owner quyết định failover khi:

1. primary impact đã xác minh và mitigation tại chỗ không đạt trước RTO;
2. DR readiness/capacity và expected RPO đã biết;
3. business chấp nhận data loss/consistency state dự kiến;
4. có phương án fence primary writer và tránh split-brain;
5. security/compliance không chặn data processing ở DR region/cloud;
6. communication channel/timeline/roles đã mở.

Nếu chưa đủ thông tin, ưu tiên giảm impact và thu thập checkpoint; không chuyển traffic chỉ vì một health check fail.

## Phase 1 - Freeze và fence primary

1. Freeze deploy/schema/infrastructure change ở cả hai cloud.
2. Ghi timestamp declaration, last known good transaction/checkpoint và replication lag.
3. Chặn writer primary bằng mechanism đã test; xác minh từ ít nhất hai signal.
4. Dừng replication consumer nếu cần để không nhân corruption; bảo toàn backup/version.
5. Ghi expected data loss window so với RPO và nhận data owner approval.

### Abort

Dừng failover nếu không thể fence writer, DR data corrupt/không giải mã được, target credential/certificate sai hoặc security incident chưa được cô lập.

## Phase 2 - Restore/promote và scale DR

1. Xác minh đúng DR account/subscription, region, state và protected apply identity.
2. Scale/apply từ reviewed plan; không chỉnh console tùy hứng.
3. Restore/promote data từ checkpoint đã chọn.
4. Chạy schema/version, row/object count, checksum và business invariant tests.
5. Deploy **cùng approved image digest**; cấp native workload identity/secret.
6. Chạy private smoke, synthetic và load nhỏ; xác minh logs/metrics/traces/audit.

## Phase 3 - Chuyển traffic

1. Chuyển canary weight nhỏ hoặc test cohort tới DR.
2. Theo dõi error/latency/data consistency/saturation trong observation window.
3. Tăng weight theo các gate đã duyệt; ghi timestamp mỗi thay đổi.
4. Khi critical journey usable cho intended traffic, ghi RTO thực tế.
5. Ghi last durable primary write và first accepted DR write để tính RPO thực tế.
6. Cập nhật stakeholder về recovery, data loss biết được và risk còn lại.

## Phase 4 - Operate on DR

- Xác nhận backup mới ở DR và restore path.
- Theo dõi quota/capacity/cost, replication/failback backlog và dependency allowlist.
- Không hạ primary/xóa evidence ngay; cô lập và điều tra.
- Mọi temporary access/rule phải có owner/expiry.

## Failback gate

Không failback chỉ vì primary “ping được”. Cần:

- root failure đã sửa và verify;
- primary rebuilt/reconciled từ code, không còn unknown drift;
- data từ DR đồng bộ về primary, checksum/business invariant pass;
- primary capacity, certificate, identity, dependency và telemetry ready;
- DR writer fencing/traffic plan và rollback-to-DR còn khả thi;
- change approval và observation window.

## Failback steps

1. Đồng bộ DR writes về primary trong khi DR vẫn là source of truth.
2. Giảm/freeze writes trong window đã truyền thông; chốt final checkpoint.
3. Fence DR writer, verify primary data consistency và enable primary writer.
4. Chuyển canary traffic về OCI; theo dõi SLO/saturation/data.
5. Tăng traffic theo gate; giữ DR ready trong observation window.
6. Hạ DR về intended standby mode; tiếp tục backup/replication.
7. Chạy full Terraform plan cả hai cloud và reconcile mọi manual action.
8. Thu hồi temporary privilege/rule/capacity; cập nhật cost forecast.

## Success criteria

- [ ] Không có thời điểm hai writer không kiểm soát.
- [ ] Critical journey đạt SLO tại DR/primary sau chuyển.
- [ ] RTO/RPO thực đo trong mục tiêu hoặc breach được khai báo.
- [ ] Checksum/business invariants pass; known data loss được document/communicate.
- [ ] Native audit và unified telemetry đủ tái dựng timeline.
- [ ] Cả hai Terraform plan không có unexpected drift.
- [ ] Backup/restore path hoạt động ở trạng thái cuối.

## Sau drill/incident

- Hoàn thiện [DR test report](../../Templates/DR-TEST.md), [timeline](../../Templates/INCIDENT-TIMELINE.md) và [postmortem](../../Templates/POSTMORTEM-BLAMELESS.md).
- So sánh RTO theo phase: detect, decide, fence, restore/scale, validate, traffic/client cache.
- Action item có owner/due/evidence; update runbook rồi diễn tập lại các bước thay đổi.
