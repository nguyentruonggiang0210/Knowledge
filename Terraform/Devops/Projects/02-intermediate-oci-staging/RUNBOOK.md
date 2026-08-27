# Runbook - OCI staging unhealthy hoặc Terraform apply lỗi

> Không sao chép OCID, token, private key hoặc plan/state vào ticket công khai. Link tới hệ thống có access control.

## Metadata

| Trường | Giá trị cần điền |
|---|---|
| Service/environment | `<service>/staging` |
| OCI tenancy/compartment/region | `<friendly identifier, không cần credential>` |
| Terraform state key/stack | `<backend reference>` |
| Dashboard/log query | `<link>` |
| Deployment owner | `<team/contact>` |
| Last tested | `<timestamp + result>` |
| Known-good image | `<digest>` |

## Safety và scope check

Trước mọi thao tác:

```powershell
oci iam region-subscription list
terraform -chdir=infra/environments/staging workspace show
terraform -chdir=infra/environments/staging state list
```

Xác minh tenancy/compartment/region/backend bằng output an toàn của pipeline. Không dùng workspace như security boundary duy nhất. Không chạy `-lock=false`, `state push -force` hoặc `-target` theo thói quen.

## Nhánh A - Service unhealthy sau deploy

1. Ghi thời điểm deploy, image digest, Terraform apply ID và error-rate/latency.
2. Kiểm tra LB health/backend status, app readiness và recent app/runtime logs.
3. Nếu lỗi bắt đầu cùng release và hạ tầng khỏe, dừng rollout.
4. Rollback image digest/config về known-good qua cùng pipeline.
5. Không rollback database schema nếu chưa xác nhận backward compatibility/change plan.
6. Chạy smoke test qua LB và trực tiếp private path nếu runbook access cho phép.
7. Xác nhận health ổn định trong observation window đã định nghĩa.

### Abort/escalate

Escalate ngay nếu nghi data corruption, credential exposure, network policy mở public ngoài ý muốn hoặc rollback không giảm error trong `<10 phút>`.

## Nhánh B - Terraform apply thất bại

1. Không chạy apply lần hai ngay. Lưu run ID và diagnostic đã redact.
2. Xác định state lock còn active và runner cũ còn sống không.
3. Chạy read-only `terraform plan` chỉ sau khi run cũ kết thúc/lock được giải phóng.
4. Kiểm tra OCI work request/resource lifecycle để biết API đã tạo một phần hay chưa.
5. Nếu resource tồn tại ngoài state, quyết định import, retry hoặc xóa qua change được review; không sửa state JSON tay.
6. Nếu lock mồ côi, chỉ `force-unlock <LOCK_ID>` sau khi chứng minh không có writer và có approval.
7. Plan lại toàn bộ graph; nếu dùng `-target` cho recovery hiếm hoi, bắt buộc full plan ngay sau đó.

## Nhánh C - Database/dependency unavailable

1. Xác nhận app live nhưng not-ready và LB loại backend đúng.
2. Kiểm tra connection saturation, storage, backup job, network rule và dependency event.
3. Ngừng deploy/schema change; hạn chế writer nếu có nguy cơ consistency.
4. Thực hiện restore/failover chỉ theo change/DR plan đã test.
5. Sau recovery, kiểm tra row count/checksum/business query trước mở traffic đầy đủ.

## Verify

- [ ] LB/backend healthy và readiness pass.
- [ ] Smoke test đọc/ghi idempotent pass.
- [ ] Error rate/latency/saturation về baseline.
- [ ] Đúng image digest và schema version.
- [ ] Full Terraform plan không có unexpected create/update/delete.
- [ ] Không có public exposure, orphan volume/IP/LB do failed apply.

## Sau sự cố

- Hoàn thiện [incident timeline](../../Templates/INCIDENT-TIMELINE.md).
- Với impact đáng kể, dùng [postmortem](../../Templates/POSTMORTEM-BLAMELESS.md).
- Reconcile mọi manual mitigation bằng Terraform, update test/runbook và tạo action item có owner/due date.
