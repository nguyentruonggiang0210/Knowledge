# Đáp án Level 5 – Senior / Staff DevOps-SRE

Tổng: **38 điểm**. Chấp nhận phương án khác nếu assumptions, trade-off, evidence và ownership tương đương.

## S01 (1 điểm)

**Sai.** Retry không giới hạn/không backoff khuếch đại tải, tăng queue và kéo dài recovery. Chỉ retry lỗi transient, operation idempotent, trong deadline/budget với backoff+jitter.

## S02 (1 điểm)

**Đúng.** Multi-cloud là quyết định business/risk, không phải huy hiệu kỹ thuật; complexity vận hành thường là chi phí thường trực.

## S03 (1 điểm)

**B.** Senior framing bắt đầu từ outcome/constraint/risk và làm quyết định có thể review/revisit bằng evidence.

## S04 (1 điểm)

**Sai.** Blameless tránh quy kết cá nhân để học sâu; accountability vẫn gồm owner, decision, deadline và xác minh corrective action.

## S05 (1 điểm)

**B.** Platform thành công khi developer chọn dùng vì giảm cognitive load và cải thiện outcome trong guardrail, không vì số YAML/resource.

## S06 (1 điểm)

**B.** Capacity phải xét demand, bottleneck, headroom khi failure, procurement/quota lead time và unit economics.

## S07 (1 điểm)

**A.** RTO là recovery objective của kịch bản continuity; SLA là cam kết dịch vụ với phương pháp đo/hậu quả được thỏa thuận.

## S08 (1 điểm)

**Đúng.** Evidence automation cần thiết nhưng control có thể chỉ tồn tại trên giấy hoặc không giảm threat thực; risk owner phải xác minh effectiveness.

## S09 (2 điểm)

- 1 điểm: PR/review + commit → trusted build/test → SBOM/provenance/signature + digest → approved deployment/config → runtime instance → DNS/LB/service → business request → data/message side effect → metric/log/trace/SLO/business KPI.
- 1 điểm: workload/human identity và least privilege ở SCM, runner, registry, deploy, runtime/data; audit/change ID tại approval/deploy; commit+digest+config+trace/request/idempotency ID cho end-to-end correlation, có redaction/privacy.

## S10 (2 điểm)

- 1 điểm: timeout giới hạn chờ; retry thử lại transient; circuit breaker ngừng gọi dependency lỗi; rate limit kiểm soát admission; backpressure làm producer chậm theo consumer; load shedding bỏ việc ưu tiên thấp khi quá tải.
- 1 điểm: có end-to-end deadline và một retry owner/budget, idempotency, exponential backoff+jitter; concurrency/queue bounded. Circuit/load shed tạo recovery room và graceful degradation, tránh mỗi tầng nhân retry.

## S11 (2 điểm)

- 1 điểm: đo latency/jitter/bandwidth/egress, route/BGP/VPN/FastConnect/ExpressRoute, DNS/failover, federated identity/key, audit/telemetry correlation và ai sở hữu mỗi hop.
- 1 điểm: data gravity/residency/replication/consistency/RPO quyết định placement. Async boundary phù hợp khi WAN partition/latency không thể nằm trong sync SLO, nghiệp vụ chấp nhận eventual consistency và có idempotency/reconciliation/dead-letter/backpressure.

## S12 (2 điểm)

- 1 điểm: baseline cost per transaction, SLI/SLO/error budget, lead time/failure, capacity; phân loại fixed/variable/toil và constraints. Không hứa phần trăm khi chưa có baseline.
- 1 điểm: tìm win-win như bỏ idle/log cardinality/build wait trước; experiment nhỏ với guardrail SLO/security, hypothesis/owner/exit. Trình bày options, cost of delay, confidence và residual risk; product/business chọn trade-off được hiểu rõ.

## S13 (2 điểm)

- 1 điểm: pairing/review có teaching intent, docs/runbook tested, game day/rotation/office hour/community, postmortem learning; self-service golden path giảm ticket.
- 1 điểm: phân bố ownership/on-call, backup owner, review participation; đo repeated ticket/toil, time-to-autonomy, adoption/success rate và bus factor. Hero phải chuyển knowledge/quyền, không trở thành approval bottleneck.

## S14 (2 điểm)

- 1 điểm: incident là interruption/impact hiện tại; problem điều tra pattern/cause; known error có diagnosis/workaround; change risk là khả năng change gây harm; debt là trade-off tích lũy có cost/risk.
- 1 điểm: register có asset/outcome, scenario, likelihood/impact/detectability, owner/control/evidence/expiry. Ưu tiên roadmap bằng incident frequency/severity, SLO/error budget, audit/cost of delay và effort; review sau change/incident.

## S15 (3 điểm)

- 0,5: declare severity/IC; chỉ định ops/technical leads, scribe và communications liaison; channel/bridge/source of truth.
- 0,5: freeze unrelated changes, inventory ba changes, bảo toàn audit; không để mọi người cùng thao tác không điều phối.
- 0,5: customer mitigation như disable feature/degrade/traffic/rollback dựa data integrity; workstreams có hypothesis/evidence/owner/timebox.
- 0,5: comms nội bộ/external/exec cadence với impact, action, next update và uncertainty; liaison che chắn technical responders.
- 0,5: decision/timeline/change ID, metric/log/trace; security/data escalation nếu cần.
- 0,5: kết thúc khi impact ổn định qua observation window, data reconcile/ownership rõ và follow-up handoff; postmortem/action sau, không tuyên bố chỉ vì graph tạm xanh.

## S16 (3 điểm)

- 1 điểm: retry ở ba tầng nhân số call (mức khuếch đại phụ thuộc “3 lần” là total hay additional), giữ connection/queue lâu và autoscale gửi thêm tải vào bottleneck; timeout 2 giây mỗi tầng có thể vượt user deadline.
- 1 điểm: một layer gần caller sở hữu retry, idempotency và retry budget; timeout giảm dần theo end-to-end deadline, exponential backoff+jitter, max attempts, concurrency/queue bounded.
- 1 điểm: stop retry/load shed/circuit để downstream hồi, ưu tiên request quan trọng, drain queue có kiểm soát; scale bottleneck chỉ nếu hiệu quả. Mở circuit/canary dần theo saturation/error, điều tra root cause sau mitigation.

## S17 (3 điểm)

- 1 điểm: trong partition không thể đồng thời bảo đảm mọi write ở mọi region và strong consistency tuyệt đối; payment/order critical có thể chọn single writer/home region/quorum consensus và degrade một vùng thay vì double-charge.
- 1 điểm: global idempotency key + durable uniqueness/ledger, fencing term/lease, ownership routing; async replicas/outbox và explicit state machine. Không dựa cache local để dedupe.
- 1 điểm: reconcile duplicate/pending bằng ledger/audit/compensation, client retry contract. Game day partition/clock skew/lag/failover/fencing, invariant “một charge cho một intent”, failback và data-loss measurement.

## S18 (3 điểm)

- 1 điểm: map value stream từ idea→production, queue/handoff/failure/toil và baseline DORA + SLO/customer outcome; phỏng vấn teams, chọn bottleneck thật.
- 1 điểm: pilot 1–2 service/team, rõ end-to-end ownership; golden path nhỏ cho build/artifact/deploy/observability có guardrail và feedback/support, rồi scale theo adoption evidence.
- 1 điểm: roadmap theo monthly outcome/experiment; deploy frequency cân lead time, failure/recovery/SLO và business value. Không xếp hạng/phạt cá nhân/team bằng metric; audit gaming và dùng qualitative feedback.

## S19 (3 điểm)

- 0,5: incident command, freeze release/dependency fetch, preserve logs/build artifact/registry metadata; xác minh advisory/IOC.
- 0,5: query SBOM/provenance dependency version→build→digest→environment/customer; đánh giá runtime exploit/data/credential scope.
- 0,5: revoke/rotate registry/build/signing/cloud credentials theo risk; quarantine/block compromised digest/package/source.
- 0,5: clean trusted builder/source/lock, patch/remove dependency, rebuild deterministic, scan/test, new provenance/key/signature; staged promote.
- 0,5: verify runtime inventory không còn old digest, monitor IOC; customer/regulator/legal comms theo impact/obligation và không suy đoán.
- 0,5: pin/verify dependencies, hermetic/isolated build, egress policy, protected signing, SBOM/attestation/admission và tabletop; xử lý trust root compromise riêng.

## S20 (3 điểm)

- 1 điểm: hỏi “zero downtime” đo theo SLI/cửa sổ nào, workload/data/residency/threat, vì sao multi-cloud, baseline cost/unit và 30% gồm migration/people/egress/license không; deadline/capability/owner.
- 1 điểm: so options—single-cloud multi-zone/region, warm standby, SaaS abstraction, selective portability, full active-active—bằng SLO/RTO/RPO, failure independence, consistency, ops skill/cost. Recommend option nhỏ nhất đạt outcome.
- 1 điểm: phase discovery/prototype/game day/pilot với entry/exit metric, risk register/ADR/decision owner, rollback/funding/staffing. Nói không bằng evidence khi ba constraints mâu thuẫn, rồi đề xuất trade-off: scope, reliability definition, saving target hoặc timeline.

