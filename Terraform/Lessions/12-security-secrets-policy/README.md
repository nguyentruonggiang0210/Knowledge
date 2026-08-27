# Lesson 12 — Security, secrets, policy và supply chain

## Mục tiêu

- Threat-model Terraform runner, code, dependency, plan/state và cloud API.
- Quản lý secret theo vòng đời, không chỉ đánh dấu sensitive.
- Dùng policy-as-code để chặn cấu hình nguy hiểm.
- Bảo vệ provider/module supply chain và artifact CI.

## Threat model

~~~mermaid
flowchart LR
  DEV[Developer/PR] --> SRC[Git source]
  SRC --> CI[Runner + identity]
  REG[Provider/module registry] --> CI
  CI --> PLAN[Plan artifact]
  CI --> STATE[Remote state]
  CI --> OCI[OCI APIs]
  VAULT[OCI Vault/KMS] --> CI
  ATT[Attacker/misconfiguration] -. targets .-> CI
  ATT -. targets .-> PLAN
  ATT -. targets .-> STATE
  ATT -. targets .-> REG
~~~

Đối thủ không cần sửa HCL nếu lấy được runner identity, state hoặc saved plan.
Security phải bao phủ người, process, artifact và runtime.

## Secret lifecycle

1. Generate bằng hệ thống thích hợp; không hard-code/default/example.
2. Store trong OCI Vault hoặc secret manager, encrypt KMS.
3. Distribute bằng workload identity/short-lived access.
4. Consume runtime bằng reference nếu application hỗ trợ.
5. Rotate, revoke, audit và test dependency.
6. Destroy theo retention/legal policy.

sensitive=true che terminal/UI propagation nhưng không mã hóa và không chắc loại
khỏi state/plan. Ephemeral variables/output và write-only resource arguments có
thể tránh persistence trong các version mới, nhưng chỉ dùng khi Terraform/provider
schema hỗ trợ. Kiểm terraform providers schema -json và pin minimum version.

Đọc plaintext bằng data source Vault rồi gắn vào resource có thể đưa nó vào state.
Pattern tốt hơn thường là Terraform truyền secret OCID/reference; workload dùng
Instance/Resource/OKE Workload Identity để đọc khi chạy.

## State và plan security

- Native remote backend, encryption/KMS, versioning, lock và private access.
- IAM state tách theo environment; CI app state không đọc IAM/network state rộng.
- Artifact plan retention ngắn, encryption, access log; không post full plan chứa
  secret vào comment công khai.
- terraform_remote_state consumer thường cần quyền đọc cả snapshot; ưu tiên publish
  contract nhỏ qua service/config registry khi trust boundary khác.
- Scan repository/history và rotate ngay nếu secret từng commit; xóa file hiện tại
  không vô hiệu secret đã lộ.

## OCI defense in depth

- IAM least privilege, dynamic/workload principal, MFA/federation.
- Private subnet/endpoints, NSG role-to-role, Bastion, WAF/Network Firewall khi cần.
- Vault/KMS/Certificates, rotation và deletion protection.
- Security Zones ngăn policy violation; Cloud Guard detect/respond.
- Vulnerability Scanning/OS Management/image pipeline.
- Audit, Logging, Monitoring, Events/Notifications và tested runbook.
- Zero Trust Packet Routing/security attributes nếu tổ chức áp dụng và đã thiết kế.

## Policy-as-code

Validation trong module bảo vệ caller thiện chí. Policy cấp tổ chức kiểm plan/config
độc lập với module:

- bắt buộc tags owner/environment/data_classification;
- chặn public database/storage;
- chỉ cho ingress 0.0.0.0/0 trên approved edge port;
- chặn unencrypted resource hoặc key không approved;
- chặn destroy/replace critical resource;
- giới hạn region/shape/cost;
- yêu cầu provider/module source/version được approve.

Policy cần test, version, owner, exception có TTL và audit. Scanner heuristic không
thay security review; false positive được xử lý bằng documented exception, không
tắt gate toàn cục.

Lab có [Rego policy](lab/policies/terraform.rego) minh họa đọc JSON plan:

~~~powershell
terraform plan -out=tfplan
terraform show -json tfplan | Out-File -Encoding utf8 plan.json
conftest test plan.json --policy policies
~~~

PowerShell có thể thêm BOM tùy phiên bản; nếu parser lỗi hãy dùng Terraform/CLI
pipeline ghi UTF-8 no-BOM. Plan file/JSON là sensitive artifact, xóa an toàn sau
test và không commit.

## Supply chain

- Pin Terraform/provider/module compatibility; commit provider lock checksums.
- Provider được ký/checksum; dùng private mirror/allowlist cho môi trường kiểm soát.
- Remote Git module pin immutable commit/tag, không branch.
- Dependency update là PR riêng có changelog, tests, plan và rollback.
- Hạn chế runner network egress, isolate job, ephemeral runner, minimal token.
- Protect branch/tag, verify artifact provenance; apply đúng reviewed saved plan.
- Theo dõi advisory/CVE và inventory version; không auto-upgrade lúc deploy.

## Lab offline guardrail

~~~powershell
cd Lessions/12-security-secrets-policy/lab
terraform init
terraform validate
terraform plan -var-file="secure.tfvars"
~~~

Đổi workload role=data thành public=true hoặc thêm 0.0.0.0/0; validation/precondition
phải chặn. So sánh với policy tổ chức áp dụng lên OCI plan thật.

## Hoạt động

1. Lập data-flow secret từ generate → Vault → workload → rotation.
2. Giả lập state bị đọc trái phép; xác định blast radius và incident steps.
3. Viết policy chặn bucket public và thiếu owner tag; thêm unit tests allow/deny.
4. Review một plan JSON có unknown value; policy fail-open hay fail-closed?
5. Tạo exception ingress có owner/reason/expires_at, viết cleanup/audit.
6. Threat-model provider/module registry compromise và runner token exfiltration.

## Lỗi thường gặp

- Tin sensitive là encryption.
- Output secret để pipeline dễ lấy.
- CI dùng tenancy admin API key dài hạn.
- Policy chỉ scan HCL nhưng bỏ computed plan.
- Chạy apply bằng plan artifact không còn đúng provenance/review.
- Bỏ lock file hoặc dùng module branch main.

## Tiêu chí hoàn thành

- Không secret/key/state/plan trong Git; có scan và rotation runbook.
- Policy tests chặn fixtures nguy hiểm nhưng cho phép case hợp lệ.
- Runner identity/state/backend/artifact/supply chain đều có control và audit.

