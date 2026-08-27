# Capstone starter

Scaffold này chỉ tạo terraform_data guardrail, không tạo OCI resource. Hãy hoàn
thiện theo thứ tự:

1. Viết architecture/ADR/threat model/cost estimate.
2. Thêm module network với public LB + private app/data.
3. Thêm optional private compute hoặc instance pool.
4. Thêm optional LB/health; TLS qua Certificates/Vault.
5. Chọn data service ở plan/mock hoặc live sandbox.
6. Thêm tests/policies/CI/runbooks.
7. Cấu hình native OCI backend bằng file backend.tf.example tự tạo.

Chạy:

~~~powershell
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform test
terraform plan
~~~

Không bật live resources trước khi safety checklist ở Lesson 17 pass.

