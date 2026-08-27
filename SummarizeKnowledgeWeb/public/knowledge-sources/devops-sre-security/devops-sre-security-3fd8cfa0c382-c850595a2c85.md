# DevOps Portfolio Projects

Bốn dự án này tạo thành một lộ trình thực hành tăng dần từ việc giao một dịch vụ local có thể vận hành tới thiết kế và diễn tập một nền tảng multi-cloud. Mỗi dự án phải tạo ra **bằng chứng có thể kiểm tra**, không chỉ ảnh chụp màn hình hoặc sơ đồ đẹp.

## Lộ trình

| Cấp độ | Dự án | Trọng tâm | Thời lượng gợi ý |
|---|---|---|---:|
| Beginner | [01 - Local service delivery](./01-beginner-local-delivery/README.md) | Git, test, container, Compose, health check, logs, runbook | 1-2 tuần |
| Intermediate | [02 - OCI staging bằng Terraform](./02-intermediate-oci-staging/README.md) | IaC, module, remote state, CI plan/apply, security/cost cơ bản | 2-4 tuần |
| Senior production | [03 - Production platform](./03-senior-production-platform/README.md) | SLO, progressive delivery, policy, observability, reliability, incident/DR | 4-8 tuần |
| Capstone master | [04 - Multi-cloud resilience](./04-capstone-multicloud-resilience/README.md) | OCI primary, AWS/Azure DR, data consistency, failover/failback, governance | 6-12 tuần |

Không cần làm cả bốn dự án cùng lúc. Hoàn thành acceptance criteria của dự án hiện tại, ghi lại điểm yếu, rồi mới tăng phạm vi.

## Chuẩn đầu ra cho một portfolio đáng tin

Mỗi repository dự án nên có cấu trúc tương tự:

```text
project/
├── README.md                  # vấn đề, kiến trúc, cách chạy, kết quả
├── app/                       # source và test của workload nhỏ
├── infra/                     # Terraform/root modules/environments
├── deploy/                    # Compose/Kubernetes/deployment manifests
├── docs/
│   ├── adr/
│   ├── slo.md
│   ├── threat-model.md
│   ├── runbooks/
│   └── evidence/              # output đã redacted, biểu đồ, test report
├── scripts/                   # automation idempotent
├── tests/                     # unit/integration/smoke/policy tests
└── .ci/ hoặc .github/workflows/
```

Không commit state, plan file, `.env`, `.tfvars` chứa dữ liệu thật, credential, private key, database dump hoặc log chưa redact.

## Bộ template dùng chung

Sao chép rồi điền các biểu mẫu trong [Templates](../Templates/README.md):

- [ADR](../Templates/ADR.md)
- [SLO và error budget](../Templates/SLO.md)
- [Runbook](../Templates/RUNBOOK.md)
- [Postmortem blameless](../Templates/POSTMORTEM-BLAMELESS.md)
- [Incident timeline](../Templates/INCIDENT-TIMELINE.md)
- [Change plan và rollback](../Templates/CHANGE-PLAN-ROLLBACK.md)
- [DR test](../Templates/DR-TEST.md)
- [Threat model](../Templates/THREAT-MODEL.md)
- [Capacity và cost review](../Templates/CAPACITY-COST-REVIEW.md)
- [Production readiness review](../Templates/PRODUCTION-READINESS.md)

## Definition of Done chung

Một dự án chỉ được xem là hoàn tất khi:

1. Người khác có thể làm theo README từ môi trường sạch.
2. Build/test/deploy không dựa vào bước thủ công không được ghi lại.
3. Có health/smoke test trả exit code rõ ràng.
4. Có rollback và cleanup đã diễn tập, không chỉ mô tả.
5. Không có secret trong Git history, artifact, log hoặc Terraform state không được bảo vệ.
6. Có metric/log/alert đủ trả lời: hệ thống có khỏe không, người dùng có bị ảnh hưởng không, nguyên nhân gần nhất ở đâu?
7. Có chi phí ước tính, owner, budget/giới hạn và danh sách tài nguyên phải dọn.
8. Acceptance criteria có evidence: command output đã redact, test report, dashboard, timeline hoặc pull request.
9. `terraform plan` sau apply là no-op hoặc mọi drift đã được giải thích.
10. Tài liệu ghi rõ điều gì **chưa** production-ready.

## Quy tắc an toàn

- Dự án 1 chạy local-first và không cần cloud.
- Dự án 2-4 luôn có đường `validate/plan/test` không tạo tài nguyên trả phí.
- Trước cloud apply: xác minh identity/scope/region/state, kiểm tra quota và pricing hiện tại, đặt budget, duyệt plan.
- Không thử DR bằng cách phá production thật. Dùng sandbox hoặc fault injection có blast radius được duyệt.
- Không chạy `destroy` production như một thao tác cleanup. Production decommission là một change có backup, approval và rollback.
