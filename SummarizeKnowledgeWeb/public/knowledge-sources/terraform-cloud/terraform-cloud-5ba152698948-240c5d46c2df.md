# Lesson 17 — Capstone OCI production

## Mục tiêu cuối

Thiết kế, triển khai, review và vận hành một nền tảng OCI cho ứng dụng web nhiều
tier. Bài không chỉ chấm “apply thành công”; bạn phải chứng minh security, test,
state, CI/CD, cost, drift, incident và DR.

## Business scenario

Công ty có dịch vụ payments-api:

- dev và prod tách quyền/state;
- public HTTP(S) qua flexible Load Balancer;
- app instances không public IP, tối thiểu hai failure domains ở prod;
- data service private (có thể mock/thiết kế thay vì tạo DB đắt);
- outbound private app qua NAT/Service Gateway theo dependency;
- OCI Vault/KMS reference, monitoring/alarm/logging;
- RPO 15 phút, RTO 60 phút cho tier được chọn;
- mọi resource có owner/environment/managed_by/cost_center;
- PR plan, policy/security/cost gates, protected apply;
- native OCI remote state có lock/versioning.

## Target architecture

~~~mermaid
flowchart TD
  U[Users] --> DNS[OCI DNS]
  DNS --> LB[Public Flexible LB + LB NSG]
  LB --> A1[Private app A + App NSG]
  LB --> A2[Private app B + App NSG]
  A1 --> D[(Private data service + Data NSG)]
  A2 --> D
  A1 --> NAT[NAT Gateway]
  A2 --> SGW[Service Gateway]
  V[OCI Vault/KMS] -. runtime identity .-> A1
  V -. runtime identity .-> A2
  M[Monitoring/Logging/Audit] -. signals .-> LB
  M -. signals .-> A1
  ST[Versioned OCI state backend] -. lock/state .-> CI[Protected CI runner]
  CI -. provider API .-> LB
~~~

Solution mẫu dựng core VCN/NSG/subnets, private compute và optional LB. Database,
Service Gateway, Vault, monitoring, IAM/budget và DR là acceptance extensions để
bạn tự hoàn thiện; không bật dịch vụ đắt trong reference solution.

## Deliverables

~~~text
capstone/
├── docs/
│   ├── architecture.md
│   ├── adr/
│   ├── threat-model.md
│   ├── cost-estimate.md
│   └── runbooks/{apply,rollback,drift,incident,state-recovery,dr}.md
├── modules/{network,compute,load_balancer,observability}/
├── environments/{dev,prod}/
├── tests/
├── policies/
└── ci/
~~~

Mỗi environment/layer phải có backend key và identity riêng. Backend bucket/KMS/
IAM là bootstrap stack riêng; không cố tạo bucket chứa state bằng chính state đó.

## Giai đoạn thực hiện

### 1. Discovery và design

- Vẽ data/request/control-plane flow và trust boundaries.
- Chốt CIDR/IPAM không overlap, compartment/state topology, owner.
- Chọn AD/FD, image/shape, LB/data service, RPO/RTO.
- Threat model credential/state/plan/network/data/supply chain.
- Estimate cost/quota/capacity; đặt budget và cleanup.
- ADR cho mọi trade-off quan trọng.

### 2. Bootstrap

- Compartment, identity/dynamic group, least-privilege policies.
- Object Storage backend: versioning, native lock, KMS/private access/audit.
- CI protected environment và workload/instance principal.
- Module/provider version policy.

Bootstrap có state riêng và quyền rất hạn chế; production app pipeline không được
manage IAM/backend KMS.

### 3. Modules và environments

- Typed inputs/outputs, validation/precondition, no provider config trong child.
- Stable for_each keys, tags, private defaults.
- Dev/prod root/state/profile/approval tách.
- No hard-coded AD/image/OCID/secret.
- Plan lần hai không đổi.

### 4. Quality/security

- fmt/validate/TFLint, terraform test + mock, integration sandbox.
- Security scanner, OPA plan policy, cost diff.
- Negative fixtures: public DB, port 22 world, missing owner, unencrypted resource.
- Live smoke: LB → app health; cleanup always.

### 5. CI/CD

- Untrusted PR không credential.
- Trusted PR speculative plan; protected merge tạo fresh saved plan.
- Human approval exact artifact; concurrency theo state.
- Apply, smoke, no-change plan, audit.
- Dependency update pipeline riêng.

### 6. Operations drills

1. Manual drift một NSG tag/rule → detect → triage → reconcile.
2. Import một brownfield object → clean plan.
3. Move resource vào module/count→for_each → 0 create/destroy.
4. Permission denial gây partial apply → roll-forward.
5. Stale lock tabletop → xác minh trước force-unlock.
6. Restore state version sandbox → tìm binding/object mismatch.
7. Region failure tabletop/live safe subset → đo RTO/RPO/failback.

## Safety gate

Không apply nếu bất kỳ điều nào chưa đạt:

- Sai tenancy/profile/region/compartment/backend/workspace chưa xác minh.
- Plan có delete/replace chưa giải thích và approve.
- Credential/state/plan/secret có nguy cơ commit/public artifact.
- Chưa estimate chi phí/quota hoặc chưa có cleanup.
- Production không remote lock/versioning/audit.
- Không có backup/restore evidence cho data critical.

## Acceptance criteria

- terraform fmt -check -recursive, validate và test pass.
- Policy/security/cost gates pass hoặc exception có owner/reason/expiry.
- Root/module interfaces documented; lock/version constraints committed.
- Apply dev thành công, smoke pass, full plan lần hai no changes.
- Prod plan được review; live apply prod không bắt buộc để hoàn thành course.
- Network path/rule matrix least privilege, app node không public IP.
- State/plan/runner identity protected và audit được.
- Import/refactor/drift/partial failure/state recovery drills có evidence.
- RPO/RTO/cost có số liệu và gap backlog.
- Làm [practical capstone quiz](../../Quiz/practical/capstone-oci.md) đạt rubric.

## Starter và solution

- [starter](starter): scaffold an toàn, TODO và test guardrail.
- [solution](solution): reference core; flags compute/LB/NAT mặc định false.

Solution không phải landing zone dùng nguyên xi. Bạn phải thay CIDR, policies,
image/shape, backend, service limits, TLS, monitoring, data và compliance theo tổ
chức. Production mastery là khả năng giải thích/kiểm chứng trade-off, không phải
copy một template lớn.

## Portfolio review

Trong buổi demo 30 phút:

1. 5 phút business/SLO/architecture.
2. 5 phút module/state/security decisions.
3. 5 phút PR plan/policy/test pipeline.
4. 10 phút drift/incident/DR drill.
5. 5 phút cost, limitations và next improvements.

Người review chọn ngẫu nhiên một address, input, policy hoặc route; bạn phải trace
từ config → graph → state → OCI API → runtime signal.

