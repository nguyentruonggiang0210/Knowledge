# Ánh xạ Quiz ↔ Lessions 01–17

Đây là ánh xạ chính thức theo cấu trúc `Lessions` hiện tại. Mã `Lxx` trong đề và
ngân hàng câu hỏi trỏ trực tiếp đến bài bên dưới.

| Mã | Chủ đề chuẩn | Năng lực cần đạt |
|---|---|---|
| L01 | [IaC và Terraform foundations](../Lessions/01-iac-terraform-foundations/README.md) | Declarative/imperative, desired/state/remote, idempotency, partial apply |
| L02 | [HCL, type và expressions](../Lessions/02-hcl-types-expressions/README.md) | Type system, collection, for/function, null/unknown/sensitive |
| L03 | [CLI, providers và OCI auth](../Lessions/03-cli-workflow-providers/README.md) | Workflow, plan, provider/version/lock, authentication |
| L04 | [Variables, locals và outputs](../Lessions/04-variables-locals-outputs/README.md) | Typed interface, validation, condition và secret boundary |
| L05 | [Resources, data và graph](../Lessions/05-resources-data-graph/README.md) | Address, dependency, count/for_each, lifecycle |
| L06 | [State, backend, import và refactor](../Lessions/06-state-backend-import-refactor/README.md) | Remote state/lock, workspace, drift, import/moved/removed |
| L07 | [Modules và versioning](../Lessions/07-modules-versioning/README.md) | Contract, composition, provider wiring, SemVer |
| L08 | [OCI identity và governance](../Lessions/08-oci-identity-auth-governance/README.md) | Tenancy/compartment/IAM/principal/tags/budget/quota |
| L09 | [OCI networking](../Lessions/09-oci-networking/README.md) | VCN/subnet/route/gateway/NSG/DNS/hybrid |
| L10 | [OCI compute và storage](../Lessions/10-oci-compute-storage/README.md) | Image/shape/AD-FD/cloud-init/volume/object storage |
| L11 | [OCI data, LB và DNS](../Lessions/11-oci-data-lb-dns/README.md) | Managed data, LB/backend health/TLS, public-private DNS |
| L12 | [Security, secrets và policy](../Lessions/12-security-secrets-policy/README.md) | Secret/state/plan, policy-as-code, supply chain |
| L13 | [Testing và quality](../Lessions/13-testing-quality/README.md) | terraform test/mock, static/security/policy/live test |
| L14 | [CI/CD và team workflow](../Lessions/14-cicd-team-workflow/README.md) | PR plan, protected apply, concurrency, Resource Manager |
| L15 | [Advanced patterns](../Lessions/15-advanced-patterns/README.md) | Stable transformations, dynamic, alias, migration/version gates |
| L16 | [Operations, cost và DR](../Lessions/16-operations-drift-cost-dr/README.md) | Troubleshooting, drift, FinOps, backup/restore, RPO/RTO |
| L17 | [Capstone production](../Lessions/17-capstone-production/README.md) | Tích hợp toàn bộ năng lực và vận hành thực tế |

## Ma trận level → lesson

| Level | Lesson chính | Điều kiện vào |
|---|---|---|
| Foundation | L01–L04, nhập môn L05 | Không |
| Core | L05–L07, vận dụng L02–L04 | Đạt Foundation |
| OCI | L08–L11, vận dụng L03–L07 | Đạt Core; live lab cần OCI sandbox |
| Production | L06, L12–L14, L16 | Đã tự plan/apply ít nhất một stack sandbox |
| Expert | L06–L07, L15–L17 và `Refer` | Hiểu state, module, CI/CD và vận hành production |

## Chuẩn năng lực xuyên suốt

Mỗi lesson nên được kiểm tra theo bốn tầng:

1. **Nhớ/hiểu** – định nghĩa đúng và phân biệt khái niệm gần nhau.
2. **Áp dụng** – viết hoặc sửa được HCL/lệnh.
3. **Phân tích** – đọc plan, dependency graph, state và tình huống lỗi.
4. **Đánh giá/thiết kế** – cân bằng an toàn, chi phí, khả năng phục hồi và khả năng vận hành.

Capstone kiểm tra đồng thời cả bốn tầng, đặc biệt không chấp nhận “apply được” nhưng bỏ qua state, secret, kiểm thử hoặc runbook.
