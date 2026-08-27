# D18 - High Availability, backup, BCP và Disaster Recovery

## Mục tiêu

- Phân biệt HA, backup, DR và business continuity.
- Đặt RTO/RPO từ Business Impact Analysis và dependency.
- Thiết kế/kiểm restore, failover, data integrity và failback.
- Không nhầm replication với backup hoặc Terraform state với application data.

## Khái niệm

- HA: tiếp tục hoặc phục hồi nhanh trong failure scope thiết kế, thường tự động/local.
- Backup: bản sao để khôi phục data/config theo point/version.
- DR: capability khôi phục sau disruption lớn vượt HA thông thường.
- BCP: cách business tiếp tục outcome gồm people/process/facility/vendor/technology.
- BIA: phân tích process/dependency/impact theo thời gian để đặt ưu tiên.
- RTO: thời gian mục tiêu khôi phục capability.
- RPO: lượng dữ liệu tối đa chấp nhận mất, biểu diễn theo thời gian.

RTO/RPO là target business; phải đo actual. RPO 5 phút không đạt nếu async replication lag
30 phút dù dashboard backup xanh.

## Failure model

~~~mermaid
flowchart TB
  User --> DNS
  DNS --> RegionA[Primary region]
  DNS -. failover .-> RegionB[Recovery region]
  RegionA --> AppA[App multi fault domain]
  RegionA --> DataA[(Primary data)]
  DataA -. replication or backup .-> DataB[(Recovery data)]
  RegionB --> AppB[Warm application]
  ID[Identity keys certificates] --> RegionA
  ID --> RegionB
  Dep[External dependencies] --> RegionA
  Dep --> RegionB
~~~

Xét instance, rack/zone/AD, region, network/DNS, control plane, identity provider, key/secret,
database corruption, operator error, supply-chain compromise, quota/capacity, vendor và people.
Redundancy cùng account/key/control plane có correlated failure.

## HA design

- Loại SPOF hoặc chấp nhận có evidence.
- Replica trải failure domain; health/failover không phụ thuộc cùng component hỏng.
- Stateless app vẫn có state ở DB/cache/session/queue/DNS.
- Load balancer health và readiness phản ánh khả năng phục vụ.
- Quorum/fencing ngăn split-brain; không tự force hai primary.
- Capacity khi N-1, deploy surge và maintenance.
- Planned/unplanned failover và failback được test.

Active-active tăng complexity routing/data consistency/conflict; chỉ chọn khi requirement
biện minh.

## Backup program

Inventory và classification quyết định:

- source: database, object, volume, config, key/certificate, artifact, SaaS;
- method/frequency/retention/location/immutability;
- encryption và key recovery;
- account/region/provider isolation;
- application-consistent checkpoint và dependency order;
- restore procedure, target sandbox, integrity/reconciliation;
- legal hold/deletion/ransomware scenario.

Snapshot cùng account không đủ cho account compromise. Replication nhanh sao chép cả xóa/
corruption nên không thay versioned immutable backup. Backup catalog/credential/key cũng cần DR.

## DR strategy

| Strategy | Cost | RTO thường tương đối | Công việc chính |
|---|---:|---|---|
| Backup and restore | Thấp | Dài | Provision + restore + validate |
| Pilot light | Thấp-vừa | Dài-vừa | Core data/services luôn có |
| Warm standby | Vừa-cao | Ngắn hơn | Scaled-down stack sẵn |
| Active-passive | Cao | Ngắn | Full standby và traffic switch |
| Active-active | Rất cao/complex | Có thể ngắn | Multi-writer/routing/conflict |

Không gắn số RTO chung cho pattern; đo hệ thống thật, gồm declare, access, capacity, DNS,
restore, application start và business validation.

## DR runbook

1. Authority/declare và freeze write/change.
2. Xác định failure/corruption point và recovery point an toàn.
3. Kiểm recovery environment, quota, identity, key, dependency.
4. Provision/reconcile infrastructure từ source tin cậy.
5. Restore data đúng order; migrate/config version tương thích.
6. Validate technical + business invariant + security.
7. Switch traffic có TTL/session/cache/allowlist.
8. Monitor SLO/data/lag; communicate.
9. Quyết định primary mới và bảo vệ evidence.
10. Failback plan: resync direction, conflict, freeze/cutover, validate.
11. Reconcile source of truth và post-drill action.

Rollback DR không đơn giản nếu đã nhận write ở site mới; failback là data migration/change riêng.

## IaC và data recovery

Terraform có thể tái tạo control-plane resources nếu provider/API/state/credential/module
source còn. Terraform state backup chỉ khôi phục mapping infrastructure, không chứa database
records/object content hợp lệ. Remote state phải version/lock/encrypt và có restore drill;
provider/module/artifact source phải còn để reproduce.

## DNS, identity và dependency

- DNS TTL/negative cache, health check và client pinning quyết định cutover thực.
- DR identity phải least privilege nhưng usable khi primary IdP/control plane hỏng; break-glass
  được rehearsal/audit.
- Key/cert/secret version và trust chain có mặt ở recovery scope.
- External SaaS/payment/email/private allowlist và network connectivity được test.
- Quota/capacity reservation vì region disaster tạo demand cạnh tranh.

## Lab: measured recovery

1. BIA OrderFlow: critical journey/dependency/impact theo 15m, 1h, 4h, 24h.
2. Chốt SLO, RTO/RPO và strategy bằng ADR/cost.
3. Backup PostgreSQL + config/artifact/secret references vào isolated sandbox.
4. Inject ba scenario: node loss, region unavailable, silent data corruption.
5. Restore tại environment sạch; đo từ declare đến user journey hoạt động.
6. Reconcile order/payment/outbox count/hash/invariant; đo actual RPO.
7. Fail traffic, nhận write mới, rồi lập và chạy failback an toàn.
8. Xóa recovery sandbox đúng scope và ghi cost/action.

Dùng [DR test template](../Templates/DR-TEST.md) và
[Templates index](../Templates/README.md).

## Hoàn thành D18 khi

- BIA nối business impact với tier/RTO/RPO.
- Failure model gồm correlated/control-plane/identity/data corruption.
- Restore clean-room thành công và integrity được kiểm, không chỉ file tồn tại.
- Actual RTO/RPO được đo; gap có owner/funding.
- Failover lẫn failback chạy được và source of truth được reconcile.
- HA/replication/backup/DR/IaC state không bị đánh đồng.

Nguồn: [NIST Contingency Planning SP 800-34](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final),
[Google SRE disaster role](https://sre.google/sre-book/accelerating-sre-on-call/) và
[OCI resilient topology guidance](https://docs.oracle.com/en/solutions/oci-best-practices/reliable-and-resilient-cloud-topology-practices1.html).

Tiếp theo: [D19 - Distributed, hybrid và multi-cloud](../19-distributed-hybrid-multicloud/README.md).
