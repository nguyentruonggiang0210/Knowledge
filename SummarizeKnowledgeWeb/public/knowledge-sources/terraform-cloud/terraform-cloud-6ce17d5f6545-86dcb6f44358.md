# Lesson 13 — Testing, quality gates và documentation

## Mục tiêu

- Xây test pyramid cho configuration/module Terraform.
- Dùng terraform test, mock provider và negative tests.
- Tích hợp fmt/validate/lint/security/policy/cost/doc gates.
- Thiết kế live integration test có isolation và cleanup đáng tin cậy.

## Test pyramid

~~~mermaid
flowchart TD
  E[E2E/live smoke + DR: ít, chậm, đắt] --> I[Integration apply/destroy sandbox]
  I --> M[Module contract / terraform test / mock]
  M --> S[fmt, validate, lint, security, policy: nhiều, nhanh]
~~~

Mỗi layer bắt loại lỗi khác. fmt không chứng minh syntax/schema; validate không gọi
đủ API/IAM/quota; mock không mô phỏng eventual consistency; apply success không
chứng minh service healthy.

## Quality gates

| Gate | Bắt được | Không bắt chắc |
|---|---|---|
| terraform fmt -check | Style chuẩn | Logic |
| terraform validate | Syntax, internal references, provider schema sau init | IAM/quota/runtime |
| TFLint | Rule Terraform/provider tùy plugin | Mọi security issue |
| Trivy/Checkov/tfsec | Known misconfiguration heuristics | Business context |
| terraform test | Module behavior/assertions | Cloud API nếu mock |
| OPA/Conftest/Sentinel | Organization policy trên config/plan | Runtime health |
| Infracost/estimate | Cost diff được hỗ trợ | Hóa đơn chính xác tuyệt đối |
| terraform-docs | Contract docs đồng bộ | Design đúng |

Pin tool/rule versions. Baseline/ignore phải có reason, owner, expiry. Không đổi
scanner thành “warning” chỉ vì pipeline đỏ.

## Native terraform test

File .tftest.hcl chứa run block với command plan/apply, variables, provider mapping,
assert và expect_failures. Test plan nhanh và không tạo resource; apply test kiểm
computed behavior nhưng có side effect nếu provider thật.

~~~hcl
run "private_prod_is_valid" {
  command = plan
  variables {
    environment = "prod"
    public       = false
  }
  assert {
    condition     = output.exposure == "private"
    error_message = "Production phải private."
  }
}
~~~

### Mock provider

Terraform 1.7+ hỗ trợ mock_provider. Mock dùng schema thật, tạo computed placeholder
hoặc override data/resource/module. Nó không kiểm tra IAM, quota, API validation,
work request hay network reachability. Dùng mock cho branching/contract; vẫn cần
một ít live integration tests.

## Test taxonomy

- **Unit/contract**: variables, locals, output shape, naming, counts/keys.
- **Negative**: invalid CIDR, public DB, missing tags, destructive input.
- **Golden plan**: tránh snapshot toàn text dễ vỡ; assert semantic JSON fields.
- **Integration**: apply module vào compartment tạm, query OCI, plan idempotent.
- **E2E**: DNS/LB/app/data request, monitoring/alarm, failover.
- **Compatibility**: matrix Terraform/provider/module supported versions.
- **Upgrade**: state tạo bằng version cũ rồi plan version mới.
- **Fault injection**: API denial/quota/backend unhealthy/drift/lock.

## Live test lifecycle

1. Tạo compartment/prefix unique, tags test_run_id/expires_at.
2. Identity least privilege và budget/quota.
3. Apply, smoke assertions, plan lần hai không đổi.
4. Destroy trong finally/always.
5. Nếu cleanup fail: alert, retry giới hạn, list orphan theo tags và human runbook.
6. TTL janitor là safety net, không phải cleanup chính.

Không dùng production state/credential/data cho integration test.

## Lab offline

~~~powershell
cd Lessions/13-testing-quality/lab
terraform init
terraform fmt -check
terraform validate
terraform test -verbose
~~~

Test có một case hợp lệ và một negative case dùng expect_failures.

## Hoạt động

1. Cài một defect đổi prod thành public; chứng minh test fail trước khi sửa.
2. Thêm assertion stable key khi reorder input.
3. Viết mock OCI VCN test và override computed id hợp lệ.
4. Parse terraform show -json, assert không có delete/replace critical address.
5. Thiết kế live test cleanup khi apply fail giữa chừng.
6. Tạo compatibility matrix và policy deprecate version.

## Lỗi thường gặp

- Chỉ chạy validate rồi gọi là tested.
- Mock mọi thứ và không có live smoke.
- Integration test dùng shared long-lived stack, test ảnh hưởng nhau.
- Snapshot full plan text bị nhiễu provider/version.
- Cleanup chỉ chạy khi test success.
- Test check implementation detail thay contract/outcome.

## Tiêu chí hoàn thành

- terraform test bắt positive và negative behavior.
- Pipeline có static/policy/security gates với pinned version.
- Live test design cô lập, cost-bounded, idempotent và cleanup được.

## Nguồn chính thức

- Terraform tests: https://developer.hashicorp.com/terraform/language/tests
- Mock providers: https://developer.hashicorp.com/terraform/language/tests/mocking
- Style/testing guide: https://developer.hashicorp.com/terraform/language/style

