# Terraform + OCI mastery checklist

Chấm từng dòng: 0 chưa biết, 1 làm theo hướng dẫn, 2 tự làm, 3 giải thích/review/
troubleshoot được. “Master” mục tiêu là 3 ở Terraform production core, 2–3 ở OCI
services và tối thiểu 2 ở AWS/Azure mapping.

## IaC và workflow

- [ ] Declarative vs imperative; desired/state/remote mental model.
- [ ] Idempotency, convergence, graph parallelism và partial failure.
- [ ] init/fmt/validate/test/plan/show/apply/destroy.
- [ ] Saved plan, detailed exit code, JSON plan và automation flags.
- [ ] Terraform khác Ansible/Packer/application deploy/monitoring ở đâu.

## HCL và type system

- [ ] Blocks/arguments/references/module file loading.
- [ ] string/number/bool/list/set/map/tuple/object/any.
- [ ] null/empty/unknown/sensitive/ephemeral/write-only.
- [ ] optional attribute, validation, local, output và input precedence.
- [ ] for/filter/group, splat, conditional và function groups.
- [ ] flatten/setproduct/merge/zipmap/try/can/type conversion.
- [ ] Template/file/json/yaml/IP network functions và console.

## Resources và graph

- [ ] Required/optional/computed/replacement provider schema.
- [ ] Resource/data source/address/provider ID.
- [ ] count vs for_each, stable key và reorder behavior.
- [ ] Implicit/explicit dependency và unknown propagation.
- [ ] dynamic nested blocks.
- [ ] lifecycle: create-before-destroy/prevent/ignore/replace-triggered.
- [ ] variable/resource/output conditions và check blocks.
- [ ] Provisioner limitations, cloud-init/immutable alternatives.

## State/backend/brownfield

- [ ] State binding, lineage/serial/snapshot security.
- [ ] Native OCI backend, lock, Object Storage versioning/KMS/IAM.
- [ ] Backend partial config, migrate/reconfigure và recovery.
- [ ] CLI workspace vs environment/security boundary.
- [ ] state list/show/mv/rm/pull/push và force-unlock safety.
- [ ] import block/config generation/OCI discovery và clean plan.
- [ ] moved/removed, count→for_each, resource→module, provider migration.
- [ ] refresh-only, drift classification và handoff ownership.
- [ ] Remote-state exposure và output contract alternatives.

## Module engineering

- [ ] Root/child responsibilities, composition và standard structure.
- [ ] Typed contract, safe defaults, validation và focused outputs.
- [ ] required_providers vs provider configuration/inheritance/aliases.
- [ ] Registry/Git/local/private sources và immutable pin.
- [ ] SemVer/changelog/deprecation/upgrade guide.
- [ ] Lock file chỉ khóa providers; module dependency strategy.
- [ ] Unit/mock/integration/compatibility/upgrade tests.
- [ ] Tránh mega-module, wrapper 1:1 và hidden dependency.

## OCI foundation

- [ ] Tenancy/home/subscribed region/compartment/identity domain/OCID.
- [ ] AD/FD data lookup, failure domains và capacity/quota.
- [ ] Human groups, policies verbs/families/conditions.
- [ ] Dynamic groups và API Key/Security Token/Instance Principal/
      Resource Principal/OKE Workload Identity.
- [ ] Defined/default/free-form tags, naming, budgets, quotas, limits.
- [ ] Security Zones, Cloud Guard, Audit và separation of duties.
- [ ] Provider alias multi-region/home-region.

## OCI network

- [ ] IPAM/CIDR/subnet planning và overlap.
- [ ] VCN/public-private regional subnet/VNIC/public IP.
- [ ] Route table/IGW/NAT/Service Gateway/DRG.
- [ ] NSG vs Security List/default VCN resources.
- [ ] Stateful/stateless/ICMP/return path/OS firewall.
- [ ] LB→app→data role rule matrix.
- [ ] DNS labels/resolver/private-public zones/views/hybrid/TTL.
- [ ] LPG/remote peering/VPN/FastConnect concepts.
- [ ] IPv6 route/security/DNS/observability.

## OCI compute/data/platform

- [ ] Image discovery/promotion, flex shape/OCPU/memory/license/capacity.
- [ ] Private compute/VNIC/NSG/Bastion and cloud-init.
- [ ] AD/FD distribution, instance configuration/pool/autoscaling.
- [ ] Boot/block/object/file/local storage, performance và encryption.
- [ ] Backup policy + restore evidence, not just snapshot status.
- [ ] Flexible LB vs NLB, health/TLS/drain/log/metrics.
- [ ] Autonomous/Base/MySQL/NoSQL choice, private access và data lifecycle.
- [ ] OCI Vault/KMS/Certificates và runtime secret reference.
- [ ] OKE/OCIR/Functions/API Gateway concepts và module/provider options.
- [ ] Monitoring/Alarms/Notifications/Logging/Audit/Events/Work Requests.

## Security và supply chain

- [ ] Threat model developer/Git/registry/runner/identity/plan/state/API.
- [ ] Secret generate/store/distribute/consume/rotate/revoke/audit.
- [ ] sensitive limitation; state/plan/backend/artifact protection.
- [ ] Least-privilege short-lived workload identity.
- [ ] Policy-as-code allow/deny, unknown handling, exception TTL/tests.
- [ ] Static security scan limitations và documented suppression.
- [ ] Provider signature/checksum/lock/mirror/allowlist.
- [ ] Git module immutable ref, protected tag/branch và provenance.
- [ ] Runner isolation/network egress/token/artifact retention.

## Testing và CI/CD

- [ ] Static → contract/mock → integration → E2E test pyramid.
- [ ] terraform test plan/apply/assert/expect_failures/mock/override.
- [ ] Negative, plan JSON, idempotency, compatibility và fault tests.
- [ ] Sandbox isolation, TTL, finally cleanup và orphan janitor.
- [ ] Untrusted PR no credential; trusted speculative plan.
- [ ] Protected fresh saved plan, exact artifact approval/apply.
- [ ] Concurrency group + state lock; CODEOWNERS/audit.
- [ ] Dev/staging/prod promotion của immutable version, plan riêng.
- [ ] OCI Resource Manager vs self-managed/HCP execution trade-off.

## Operations/SRE/FinOps/DR

- [ ] Layered debug config/graph/state/provider/API/runtime.
- [ ] TF_LOG redaction, provider schema, OCI request/work request.
- [ ] 401/403/404/409/429/5xx, quota/capacity/eventual consistency.
- [ ] Partial apply/orphan/stale lock/replacement runbooks.
- [ ] Scheduled drift code 0/1/2 và revert/accept/handoff.
- [ ] Terraform/provider/module upgrade from old state and rollout.
- [ ] Tag coverage, estimate/billing, budget, anomaly, rightsizing, egress.
- [ ] State/code/module recovery khác application data backup.
- [ ] RPO/RTO, multi-AD/region, DNS/key/quota/capacity/failback.
- [ ] Game day evidence và postmortem corrective actions.

## Multi-cloud và DevOps lân cận

- [ ] OCI↔AWS↔Azure service/identity/network/state mapping trong Refer.
- [ ] Biết abstraction chung và semantics không thể “dịch tên”.
- [ ] Linux/process/filesystem/systemd và shell PowerShell/Bash.
- [ ] Git branching/review/release/signing.
- [ ] TCP/IP/routing/DNS/TLS/HTTP/load balancing.
- [ ] Containers/Kubernetes/image supply chain.
- [ ] CI/CD/application delivery strategies.
- [ ] Observability/SLI/SLO/on-call/incident/postmortem.
- [ ] IAM/threat modeling/vulnerability/compliance.
- [ ] Database consistency/backup/restore/migration.
- [ ] FinOps/capacity/vendor/service limits.

## Graduation evidence

- [ ] Quiz mỗi level đạt ít nhất 80%, giải thích được vì sao đáp án sai.
- [ ] Capstone rubric đạt safety gate và ít nhất 80/100.
- [ ] Live dev apply → smoke → no-change plan → destroy/retention đúng.
- [ ] Import + moved refactor đạt 0 create/0 destroy.
- [ ] Drift, partial failure, lock và state recovery drills có log.
- [ ] DR game day đo RPO/RTO; cost estimate đối chiếu billing.
- [ ] Portfolio demo và peer review ngẫu nhiên resource address.

