# Lesson 00 — Roadmap, setup và cách học

## Mục tiêu

Sau chặng này bạn có môi trường an toàn, hiểu thứ tự học, biết tiêu chí để chuyển
bài và có kế hoạch 16–24 tuần phù hợp với người đang đi làm.

## Lộ trình năng lực

~~~mermaid
flowchart TD
  F[Foundation: IaC, HCL, CLI] --> C[Core: graph, state, modules]
  C --> O[OCI: IAM, network, compute, data]
  O --> P[Production: security, test, CI/CD]
  P --> E[Expert: refactor, drift, cost, DR]
  E --> X[Capstone + portfolio + vận hành thật]
  L[Linux + Git + Networking] -. học song song .-> C
  K[Containers/Kubernetes] -. tích hợp .-> P
  S[Security + Observability + Incident] -. tích hợp .-> E
~~~

### Kế hoạch 20 tuần mẫu

| Tuần | Lesson | Sản phẩm chứng minh |
|---:|---|---|
| 1–2 | 01–03 | Repo Git, lab local, giải thích plan |
| 3–4 | 04–05 | Configuration có type/validation/for_each |
| 5–6 | 06–07 | Import/refactor an toàn và module versioned |
| 7–9 | 08–10 | OCI compartment, VCN, compute/storage |
| 10–11 | 11–12 | Service/data layer và threat model |
| 12–14 | 13–14 | Test suite và pipeline plan/apply |
| 15–17 | 15–16 | Refactor, drift/cost/DR runbooks |
| 18–20 | 17 | Capstone, demo, postmortem giả lập |

Nếu mới cả Linux/Git/network, dùng 24–30 tuần. Nếu đã làm cloud, vẫn phải làm
Lesson 06 và 12–16; đây là vùng nhiều sự cố production nhất.

## Chuẩn bị công cụ

1. Terraform CLI 1.7+; kiểm tra bằng terraform version.
2. Git; kiểm tra bằng git version.
3. OCI CLI (khuyến nghị) và một OCI tenancy dành cho lab.
4. Editor có Terraform language server.
5. Tùy chọn: TFLint, Trivy hoặc Checkov, Infracost, OPA/Conftest, Graphviz.

Windows có thể cài Terraform bằng WinGet/Chocolatey hoặc tải binary chính thức.
Linux/macOS dùng package repository chính thức của HashiCorp. Luôn xác minh
checksum/signature từ nhà phát hành.

## OCI lab guardrails

Tạo trước bằng Console hoặc tài khoản quản trị:

- một compartment riêng, ví dụ tf-learning;
- một user/group hoặc dynamic group chỉ có policy cần thiết;
- budget và alert nhỏ;
- quota/limits nếu tổ chức hỗ trợ;
- API key riêng cho lab, không dùng key cá nhân production;
- tag namespace hoặc free-form tags: owner, environment, managed_by, expires_at.

### Authentication local

OCI provider mặc định hỗ trợ API key qua file cấu hình OCI. Không đưa các giá trị
tenancy OCID, user OCID, fingerprint hay private key vào Git. Với PowerShell:

~~~powershell
$env:OCI_CLI_PROFILE = "TF-LEARNING"
$env:TF_VAR_compartment_id = "ocid1.compartment..."
$env:TF_VAR_region = "ap-singapore-1"
~~~

Với Bash:

~~~bash
export OCI_CLI_PROFILE="TF-LEARNING"
export TF_VAR_compartment_id="ocid1.compartment..."
export TF_VAR_region="ap-singapore-1"
~~~

Trong OCI compute/Resource Manager/OKE, ưu tiên principal ngắn hạn phù hợp thay
vì mang API private key vào workload. Chọn đúng cơ chế theo nơi Terraform chạy.

## Checklist trước mọi apply

- [ ] Đang ở đúng folder/root module và đúng workspace/backend?
- [ ] Identity/profile/region/compartment có đúng không?
- [ ] State có remote locking, backup và quyền tối thiểu chưa?
- [ ] terraform fmt -check và terraform validate đã pass?
- [ ] Plan được lưu, đọc đầy đủ create/update/replace/destroy và unknown?
- [ ] Có resource đắt, public endpoint, secret hoặc dữ liệu thật không?
- [ ] Có rollback/roll-forward và cửa sổ thay đổi không?
- [ ] Sau lab có thể destroy đúng state không?

## Ma trận tự đánh giá

Chấm 0 = chưa biết, 1 = làm theo hướng dẫn, 2 = tự làm, 3 = giải thích/review được.

| Năng lực | Mục tiêu cuối |
|---|---:|
| HCL/type/expression/graph | 3 |
| State/backend/import/refactor | 3 |
| Module/API/versioning/test | 3 |
| OCI IAM/network/compute/data | 2–3 |
| Security/policy/secrets | 3 |
| CI/CD/team workflow | 3 |
| Troubleshooting/drift/cost/DR | 3 |
| AWS/Azure concept mapping | 2 |

## Tiêu chí hoàn thành Lesson 00

- Môi trường CLI đã được cài hoặc bạn biết chính xác bước cài còn thiếu.
- Có compartment/account lab và guardrails, hoặc chỉ cam kết chạy offline plan/test.
- Có lịch học, learning journal và baseline tự đánh giá.
- Giải thích được vì sao không commit state, saved plan và credential.

## Nguồn chính thức

- Terraform install: https://developer.hashicorp.com/terraform/install
- Terraform CLI workflow: https://developer.hashicorp.com/terraform/cli/run
- OCI Terraform provider: https://docs.oracle.com/en-us/iaas/Content/dev/terraform/home.htm
- OCI provider authentication: https://docs.oracle.com/en-us/iaas/Content/dev/terraform/configuring.htm
- OCI provider best practices: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/terraformbestpractices.htm

