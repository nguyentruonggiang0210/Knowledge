# D06 - Cloud fundamentals và architecture

## Mục tiêu

- Hiểu shared responsibility và trade-off IaaS/PaaS/SaaS/serverless.
- Thiết kế identity, organization, network, logging, security và cost baseline.
- Mô hình hóa region/failure domain, quota, dependency và blast radius.
- Dùng OCI làm lab chính nhưng chuyển được mental model sang AWS/Azure.

## Cloud không chỉ là data center thuê

Cloud cung cấp API, elastic capacity, managed service và mô hình chi phí biến đổi. Giá trị
đến từ automation/managed capability/feedback nhanh, không chỉ “lift-and-shift” VM. Elastic
không đồng nghĩa vô hạn: quota, stock-out, rate limit và dependency vẫn tồn tại.

| Model | Bạn thường quản | Provider thường quản |
|---|---|---|
| IaaS VM | OS, patch, runtime, app, data, identity trong guest | Facility, hardware, hypervisor |
| Managed container/K8s | Workload, image, config, app RBAC, data | Một phần control plane/platform |
| PaaS database | Schema/query/access/data lifecycle | OS, database engine, backup capability theo contract |
| SaaS | User/config/data/governance/integration | Application stack và hạ tầng |

Ranh giới cụ thể khác theo service. “Managed” không xóa trách nhiệm cấu hình access, kiểm
restore, monitoring, data classification và business continuity.

## Failure domain và resilience

- Region: khu vực địa lý/API deployment scope.
- Availability domain/zone: failure domain độc lập tương đối trong region.
- Fault domain: nhóm hardware/rack nhỏ hơn, tùy cloud.
- Control plane có thể lỗi khác data plane.
- Một managed service multi-zone không tự làm application end-to-end multi-zone.

OCI có region, Availability Domain và Fault Domain; AWS thường dùng Region/AZ; Azure dùng
Region/Availability Zone. Không giả định tên giống nhau có SLA/failure semantics giống nhau;
đọc contract từng service trong [Refer](../../Refer/README.md).

## Landing zone

~~~mermaid
flowchart TB
  Org[Tenancy organization] --> Sec[Security and audit]
  Org --> Net[Shared network and DNS]
  Org --> Plat[Shared platform]
  Org --> Dev[Dev boundary]
  Org --> Stg[Staging boundary]
  Org --> Prod[Production boundary]
  IDP[Enterprise identity] --> Org
  Sec --> Logs[Immutable centralized logs]
  Net --> Dev
  Net --> Stg
  Net --> Prod
  Guard[Policy tag budget quota] -.-> Org
~~~

Landing zone là baseline tổ chức, identity, network, security, logging, cost và automation.
Nó không nên là một state/repository/quyền admin khổng lồ. Tách bootstrap, identity, network,
platform và workload theo lifecycle/blast radius.

### OCI baseline

- Compartments theo ownership/environment, không chỉ theo tên service.
- Identity domain/federation/MFA; group/policy và dynamic group/workload identity.
- VCN, private subnet, route, NSG, gateways, DNS và connectivity.
- Audit/Logging/Monitoring/Events tập trung với retention.
- Vault/KMS/secret/certificate lifecycle.
- Tag defaults/required tags, budget, quota/service limit.
- Terraform remote state riêng, versioning/locking/encryption và least privilege.

AWS/Azure mapping là điểm bắt đầu, không phải thiết kế copy-paste:

| Capability | OCI | AWS | Azure |
|---|---|---|---|
| Org scope | Tenancy/compartment | Organization/account | Entra tenant/subscription/resource group |
| Workload identity | Dynamic group/resource principal | IAM role/instance or pod identity | Managed identity/workload identity |
| Network | VCN | VPC | VNet |
| Audit | Audit | CloudTrail | Activity Log |
| Key/secret | Vault/KMS/Secrets | KMS/Secrets Manager | Key Vault |

## Identity first

- Human: federation/SSO, MFA, role, JIT và break-glass được audit.
- Workload: short-lived identity gắn runtime, không static key trong CI/image.
- Machine-to-machine: authenticate và authorize riêng, scope resource/action/time.
- Control plane và data plane permission có thể khác.
- Least privilege là vòng lặp: đề xuất → test allow/deny → quan sát → giảm quyền.

Tránh một “cloud-admin” service account cho mọi pipeline và environment.

## Network và data baseline

- Private-by-default; public endpoint phải có business need, WAF/rate limit/monitoring.
- Tách ingress, application và data tier; egress cũng cần policy/observability.
- DNS, IP plan và connectivity hybrid phải được quản như sản phẩm.
- Encryption in transit/at rest, key ownership/rotation và data residency theo classification.
- Backup/replication là capability; application vẫn phải restore/reconcile/test.

## Compute/storage/database decision

Hỏi theo thứ tự:

1. Workload stateful hay stateless, steady hay burst?
2. SLO latency/availability/durability và failure scope?
3. Data consistency, transaction, retention và recovery?
4. Team có thể trực/vá/nâng cấp gì?
5. Lock-in, portability, compliance, quota và total cost?

VM cho control và compatibility; container cho packaging/scheduling; serverless cho event/burst
và ít runtime management; managed DB giảm toil nhưng tăng constraint/lock-in. Không có lựa
chọn tốt tuyệt đối.

Serverless/event-driven cần xem cold start, concurrency/burst quota, execution timeout,
retry/DLQ, idempotency, event ordering, version/alias, network startup/egress và observability.
“Scale to zero” không làm downstream database scale vô hạn.

## Governance không phải cấm mọi thứ

Guardrail tốt:

- policy-as-code chặn public data/over-privilege nghiêm trọng;
- approved catalog/region/image nhưng có exception workflow;
- tags owner/product/environment/data-class/expiry;
- budget/anomaly/quota và cleanup;
- centralized evidence, không yêu cầu screenshot thủ công nếu API có thể chứng minh.

SLA của provider không bằng SLO của application. Đọc inclusions/exclusions và tính dependency
chain; service credit không khôi phục user trust.

## Lab: landing-zone ADR

Thiết kế cho “Order API” có dev/staging/prod trên OCI:

1. Vẽ compartment, identity, network, audit, key/secret, state và cost boundaries.
2. RACI cho platform, app, security, finance và incident.
3. Threat model ba trust boundary; failure model mất instance, AD, region, identity provider.
4. Chọn VM, OKE hoặc managed option; ghi ít nhất ba lựa chọn bị loại.
5. Xác định quota/capacity, SLO, RTO/RPO và unit cost.
6. Map sang AWS/Azure bằng capability; ghi ba khác biệt vận hành.
7. Dùng template ADR/production readiness; không apply cloud ở bước này.

## Hoàn thành D06 khi

- Giải thích shared responsibility theo một service cụ thể.
- Landing-zone design tách blast radius và human/workload identity.
- Có network/data/security/log/cost/recovery baseline.
- Không nhầm provider SLA với application SLO.
- Mapping OCI/AWS/Azure dựa trên semantics, không chỉ tên dịch vụ.

Nguồn: [OCI Cloud Adoption Framework](https://docs.oracle.com/en-us/iaas/Content/cloud-adoption-framework/home.htm),
[OCI Architecture Center](https://docs.oracle.com/solutions/) và
[NIST cloud definition](https://csrc.nist.gov/pubs/sp/800/145/final).

Tiếp theo: [D07 - IaC, configuration và image](../07-iac-configuration-images/README.md).
