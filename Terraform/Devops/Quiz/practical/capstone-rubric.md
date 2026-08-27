# Rubric Capstone OrderFlow

Tổng: **100 điểm**. Đạt từ **80 điểm** và vượt tất cả safety gate.

## Safety gate bắt buộc

Bài chưa đạt nếu còn một lỗi chưa xử lý:

- Credential/private key/password thật nằm trong Git, image, state, plan, log hoặc bài nộp.
- Untrusted PR có thể lấy production secret hoặc deploy; pipeline dùng admin key dài hạn không có risk exception.
- App/data private tier mở inbound Internet rộng hoặc container privileged/root không có lý do/control.
- Runtime không truy được về immutable artifact digest/commit đã review.
- Backup chưa bao giờ restore test nhưng được tuyên bố đạt RPO/RTO.
- Drill không có scope/stop condition, gây rủi ro ngoài sandbox.
- Không có evidence chạy được phần cốt lõi hoặc không công khai phần mock do quota/cost.

## 1. Product, culture và architecture — 8 điểm · D01, D06

- 2: user journey/outcome/ownership rõ.
- 2: architecture/request/data/trust/failure diagram chính xác.
- 2: assumptions, alternatives và ADR có decision trigger.
- 2: risk register có owner/control/evidence, không chỉ checklist.

## 2. Linux, network, IaC và image/config — 10 điểm · D02, D03, D05, D07

- 2: service/bootstrap idempotent, least permission và debug evidence.
- 2: DNS/TLS/LB/private route/firewall/return path đúng.
- 3: Terraform module/state/version/plan và dev-prod boundary an toàn.
- 3: image/config source of truth tái lập, không tải `latest`/remote-exec tùy tiện.

## 3. CI/CD và supply chain — 12 điểm · D04, D08, D11

- 3: protected Git/PR, untrusted boundary và short-lived identity.
- 3: test/scan/SBOM/provenance/signature theo exact digest.
- 3: build-once/promote-many, approval/concurrency/audit.
- 3: release/schema compatibility và staged rollback/roll-forward gate.

## 4. Container/Kubernetes/GitOps — 12 điểm · D09, D10

- 3: image tối thiểu/non-root/signal/resource/storage đúng.
- 3: probe, rollout, graceful drain và disruption/failure capacity.
- 3: RBAC/NetworkPolicy/secret/admission least privilege.
- 3: Helm/GitOps source, drift/break-glass/version/rollback rõ.

## 5. Observability và SRE — 12 điểm · D12, D13

- 3: structured log + trace context end-to-end, không lộ dữ liệu.
- 3: RED/USE, cardinality/sampling/retention có lý do.
- 3: user-centered SLI/SLO/error-budget và alert test.
- 3: load/capacity/failure test, runbook dựa evidence.

## 6. Data, cache và messaging — 10 điểm · D14

- 3: transaction/idempotency/outbox-delivery semantics rõ và test được.
- 2: cache invalidation/TTL/stampede hoặc quyết định không dùng có lý do.
- 2: expand/contract migration/backfill/consistency evidence.
- 3: backup/restore/invariant/application verification đạt mục tiêu khai báo.

## 7. Platform và developer experience — 8 điểm · D15

- 3: golden path có versioned contract/guardrail/escape hatch.
- 2: service thứ hai onboard bằng self-service, không copy-paste bí ẩn.
- 3: docs/support/feedback và metric time-to-value/adoption/toil/reliability.

## 8. FinOps, capacity và sustainability — 8 điểm · D16

- 2: cost allocation/budget/anomaly/owner.
- 2: unit cost/order và capacity/headroom/quota.
- 2: telemetry/egress/storage lifecycle/right-size trade-off.
- 2: cleanup và sustainability không hy sinh SLO/security mù quáng.

## 9. Incident, HA/DR và distributed systems — 12 điểm · D17–D19

- 3: bad-release/dependency drill có detection, command, timeline và verified action.
- 3: restore/RPO/RTO end-to-end evidence.
- 3: retry/backpressure/idempotency/partial-failure control.
- 3: DR tabletop có authority, fencing/split-brain, comms, failback/game-day action.

## 10. Senior leadership và communication — 8 điểm · D20

- 2: executive one-pager rõ outcome/risk/cost/decision.
- 2: ưu tiên và cắt scope có residual-risk owner.
- 2: oral defense trả lời ít nhất 6/8 câu bằng evidence, không bluff.
- 2: mentoring/handoff/runbook/decision log giúp đội khác vận hành, không phụ thuộc hero.

## Mức kết quả

| Điểm | Đánh giá |
|---:|---|
| < 60 | Chưa sẵn sàng; quay lại lesson và lab nền tảng |
| 60–79 | Có nền tảng nhưng chưa tự chủ production |
| 80–89 | Đạt; có thể vận hành trong quy trình review/on-call hỗ trợ |
| 90–95 | Rất tốt; thiết kế và xử lý failure có hệ thống |
| 96–100 | Xuất sắc; có evidence senior, có thể dẫn dắt và mentor |

## Phiếu chấm

| Hạng mục | Điểm | Evidence | Lỗ hổng/risk | Action/owner/date |
|---|---:|---|---|---|
| Product/architecture | /8 |  |  |  |
| Linux/network/IaC/image | /10 |  |  |  |
| CI/CD/supply chain | /12 |  |  |  |
| Container/Kubernetes | /12 |  |  |  |
| Observability/SRE | /12 |  |  |  |
| Data/messaging | /10 |  |  |  |
| Platform/DX | /8 |  |  |  |
| FinOps/capacity | /8 |  |  |  |
| Incident/DR/distributed | /12 |  |  |  |
| Leadership | /8 |  |  |  |
| **Tổng** | **/100** |  |  |  |

