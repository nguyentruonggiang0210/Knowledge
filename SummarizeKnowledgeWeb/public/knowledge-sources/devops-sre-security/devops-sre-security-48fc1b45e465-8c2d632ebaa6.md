# Đáp án Level 4 – Production Operations

Tổng: **38 điểm**.

## P01 (1 điểm)

**A.** SLI là phép đo; SLO là target trên SLI; SLA là cam kết/điều khoản với bên nhận dịch vụ.

## P02 (1 điểm)

**Đúng.** Error budget là công cụ ra quyết định dựa trên reliability objective, không phải quota để cố tình tạo incident.

## P03 (1 điểm)

**A.** Cache-aside phải xử lý invalidation/staleness, miss storm và cache failure; không thay transaction của source of truth.

## P04 (1 điểm)

**Đúng.** Delivery có thể lặp do timeout/redelivery. “Exactly once” thường dựa trên transactional scope, dedupe/idempotency và assumptions cụ thể.

## P05 (1 điểm)

**A.** Unit economics phân biệt cost tăng là do business growth hay efficiency suy giảm.

## P06 (1 điểm)

**B.** IC giữ đội hướng tới mitigation/recovery, phân vai và comms; subject-matter experts điều tra trong workstream.

## P07 (1 điểm)

**Sai.** Backup success chỉ nói job tạo output theo kiểm tra giới hạn. Phải restore, verify dữ liệu/app dependency và đo RTO/RPO.

## P08 (1 điểm)

**A.** RPO là tolerance mất dữ liệu theo thời gian; RTO là mục tiêu thời gian phục hồi dịch vụ.

## P09 (2 điểm)

- 1 điểm: RED—request rate, error, duration ở service edge theo endpoint/cohort; USE—utilization, saturation/queue, errors cho CPU/memory/disk/network/pool.
- 1 điểm: structured log có request/trace/change ID và tail traces nối slow request tới downstream/lock/GC; alert trên user symptom/burn rate, dùng resource signals cho diagnosis chứ không page mọi dao động.

## P10 (2 điểm)

- 1 điểm: ví dụ 99,9% eligible external API requests trong rolling 28 ngày trả non-5xx dưới 500 ms; định nghĩa source đo, population/good/valid events rõ.
- 1 điểm: loại client-invalid request theo rule không bị game, maintenance theo policy/SLA chứ không xóa tùy ý. 100% có thể đòi chi phí/độ chậm vô hạn, cản đổi mới và vẫn không khả thi do dependency.

## P11 (2 điểm)

- 1 điểm: expand thêm schema/index/API tương thích; deploy code đọc/ghi dual hoặc feature flag; backfill idempotent/throttled và verify count/checksum/invariant.
- 1 điểm: chuyển traffic/read path sau telemetry/consistency gate; contract sau khi mọi consumer cũ hết. Rollback binary chỉ trước contract; snapshot/PITR/roll-forward và migration owner cho failure.

## P12 (2 điểm)

- 1 điểm: portal chỉ là UI; platform-as-product giải quyết journey end-to-end với API/automation/operations/support/roadmap. Golden path chuẩn hóa 80% common case bằng contract/version/guardrail.
- 1 điểm: docs/example/feedback/SLO/support, escape hatch có owner/expiry và migration. Đo time-to-first-deploy, lead time, failure/reliability, support toil, adoption/retention/satisfaction—không chỉ resource count.

## P13 (2 điểm)

- 1 điểm: showback minh bạch cost, chargeback phân bổ/thu hồi; budget/forecast kế hoạch, anomaly phát hiện lệch; right-size/commitment tối ưu demand ổn định sau khi hiểu risk.
- 1 điểm: tắt redundancy hoặc dùng instance kém hiệu quả có thể tăng outage/retry/carbon; chuyển region/archival có egress/latency/compliance. Tối ưu cost per outcome cùng SLO và lifecycle carbon.

## P14 (2 điểm)

- 1 điểm: impact/timeline/detection/response/recovery, contributing technical+organizational conditions, điều làm tốt/chưa tốt; không quy lỗi cá nhân nhưng vẫn rõ quyết định/context.
- 1 điểm: action cụ thể, owner/deadline/priority/verification và theo dõi đóng. “Human error” không phải root cause đủ; hỏi hệ thống cho phép lỗi lan rộng và detection/recovery ra sao.

## P15 (3 điểm)

- 1 điểm: xác nhận SLI theo endpoint/cohort/instance/time/change; tail trace và log correlation tìm stage chậm/downstream, không dựa CPU average.
- 1 điểm: queue, thread/connection pool, disk/network, GC/lock, rate/size, dependency timeout; xem percentile/saturation từng shard/node và recent config/deploy.
- 1 điểm: stop/pause rollout khi burn rate/queue tăng; giới hạn concurrency/retry, load shed/circuit/rollback theo evidence. Scale chỉ khi bottleneck scale-out được và dependency chịu tải.

## P16 (3 điểm)

- 1 điểm: migration destructive phá backward compatibility; app rollback không restore column/data. Dừng writer/rollout, bảo toàn backup/log và đánh giá data loss/impact.
- 1 điểm: restore/PITR vào môi trường mới hoặc roll-forward schema/code dựa RTO/RPO; reconcile writes sau point, validation và stakeholder/incident control. Không sửa DB mù.
- 1 điểm: expand/contract nhiều release, migration review/backup/restore test, compatibility matrix, canary shadow query, destructive gate/time delay và DB change owner.

## P17 (3 điểm)

- 1 điểm: phỏng vấn/quan sát value stream, top tasks, wait/error/support toil và lý do script riêng (capability, trust, performance, docs, migration cost).
- 1 điểm: chọn journey phổ biến/đau nhất, co-design pilot, stable API/template+guardrail+escape hatch/support; migration adapter thay vì big bang.
- 1 điểm: baseline và đo time-to-first-use/lead time, adoption/retention, failure/SLO, tickets/cognitive load; roadmap theo feedback/outcome, không feature count/mandate.

## P18 (3 điểm)

- 1 điểm: scope account/service/tag/destination/time/unit cost; đối chiếu release/change, billing line item và network/log flow. Bảo toàn sample/audit trước giảm retention.
- 1 điểm: kiểm tra retry loop/cross-zone-region path/object download, log level, duplicate exporter và unbounded cardinality/attribute; correlate traffic business.
- 1 điểm: containment rate/retry/sampling có guardrail, routing/compression/filter/tier/retention; verify SLO/security/forensic needs và thêm budget/anomaly/cardinality test.

## P19 (3 điểm)

- 1 điểm: IC điều phối; service/data owner và business risk owner theo pre-agreed authority quyết định với RPO breach rõ. Partial failure phải xác định primary write health và partition.
- 1 điểm: lượng hóa 20 phút lag/data loss, pending transaction/idempotency; fence old writer/quorum/lease để tránh split-brain trước traffic/DNS failover; comms expectation.
- 1 điểm: reconcile/failback sau recovery, audit decision. Diễn tập credential, routing/DNS TTL, replication lag gates, backup restore, capacity và rollback/failback; nếu chưa chấp nhận loss có thể chọn degraded/read-only.

## P20 (3 điểm)

- 1 điểm: backup usable bao gồm data, transaction log, schema, encryption key/cert/config/version và dependency manifest; test integrity/point-in-time thường xuyên.
- 1 điểm: automate parallel restore/index/replay phù hợp, pre-stage secure key/infrastructure, size bandwidth/IO; instrument từng stage để tìm 14 giờ nằm đâu.
- 1 điểm: boot application + invariant/query/synthetic test, đo RTO/RPO end-to-end; game day theo lịch, owner/action. Điều chỉnh architecture/RTO hoặc capability có cost được business chấp nhận.

