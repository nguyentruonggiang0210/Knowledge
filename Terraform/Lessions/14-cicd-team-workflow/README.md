# Lesson 14 — CI/CD, team workflow và OCI Resource Manager

## Mục tiêu

- Thiết kế PR plan và protected apply có audit.
- Apply đúng artifact đã review, xử lý drift/concurrency/secret.
- Tách repository/state/identity theo blast radius.
- Chọn self-managed runner, HCP Terraform hoặc OCI Resource Manager.

## Pipeline production

~~~mermaid
flowchart LR
  PR[Pull request] --> F[fmt/validate/lint/test]
  F --> S[security/policy/cost]
  S --> SP[Speculative plan]
  SP --> R[Human + CODEOWNERS review]
  R --> M[Protected merge]
  M --> FP[Fresh saved plan]
  FP --> A[Environment approval]
  A --> AP[Apply exact plan]
  AP --> SM[Smoke + no-change plan]
  SM --> AU[Audit/artifact metadata]
~~~

PR plan là speculative và có thể stale. Sau merge tạo fresh plan trên protected
runner, review/approve chính artifact đó rồi apply. Không chạy terraform apply
không có saved plan sau khi người duyệt đã xem một plan khác.

Saved plan chứa state snapshot, backend config và có thể secret; mã hóa, access
control, checksum/provenance, retention ngắn. Plan chỉ apply bằng compatible code,
lock/provider/plugin và environment. Không promote cùng một plan từ dev sang prod;
promote immutable module/application version, rồi plan riêng cho mỗi environment.

## Status và exit codes

terraform plan -detailed-exitcode:

- 0: success, no diff;
- 1: error;
- 2: success, has diff.

Pipeline phải giữ code 2 là “changes to review”, không phải failure. Không parse
text để đo destructive change; dùng terraform show -json và policy.

## Concurrency

Backend lock bảo vệ state writer; pipeline concurrency group bảo vệ cả chuỗi plan
→ approve → apply. Nếu plan và apply cách nhau, một run khác có thể đổi state. Sau
approval cần verify artifact/state freshness hoặc serialize environment.

Không force-unlock job chỉ vì timeout UI. Xác minh process/API job và lock owner.

## Identity

- Runner riêng theo environment/layer, least privilege.
- Ưu tiên workload/federated/Instance Principal, token ngắn hạn.
- Prod apply chỉ từ protected branch/environment với approval.
- Fork/untrusted PR không nhận credential; chạy static/mock only.
- Plan output/comment được redact và giới hạn người xem.

## Repository và state boundaries

~~~text
live/
├── dev/
│   ├── network/
│   ├── platform/
│   └── app/
└── prod/
    ├── network/
    ├── platform/
    └── app/
modules/
policies/
tests/
docs/runbooks/
~~~

Tách state theo lifecycle/owner/blast radius, không một resource mỗi state và không
mega-state toàn tenancy. Dev/prod có backend key/bucket, identity và approval khác.
Tránh dependency vòng. terraform_remote_state lộ quyền đọc cả state; publish output
contract nhỏ qua OCI parameter/config/object nếu trust boundary khác.

## Team workflow

1. Issue/ADR nêu intent, risk, affected state và rollback/roll-forward.
2. Branch nhỏ; dependency upgrade tách khỏi feature.
3. PR có plan summary create/update/replace/delete, cost/security/policy.
4. CODEOWNERS cho network/IAM/prod; two-person review cho critical.
5. Apply trong change window nếu cần, owner theo dõi.
6. Smoke/no-change plan, audit link và postmortem nếu fail.

Không sửa cloud console song song trừ break-glass. Emergency change phải có ticket,
expiry và PR reconcile ngay sau incident.

## OCI Resource Manager (ORM)

ORM quản lý stack, state và serialize job; source có thể từ configuration package/
SCM tùy setup, hỗ trợ plan/apply/destroy/import và managed execution. Cân nhắc:

| ORM | Self-managed CI runner |
|---|---|
| State/job managed trong OCI | Linh hoạt toolchain/policy/test |
| OCI principal/integration thuận lợi | Dễ dùng multi-cloud provider/tool |
| Version/provider/job constraints theo service | Bạn chịu runner/state/security/upgrade |
| Stack boundary/audit OCI-native | Tích hợp CI hiện hữu sâu hơn |

Không giả định CLI version/provider mới nhất đã có trong ORM; pin version được hỗ
trợ, test stack. Private endpoint/network access và principal policy phải thiết kế.

## Examples

- [pipeline.ps1](examples/pipeline.ps1): workflow command có xử lý exit code.
- [pipeline-pseudocode.yml](examples/pipeline-pseudocode.yml): stage/gate trung lập.

Script minh họa, chưa tự cấp credential/backend hay upload artifact. Chạy trong
root module sandbox trước.

## Hoạt động

1. Xử lý exit code 0/1/2 và chỉ upload plan khi code 2.
2. Viết policy chặn replace/delete critical address.
3. Mô phỏng hai pipeline cùng environment; chứng minh concurrency + lock.
4. Threat-model untrusted fork và plan comment secret.
5. So sánh ORM/self-managed theo compliance, multi-cloud, tools và ops.
6. Thiết kế emergency console change → drift ticket → import/config → clean plan.

## Lỗi thường gặp

- PR plan cũ được coi là approval cho apply mới.
- apply -auto-approve không saved plan trên protected job.
- Long-lived admin key ở repository/organization secret dùng mọi env.
- Cùng state cho dev/prod hoặc cùng concurrency key cho mọi stack.
- Plan artifact công khai/retention vô hạn.
- Pipeline bỏ cleanup/smoke/no-change sau apply.

## Tiêu chí hoàn thành

- Trace ai đổi code, plan hash nào, ai duyệt, identity nào apply và kết quả.
- Hai apply cùng state không chạy đồng thời.
- Untrusted PR không có cloud credential; prod có protected approval.

## Nguồn chính thức

- Automation workflow: https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform
- OCI Resource Manager: https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Concepts/resourcemanager.htm

