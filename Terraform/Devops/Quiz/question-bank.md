# Question Bank và ma trận truy vết

File này là index, không chứa đáp án. `MCQ` = trắc nghiệm, `T/F` = đúng/sai, `Explain` = giải thích, `Scenario` = tình huống, `Debug` = điều tra/sửa lỗi.

## Foundation

| ID | Lesson | Dạng | Năng lực | Điểm |
|---|---|---|---|---:|
| F01 | D01 | MCQ | DevOps outcome/ownership | 1 |
| F02 | D01 | T/F | Silo và team naming | 1 |
| F03 | D02 | MCQ | Linux permission | 1 |
| F04 | D02 | T/F | Process signal | 1 |
| F05 | D03 | MCQ | DNS TTL | 1 |
| F06 | D03 | MCQ | TLS server verification | 1 |
| F07 | D04 | MCQ | Safe Git revert | 1 |
| F08 | D05 | T/F | Exit-code contract | 1 |
| F09 | D01 | Explain | Flow/feedback/learning và metric | 2 |
| F10 | D02 | Explain | systemd diagnosis | 2 |
| F11 | D03 | Explain | End-to-end request path | 2 |
| F12 | D04 | Explain | Git object/SemVer/release | 2 |
| F13 | D05 | Explain | Idempotency/retry | 2 |
| F14 | D06 | Explain | Cloud boundary/responsibility | 2 |
| F15 | D05, D11 | Debug | Bash backup/secret safety | 3 |
| F16 | D02, D03 | Scenario | HTTP 502 diagnosis | 3 |
| F17 | D04, D11 | Scenario | Secret leak trong Git | 3 |
| F18 | D02 | Debug | Linux service permission | 3 |
| F19 | D01, D08 | Scenario | Flaky CI governance | 3 |
| F20 | D06 | Scenario | Landing-zone checklist | 3 |

Đề: [levels/01-foundation.md](levels/01-foundation.md) · Đáp án: [answers/01-foundation-answers.md](answers/01-foundation-answers.md)

## Core

| ID | Lesson | Dạng | Năng lực | Điểm |
|---|---|---|---|---:|
| C01 | D07 | MCQ | Terraform state purpose | 1 |
| C02 | D07 | T/F | Tool boundary | 1 |
| C03 | D08 | MCQ | Immutable artifact promotion | 1 |
| C04 | D08 | T/F | Cache vs artifact | 1 |
| C05 | D09 | MCQ | Container PID 1 | 1 |
| C06 | D09 | MCQ | Image vs container | 1 |
| C07 | D11 | MCQ | SBOM purpose | 1 |
| C08 | D11 | T/F | Secret/state exposure | 1 |
| C09 | D07 | Explain | Terraform/Packer/Ansible/cloud-init | 2 |
| C10 | D07 | Explain | Configuration/state/drift | 2 |
| C11 | D08 | Explain | Build-once/promote-many | 2 |
| C12 | D08 | Explain | Deployment strategies | 2 |
| C13 | D09 | Explain | Namespace/cgroup/rootless | 2 |
| C14 | D11 | Explain | Pipeline threat model | 2 |
| C15 | D09, D11 | Debug | Dockerfile hardening | 3 |
| C16 | D08, D11 | Debug | Untrusted CI/deploy pipeline | 3 |
| C17 | D07 | Scenario | Image/config drift | 3 |
| C18 | D08, D11 | Scenario | CVE remediation | 3 |
| C19 | D06, D11 | Scenario | Cloud workload identity | 3 |
| C20 | D08, D14 | Scenario | Release/schema compatibility | 3 |

Đề: [levels/02-core.md](levels/02-core.md) · Đáp án: [answers/02-core-answers.md](answers/02-core-answers.md)

## Cloud-Native

| ID | Lesson | Dạng | Năng lực | Điểm |
|---|---|---|---|---:|
| N01 | D10 | MCQ | Deployment controller | 1 |
| N02 | D10 | T/F | Service/Endpoint readiness | 1 |
| N03 | D10 | MCQ | Probe semantics | 1 |
| N04 | D10 | MCQ | Scheduler requests | 1 |
| N05 | D10, D11 | T/F | Kubernetes Secret | 1 |
| N06 | D10, D11 | MCQ | RBAC scope | 1 |
| N07 | D10 | T/F | NetworkPolicy directions | 1 |
| N08 | D12 | MCQ | Trace context | 1 |
| N09 | D10 | Explain | Reconciliation/GitOps | 2 |
| N10 | D03, D10 | Explain | Kubernetes request path | 2 |
| N11 | D10, D13 | Explain | Requests/limits/right-size | 2 |
| N12 | D10 | Explain | Helm vs GitOps | 2 |
| N13 | D12 | Explain | OpenTelemetry pipeline/sampling | 2 |
| N14 | D12, D13 | Explain | SLI/SLO/burn rate | 2 |
| N15 | D10, D12 | Debug | CrashLoopBackOff | 3 |
| N16 | D10, D13 | Debug | Pending Pod/capacity | 3 |
| N17 | D08, D10, D14 | Scenario | Kubernetes zero-downtime rollout | 3 |
| N18 | D03, D10 | Debug | NetworkPolicy/DNS/DB | 3 |
| N19 | D12, D16 | Scenario | Telemetry cardinality/cost | 3 |
| N20 | D08, D10, D11 | Scenario | Cluster supply-chain admission | 3 |

Đề: [levels/03-cloud-native.md](levels/03-cloud-native.md) · Đáp án: [answers/03-cloud-native-answers.md](answers/03-cloud-native-answers.md)

## Production

| ID | Lesson | Dạng | Năng lực | Điểm |
|---|---|---|---|---:|
| P01 | D13 | MCQ | SLI definition | 1 |
| P02 | D13 | T/F | Error-budget intent | 1 |
| P03 | D14 | MCQ | Cache-aside failure | 1 |
| P04 | D14, D19 | T/F | Delivery/idempotency semantics | 1 |
| P05 | D16 | MCQ | FinOps unit economics | 1 |
| P06 | D17 | MCQ | Incident Commander | 1 |
| P07 | D18 | T/F | Restore testing | 1 |
| P08 | D18 | MCQ | RPO | 1 |
| P09 | D12, D13 | Explain | RED/USE/correlation | 2 |
| P10 | D13 | Explain | SLO specification | 2 |
| P11 | D14 | Explain | Expand/contract migration | 2 |
| P12 | D15 | Explain | Platform-as-product | 2 |
| P13 | D16 | Explain | FinOps trade-off | 2 |
| P14 | D17 | Explain | Blameless postmortem | 2 |
| P15 | D12, D13 | Scenario | Tail latency/saturation | 3 |
| P16 | D08, D14, D17 | Debug | Destructive DB migration | 3 |
| P17 | D15, D20 | Scenario | Platform adoption | 3 |
| P18 | D16 | Scenario | Egress/log cost anomaly | 3 |
| P19 | D18, D19 | Scenario | Regional failover/data loss | 3 |
| P20 | D14, D18 | Debug | Backup restore misses RTO | 3 |

Đề: [levels/04-production.md](levels/04-production.md) · Đáp án: [answers/04-production-answers.md](answers/04-production-answers.md)

## Senior

| ID | Lesson | Dạng | Năng lực | Điểm |
|---|---|---|---|---:|
| S01 | D19 | T/F | Retry amplification | 1 |
| S02 | D19, D20 | T/F | Multi-cloud decision | 1 |
| S03 | D20 | MCQ | Decision framing | 1 |
| S04 | D17, D20 | T/F | Blameless/accountability | 1 |
| S05 | D15 | MCQ | Platform north-star | 1 |
| S06 | D13, D16 | MCQ | Capacity planning | 1 |
| S07 | D18 | MCQ | RTO vs SLA | 1 |
| S08 | D11, D20 | T/F | Compliance/control effectiveness | 1 |
| S09 | D01, D08, D12 | Explain | Commit-to-outcome traceability | 2 |
| S10 | D13, D19 | Explain | Resilience control interaction | 2 |
| S11 | D06, D19 | Explain | Hybrid architecture | 2 |
| S12 | D16, D20 | Explain | Cost/SLO/lead-time strategy | 2 |
| S13 | D15, D20 | Explain | Mentoring/bus factor/toil | 2 |
| S14 | D17, D20 | Explain | Portfolio risk/problem/change | 2 |
| S15 | D12, D17, D20 | Scenario | Major-incident leadership | 3 |
| S16 | D13, D19 | Debug | Retry storm/cascade | 3 |
| S17 | D14, D18, D19 | Scenario | Active-active payment consistency | 3 |
| S18 | D01, D15, D20 | Scenario | DevOps transformation | 3 |
| S19 | D08, D11, D17 | Scenario | Supply-chain incident | 3 |
| S20 | D06, D13, D14, D15, D16, D17, D18, D19, D20 | Scenario | Executive capstone defense | 3 |

Đề: [levels/05-senior.md](levels/05-senior.md) · Đáp án: [answers/05-senior-answers.md](answers/05-senior-answers.md)

## Bộ ôn tập theo lesson

| Lesson | Câu đại diện | Có thể tự xác nhận khi... |
|---|---|---|
| D01 | F01, F02, F09, F19, S09, S18 | Giải thích flow/feedback/outcome và tránh gaming metric |
| D02 | F03, F04, F10, F16, F18 | Điều tra process/service/permission bằng evidence |
| D03 | F05, F06, F11, F16, N10, N18 | Vẽ/debug được DNS→TLS→LB→app và return path |
| D04 | F07, F12, F17 | Vận hành Git/release/secret incident an toàn |
| D05 | F08, F13, F15 | Viết automation idempotent, retry/exit đúng |
| D06 | F14, F20, C19, S11, S20 | Thiết kế cloud boundary/identity/resilience có lý do |
| D07 | C01, C02, C09, C10, C17 | Chọn đúng IaC/image/config source of truth |
| D08 | F19, C03, C04, C11, C12, C16, C18, C20, N17, N20, P16, S09, S19 | Truy đúng commit→digest→deployment và release data-compatible |
| D09 | C05, C06, C13, C15 | Hiểu runtime isolation và harden image/container |
| D10 | N01–N07, N09–N12, N15–N18, N20 | Thiết kế/debug workload Kubernetes production |
| D11 | F15, F17, C07, C08, C14–C16, C18, C19, N05, N06, N20, S08, S19 | Bảo vệ identity/secret/supply chain end-to-end |
| D12 | N08, N13–N15, N19, P09, P15, S09, S15 | Xây telemetry có context, chi phí và use case rõ |
| D13 | N11, N14, N16, P01, P02, P09, P10, P15, S06, S10, S16, S20 | Dùng SLO/capacity/resilience control để ra quyết định |
| D14 | C20, N17, P03, P04, P11, P16, P20, S17, S20 | Quản transaction/cache/message/migration/recovery |
| D15 | P12, P17, S05, S13, S18, S20 | Xây platform như product, đo developer outcome |
| D16 | N19, P05, P13, P18, S06, S12, S20 | Tối ưu unit cost/capacity mà giữ SLO/security |
| D17 | P06, P14, P16, S04, S14, S15, S19, S20 | Điều phối incident/change/problem và đóng action |
| D18 | P07, P08, P19, P20, S07, S17, S20 | Chứng minh restore/failover đạt RPO/RTO |
| D19 | P04, P19, S01, S02, S10, S11, S16, S17, S20 | Lập luận partial failure/consistency/multi-cloud |
| D20 | P17, S02–S05, S08, S12–S15, S18, S20 | Chuyển ambiguity thành strategy/risk/outcome/ownership |

## Cách tạo đề ôn

- Theo lesson: chọn 1 câu 1 điểm + 1 Explain + 1 Scenario/Debug.
- Theo tuần: lấy ngẫu nhiên 4 câu mỗi cấp, bắt buộc có security, data, incident và cost.
- Mock interview: người học nói thành tiếng, vẽ request/data/trust path và nêu evidence bác bỏ từng giả thuyết.
- Retest: đổi input/failure mode, không chỉ học thuộc đáp án; ghi lại câu sai trong answer sheet.

