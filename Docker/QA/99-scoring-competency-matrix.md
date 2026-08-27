# Ma trận chấm điểm và năng lực

Điểm cao không thay thế trải nghiệm on-call. Để được công nhận một cấp, phải đồng thời đạt điểm lý thuyết, scenario, lab và không vi phạm cổng an toàn.

## 1. Chuẩn hóa điểm

```text
Diagnostic % = điểm / 48 × 100
Docker quiz % = điểm / 64 × 100
Kubernetes quiz % = điểm / 95 × 100
Scenario % = điểm / 120 × 100
Lab % = tổng điểm lab đã làm / (100 × số lab) × 100
```

Điểm tổng hợp sau khi đã làm đủ 8 lab:

```text
Overall = Diagnostic×10% + Docker×15% + Kubernetes×20%
        + Scenario×20% + Labs×35%
```

Không tính Overall nếu chưa làm lab: ghi “lý thuyết tạm thời”, tránh tự nhận production-ready.

## 2. Mức năng lực

| Mức | Điều kiện tối thiểu đồng thời | Có thể làm gì | Chưa nên tự làm |
|---|---|---|---|
| L0 — Chưa nền tảng | Diagnostic <50% hoặc safety gate fail | Học/lab có giám sát | Chạm production |
| L1 — Foundation | Diagnostic ≥60%; Docker/K8s quiz từng phần ≥60%; PA-01 và PA-04 pass | Build/run/deploy app chuẩn ở dev, đọc logs/events | Thiết kế cluster hoặc xử lý incident một mình |
| L2 — Project-ready | Docker ≥75%; K8s ≥75%; Scenario ≥65%; PA-01..PA-05 pass | Delivery service thông thường, debug có runbook, network/RBAC/storage baseline | Quyết định HA/DR/security quan trọng không review |
| L3 — Production operator | Docker ≥85%; K8s ≥85%; Scenario ≥80%; cả 8 lab pass; không module nào <75% | On-call, rollout/rollback, capacity, backup/restore, incident response | Thay đổi control plane/multi-tenant critical không peer review |
| L4 — Deep/lead | Mọi quiz ≥90%; Scenario ≥90%; mỗi lab ≥85%; lặp lại sau 30 ngày; dẫn một game day/restore review | Thiết kế platform/SLO/DR/security, review trade-off và đào tạo đội | Vẫn cần peer/change control cho blast radius lớn |

## 3. Điểm theo miền Docker

| Miền | Câu | Điểm tối đa | Ngưỡng đạt |
|---|---|---:|---:|
| Linux/architecture | D01–D08 | 10 | 7 |
| Image/build/supply chain | D09–D24 | 20 | 15 |
| Lifecycle/resources/log | D25–D34 | 13 | 10 |
| Storage/network | D35–D43 | 11 | 8 |
| Compose | D44–D48 | 6 | 5 |
| Security/production | D49–D50 | 4 | 3, và D50 ≥1 |

Nếu storage/network hoặc security dưới ngưỡng, chưa được công nhận Project-ready dù tổng điểm đủ.

## 4. Điểm theo miền Kubernetes

| Miền | Câu | Điểm tối đa | Ngưỡng đạt |
|---|---|---:|---:|
| Architecture/API | K01–K08 | 10 | 7 |
| Workload controllers | K09–K19 | 13 | 10 |
| Config/identity/security | K20–K29 | 13 | 10 |
| Networking | K30–K39 | 14 | 11 |
| Storage | K40–K46 | 9 | 7 |
| Resources/scheduling | K47–K54 | 11 | 8 |
| Reliability/operations | K55–K64 | 16 | 12 |
| Packaging/delivery/tenancy | K65–K70 | 9 | 7 |

Tổng các miền là 95 điểm. Khi chỉnh đề, phải cập nhật cả tổng điểm và bảng này trong cùng pull request.

## 5. Ma trận evidence thực hành

| Năng lực | Evidence tối thiểu | Lab |
|---|---|---|
| Build/cache/image | Rebuild cache hit, image history, multi-stage/non-root | PA-01, PA-08 |
| Runtime/process | SIGTERM/drain/restart/OOM/throttle test | PA-01, PA-03 |
| Network | Positive + negative path, DNS/refused/timeout phân biệt | PA-02, PA-05 |
| Data | Backup checksum, restore vào target mới, RPO/RTO đo | PA-02, PA-06, PA-08 |
| K8s desired state | Rollout/rollback, ownership/selectors/endpoints | PA-04 |
| Security | RBAC can-i negative tests, policy enforcement, no secret leak | PA-03, PA-05, PA-08 |
| Reliability | Probe/PDB/topology/HPA/fault recovery | PA-04, PA-07 |
| Observability | SLI/SLO, correlation, actionable alert | PA-07, PA-08 |
| Delivery/DR | Same digest promotion, policy gate, full restore | PA-08 |

## 6. Safety gates — fail ngay

- Làm mất dữ liệu do xóa volume/PVC/namespace hoặc `prune` không xác minh target.
- Đưa secret thật vào Git, image, báo cáo hoặc output công khai.
- Dùng `privileged`, host root mount, Docker socket, cluster-admin/wildcard để “cho chạy được” mà không có yêu cầu và threat model.
- Bypass TLS/signature/admission/NetworkPolicy để sửa triệu chứng.
- Fault injection ngoài lab/namespace được cấp hoặc không có abort condition.
- Khẳng định backup thành công nhưng chưa restore kiểm chứng.

## 7. Kế hoạch bù lỗ hổng

Với mỗi miền dưới ngưỡng, tạo một dòng:

| Miền | Câu sai | Hiểu nhầm cơ chế | Tài liệu chính thức | Lab nhỏ | Ngày retest | Kết quả |
|---|---|---|---|---|---|---|
| Ví dụ: Service | K31, K34 | Nhầm `port`/`targetPort` | Kubernetes Service docs | Service selector + named port | YYYY-MM-DD | — |

Quy tắc retest:

1. Không chép lại đáp án; giải thích bằng sơ đồ/lệnh trên môi trường sạch.
2. Tạo một failure rồi chẩn đoán từ evidence.
3. Retest sau 7 ngày và 30 ngày.
4. Chỉ đánh dấu “đã vững” khi giải thích được trade-off và failure mode, không chỉ nhớ YAML.
