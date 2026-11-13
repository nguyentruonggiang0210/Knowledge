# System design exercises

Mỗi bài 45–90 phút. Interviewer chỉ cung cấp dữ kiện bổ sung khi ứng viên hỏi. Ứng viên phải bắt đầu từ requirements, không được giả định “Kubernetes luôn là đáp án”. Hướng chấm nằm ở `91-system-design-models.md`.

## Khung trình bày bắt buộc

1. Functional/non-functional requirements; SLI/SLO, RPO/RTO, security/compliance, scale và budget.
2. Assumptions và câu hỏi còn mở.
3. Architecture/data/traffic/deployment flows và failure domains.
4. Capacity model ở mức bậc lớn, không cần con số hoàn hảo.
5. Security, observability, rollout/rollback, backup/restore, incident ownership.
6. Trade-offs, alternatives, phased migration và tiêu chí thành công.

---

## SD-01 — E-commerce flash sale

Thiết kế nền tảng container cho API, web, cart, inventory, payment adapter và async workers. Bình thường 500 RPS, flash sale 25k RPS trong 5 phút; inventory không được oversell, payment provider có rate limit. SLO checkout 99.95%, p99 <1.5s ngoài lỗi provider; RPO order 0, RTO 30 phút.

**Interviewer có thể cung cấp khi hỏi:** 3 availability zones; managed database/queue có sẵn; team 12 người; peak báo trước 30 phút.

**Phải bàn:** image delivery, workload/controller, autoscale + pre-scale, queue/backpressure, idempotency, readiness/draining, topology/PDB/capacity, cache consistency, secret/payment isolation, SLO/tracing và degradation/load shedding.

---

## SD-02 — Multi-tenant internal developer platform

50 product teams, 500 services, mức tin cậy khác nhau. Team muốn self-service deploy, logs/metrics, database request; security muốn least privilege/audit; platform team chỉ có 8 người. Một số workload xử lý PII.

**Interviewer có thể cung cấp:** hai regions, ba environments, managed Kubernetes; không bắt buộc một cluster.

**Phải bàn:** cluster/namespace tenancy boundary, identity/RBAC, NetworkPolicy/egress, quota/LimitRange, Pod Security/admission, secret/KMS, node isolation, platform API/golden path, GitOps, policy exception, chargeback, SLO của platform và escape hatch.

---

## SD-03 — Secure software supply chain

Thiết kế pipeline build 1.000 repositories, gồm public/untrusted PR và private dependency. Yêu cầu artifact reproducible ở mức thực tế, biết nguồn gốc, phát hiện secret/CVE/license, deploy chỉ artifact được duyệt; developer feedback <10 phút.

**Phải bàn:** isolated/ephemeral builders, BuildKit cache trust, build secrets, base image program, SBOM, scan/triage, provenance/signing, immutable registry/promotion, admission verification, revocation/incident, exception expiry và disaster mode khi registry/signing service down.

---

## SD-04 — Stateful analytics platform

Chạy ingest, Kafka-like broker, stream processor và query service trên Kubernetes. 200 TB, tăng 3 TB/ngày; query có SLO p95 2s, ingest RPO <1 phút, RTO 2 giờ.

**Phải bàn:** phần nào managed vs in-cluster, StatefulSet/operator, storage class/topology/performance, quorum/fencing, resource isolation, network, compaction/I/O, autoscale limits, snapshot/logical backup/offsite restore, upgrade và game day.

---

## SD-05 — Global API active-active

API phục vụ APAC/EU/US, mỗi region có cluster. Người dùng cần latency thấp; profile chấp nhận eventual consistency 5s, nhưng financial ledger cần strong consistency. Một region có thể mất hoàn toàn.

**Phải bàn:** global traffic/DNS, regional isolation, data partition/replication theo domain, idempotency, retries/timeouts/circuit breaking, config/secret promotion, multi-cluster service discovery, observability correlation, failover/failback và split-brain prevention.

---

## SD-06 — Disaster recovery from ransomware/credential compromise

Giả định attacker có cluster-admin và cloud project editor trong 2 giờ. Thiết kế trước sự cố và recovery để đạt RPO 15 phút cho database, RTO 4 giờ cho critical services.

**Phải bàn:** immutable/off-account backup, KMS/key separation, short-lived identity, audit export, supply-chain trust, blast-radius segmentation, break-glass, clean-room restore order, credential rotation, artifact verification, DNS traffic, forensic preservation và định kỳ restore exercise.

---

## SD-07 — Observability at fleet scale

100 clusters, 20k Pods, logs 15 TB/ngày, metrics cardinality tăng 20%/tháng. MTTR đang 90 phút, ngân sách observability cố định.

**Phải bàn:** telemetry contract, sampling/aggregation/retention tiers, cardinality controls, tenant isolation, correlation IDs/traces, SLO/burn alerts, control plane/CNI/CSI signals, cost/unit economics, backpressure/outage mode, audit retention và measurement of MTTR improvement.

---

## SD-08 — Migration từ Compose/VM

40 services chạy bằng Compose trên 20 VMs; 8 databases local disk; deploy downtime 20 phút; chỉ 4 engineers biết Kubernetes. Mục tiêu giảm downtime và chuẩn hóa delivery trong 12 tháng.

**Phải bàn:** discovery/classification, “không migrate” option, container contract, externalize config/data, image pipeline, platform landing zone, pilot/strangler/dual run, data migration/rollback, training/on-call, observability/SLO, cost and success gates. Không được big-bang.

## Rubric chung (100 điểm)

| Tiêu chí | Điểm |
|---|---:|
| Làm rõ requirements và lượng hóa SLO/RPO/RTO/scale | 15 |
| Cơ chế Docker/Kubernetes/data/traffic đúng | 20 |
| Failure domains, HA, capacity, backpressure | 20 |
| Security/supply chain/multi-tenancy | 15 |
| Observability/operations/DR/rollback | 15 |
| Trade-off, simplicity, cost, phased delivery | 10 |
| Giao tiếp, sơ đồ, assumptions rõ | 5 |

**Fail bất kể điểm:** không có data recovery/rollback; secret hard-code; “cluster-admin/privileged cho dễ”; không xét correlated failure; đưa kiến trúc vượt xa khả năng vận hành mà không có plan.
