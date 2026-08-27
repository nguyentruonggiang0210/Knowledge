# Ngân hàng câu hỏi và ma trận truy vết

File này là **index**, không chứa đáp án. Dùng mã câu để chọn ngẫu nhiên, tạo đề ôn theo lesson hoặc ghi nhật ký sửa sai. `MCQ` = trắc nghiệm, `T/F` = đúng/sai, `Explain` = giải thích, `Scenario` = tình huống, `Debug` = sửa/phân tích code.

## Level 1 – Foundation

| ID | Lesson | Dạng | Năng lực kiểm tra | Điểm |
|---|---|---|---|---:|
| F01 | L01 | MCQ | Declarative IaC và convergence | 1 |
| F02 | L01, L03 | T/F | Plan có/không mutation | 1 |
| F03 | L03 | MCQ | Init workflow | 1 |
| F04 | L02, L05 | Explain | Anatomy của HCL và reference | 2 |
| F05 | L03 | Debug | Required provider/source/version | 3 |
| F06 | L02 | MCQ | Collection type | 1 |
| F07 | L04, L06, L12 | T/F | Sensitive value và state | 1 |
| F08 | L01, L03 | Explain | Idempotency/no-op plan | 2 |
| F09 | L03, L05 | Explain | Đọc action/replacement trong plan | 2 |
| F10 | L05 | MCQ | Data source vs resource | 1 |
| F11 | L03, L13 | MCQ | Formatting workflow | 1 |
| F12 | L03, L13 | T/F | Giới hạn của validate | 1 |

Đề: [levels/01-foundation.md](levels/01-foundation.md) · Đáp án: [answers/01-foundation-answers.md](answers/01-foundation-answers.md)

## Level 2 – Core

| ID | Lesson | Dạng | Năng lực kiểm tra | Điểm |
|---|---|---|---|---:|
| C01 | L05 | MCQ | Implicit graph edge | 1 |
| C02 | L05 | Explain | Implicit/explicit dependency | 2 |
| C03 | L01, L05 | T/F | Resource address và file layout | 1 |
| C04 | L05, L06, L15 | Scenario | `count` → `for_each` và identity | 3 |
| C05 | L06, L12 | MCQ | Tính nhạy cảm của state | 1 |
| C06 | L02, L05 | Debug | `for_each`, set/map và key stability | 3 |
| C07 | L02, L04 | Explain | Variable validation/type | 2 |
| C08 | L07 | Explain | Module interface/encapsulation | 2 |
| C09 | L05 | MCQ | Lifecycle guard | 1 |
| C10 | L06 | T/F | `moved` semantics | 1 |
| C11 | L06 | MCQ | State locking | 1 |
| C12 | L02, L05 | Debug | For expression và duplicate key | 3 |
| C13 | L02, L04 | MCQ | `can()` trong validation | 1 |
| C14 | L06 | Scenario | Brownfield import an toàn | 3 |

Đề: [levels/02-core.md](levels/02-core.md) · Đáp án: [answers/02-core-answers.md](answers/02-core-answers.md)

## Level 3 – OCI

| ID | Lesson | Dạng | Năng lực kiểm tra | Điểm |
|---|---|---|---|---:|
| O01 | L08 | MCQ | Compartment và governance | 1 |
| O02 | L09 | MCQ | NAT cho private subnet | 1 |
| O03 | L09 | T/F | End-to-end public reachability | 1 |
| O04 | L09 | MCQ | NSG vs security list | 1 |
| O05 | L09 | Explain | Route vs traffic control | 2 |
| O06 | L09, L10 | Debug | Service Gateway/Object Storage | 3 |
| O07 | L08, L12 | MCQ | Instance principal | 1 |
| O08 | L08 | Explain | Group/dynamic group/policy | 2 |
| O09 | L10, L12 | Scenario | Cloud-init và secret/rollout | 3 |
| O10 | L03, L15 | Debug | Provider alias multi-region | 3 |
| O11 | L10, L16 | MCQ | Object Storage resilience | 1 |
| O12 | L11, L16 | Explain | LB health troubleshooting | 2 |
| O13 | L09, L10, L11, L16 | Scenario | OCI regional HA design | 3 |
| O14 | L08, L12, L16 | Debug | IAM `NotAuthorizedOrNotFound` | 3 |

Đề: [levels/03-oci.md](levels/03-oci.md) · Đáp án: [answers/03-oci-answers.md](answers/03-oci-answers.md)

## Level 4 – Production

| ID | Lesson | Dạng | Năng lực kiểm tra | Điểm |
|---|---|---|---|---:|
| P01 | L06, L14 | MCQ | Remote backend | 1 |
| P02 | L12, L14 | T/F | Saved plan security | 1 |
| P03 | L06, L14, L16 | Explain | Stale lock/force unlock | 2 |
| P04 | L12, L13, L14 | Scenario | Reviewable CI/CD pipeline | 3 |
| P05 | L12, L16 | Scenario | Secret incident response | 3 |
| P06 | L03, L12 | MCQ | Provider dependency lock | 1 |
| P07 | L06, L14, L16 | Explain | Drift management | 2 |
| P08 | L06, L14 | MCQ | CLI workspace boundary | 1 |
| P09 | L12, L13 | Explain | Policy-as-code guardrail | 2 |
| P10 | L06, L14 | Debug | Concurrent/stale plan | 3 |
| P11 | L16 | Scenario | State/region DR runbook | 3 |
| P12 | L16 | MCQ | FinOps change signal | 1 |
| P13 | L16 | Explain | Post-deploy observability | 2 |
| P14 | L14, L16 | Scenario | Failed change recovery | 3 |

Đề: [levels/04-production.md](levels/04-production.md) · Đáp án: [answers/04-production-answers.md](answers/04-production-answers.md)

## Level 5 – Expert

| ID | Lesson | Dạng | Năng lực kiểm tra | Điểm |
|---|---|---|---|---:|
| E01 | L06 | MCQ | Declarative state move | 1 |
| E02 | L05, L16 | T/F | Giới hạn của `-target` | 1 |
| E03 | L03, L12 | MCQ | Constraint + lock file | 1 |
| E04 | L07, L15, L17, Refer | Explain | Multi-cloud abstraction trade-off | 2 |
| E05 | L06, L07, L14 | Explain | State decomposition ở quy mô lớn | 2 |
| E06 | L03, L07, L15 | Explain | Provider composition/alias | 2 |
| E07 | L06, L16 | Scenario | Brownfield adoption program | 3 |
| E08 | L05, L06, L15 | Scenario | Zero-recreate address migration | 3 |
| E09 | L06, L14, L16 | Scenario | Backend migration | 3 |
| E10 | L05, L07 | Debug | Dependency cycle/module boundary | 3 |
| E11 | L07, L12, L15, L17, Refer | Scenario | Multi-cloud platform contract | 3 |
| E12 | L06, L12, L16 | Scenario | State incident recovery | 3 |

Đề: [levels/05-expert.md](levels/05-expert.md) · Đáp án: [answers/05-expert-answers.md](answers/05-expert-answers.md)

## Bộ ôn tập nhanh theo lesson

| Lesson | Câu đại diện | Tiêu chí đạt nhanh |
|---|---|---|
| L01 | F01, F02, F08, C03 | Giải thích desired state, idempotency và configuration model |
| L02 | F04, F06, C06, C07, C12, C13 | Đọc/viết HCL typed và expressions ổn định |
| L03 | F02, F03, F05, F08, F09, F11, F12, O10, P06, E03, E06 | Workflow/provider/auth/version/plan |
| L04 | F07, C07, C13 | Thiết kế typed input/output, validation và secret boundary |
| L05 | F04, F09, F10, C01–C04, C06, C09, C12, E02, E08, E10 | Graph/address/identity/lifecycle |
| L06 | F07, C04–C05, C10–C11, C14, P01, P03, P07–P08, P10, E01, E05, E07–E09, E12 | State/backend/import/refactor/recovery |
| L07 | C08, E04–E06, E10–E11 | Module contract/composition/versioning |
| L08 | O01, O07–O08, O14 | OCI identity/IAM/governance/principal |
| L09 | O02–O06, O13 | VCN/route/security/DNS packet path |
| L10 | O06, O09, O11, O13 | Compute/cloud-init/storage/resilience |
| L11 | O12–O13 | Data service, LB health và DNS |
| L12 | F07, C05, O07, O09, O14, P02, P04–P06, P09, E03, E11–E12 | Secret/policy/supply-chain/incident |
| L13 | F11–F12, P04, P09 | Testing, static/security/policy gates |
| L14 | P01–P04, P07–P08, P10, P14, E05, E09 | Pipeline/artifact/approval/concurrency |
| L15 | C04, O10, E04, E06, E08, E11 | Stable transformation, alias và migration |
| L16 | O11–O14, P03, P05, P07, P11–P14, E02, E07, E09, E12 | Troubleshooting/drift/FinOps/DR |
| L17 | E04, E11 và practical capstone | Tích hợp architecture, security, delivery và operations |

## Cách tạo đề ngẫu nhiên thủ công

- Ôn một lesson: chọn 1 câu nhớ/hiểu + 1 câu code + 1 câu tình huống từ hàng tương ứng.
- Ôn theo tuần: lấy 2 câu mỗi level (10 câu), bắt buộc có ít nhất 1 câu state/security.
- Mock interview: người hỏi chọn 5 câu Explain/Scenario/Debug, yêu cầu ứng viên nói thành tiếng và vẽ dependency/data flow.
- Retest: chỉ chọn các mã trong “Nhật ký sửa sai”; đổi input/tên resource để tránh học thuộc đáp án.
