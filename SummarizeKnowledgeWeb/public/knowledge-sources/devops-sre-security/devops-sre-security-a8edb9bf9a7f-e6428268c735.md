# Level 5 – Senior / Staff DevOps-SRE

Tổng: **20 câu / 38 điểm**. Không có một kiến trúc duy nhất; chấm vào assumptions, trade-off, risk và cách xác minh.

## S01 — Đúng/Sai (1 điểm) · D19

Retry mọi request ngay lập tức và không giới hạn luôn cải thiện availability trong hệ phân tán.

## S02 — Đúng/Sai (1 điểm) · D19, D20

Multi-cloud chỉ nên chọn khi lợi ích business/reliability/compliance bù được complexity về people, identity, data, network, tooling và operations.

## S03 — Trắc nghiệm (1 điểm) · D20

Một quyết định kỹ thuật senior tốt thường bắt đầu bằng:

A. Tool đang thịnh hành  
B. Outcome, constraints, risk, alternatives, evidence và owner/decision date  
C. Số lượng microservice tối đa  
D. Copy kiến trúc công ty khác

## S04 — Đúng/Sai (1 điểm) · D17, D20

“Blameless” nghĩa là không cần accountability, owner hoặc deadline cho corrective action.

## S05 — Trắc nghiệm (1 điểm) · D15

North-star hợp lý cho internal platform là:

A. Số service team bị ép migrate  
B. Developer outcome như giảm cognitive load/lead time đồng thời giữ reliability/security, đo bằng adoption tự nguyện và evidence  
C. Số YAML template  
D. Số cluster

## S06 — Trắc nghiệm (1 điểm) · D13, D16

Capacity plan tốt nhất kết hợp gì?

A. Chỉ CPU trung bình hôm qua  
B. Demand forecast, headroom, bottleneck/saturation, failure capacity, lead time/quota và unit cost  
C. Mua gấp đôi mọi tài nguyên  
D. Bỏ load test

## S07 — Trắc nghiệm (1 điểm) · D18

Khác biệt chính giữa RTO và SLA là:

A. RTO là mục tiêu thời gian phục hồi cho kịch bản disruption; SLA là cam kết dịch vụ/điều khoản đo lường với bên nhận dịch vụ  
B. Hai khái niệm luôn giống nhau  
C. RTO chỉ là DNS TTL  
D. SLA là backup interval

## S08 — Đúng/Sai (1 điểm) · D11, D20

Compliance evidence tự động giúp audit và giảm toil, nhưng passing control không thay thế threat modeling, risk ownership và xác minh control thực sự hiệu quả.

## S09 — Giải thích end-to-end (2 điểm) · D01, D08, D12

Mô tả chain từ commit được review tới artifact/digest/provenance, deploy, request production, data side effect, telemetry và business outcome. Chỉ ra nơi cần identity, audit và correlation ID.

## S10 — Giải thích distributed failure (2 điểm) · D13, D19

Phân biệt timeout, retry, circuit breaker, rate limit, backpressure và load shedding. Chúng tương tác thế nào để tránh retry storm/cascading failure?

## S11 — Giải thích hybrid/multi-cloud (2 điểm) · D06, D19

Đánh giá một workload hybrid: latency, bandwidth/egress, DNS/routing, identity federation, key/secret, data gravity/consistency, observability và failure ownership. Khi nào nên đặt integration boundary bất đồng bộ?

## S12 — Giải thích technical strategy (2 điểm) · D16, D20

Bạn có ba mục tiêu xung đột: giảm 20% cost, tăng SLO và rút lead time. Hãy mô tả cách baseline, đặt guardrail, tìm win-win, ưu tiên experiment và trình bày trade-off cho stakeholder.

## S13 — Giải thích mentoring (2 điểm) · D15, D20

Thiết kế cơ chế nâng năng lực thay vì trở thành “hero”: pairing/review, runbook, game day, office hour, paved road, ownership rotation và metric cho bus factor/toil/adoption.

## S14 — Giải thích portfolio risk (2 điểm) · D17, D20

Phân biệt incident, problem, known error, change risk và technical debt. Làm sao xây risk register/roadmap dựa trên impact, likelihood, detectability, cost of delay và evidence sự cố?

## S15 — Tình huống major incident (3 điểm) · D12, D17, D20

Checkout lỗi 30%, social media phản ứng, CEO yêu cầu cập nhật liên tục và ba đội đang thay đổi production cùng lúc. Hãy thiết kế command structure, change freeze, comms cadence, technical workstream, decision log, customer mitigation và tiêu chí kết thúc incident.

## S16 — Debug retry storm (3 điểm) · D13, D19

Downstream chậm 2 giây; ba tầng service retry 3 lần, queue tăng và autoscaler mở rộng nhưng lỗi nặng hơn. Phân tích request amplification, timeout budget, retry ownership, jitter, concurrency limit, circuit breaker và recovery sequence.

## S17 — Tình huống multi-region data (3 điểm) · D14, D18, D19

Thiết kế active-active cho order service yêu cầu không double-charge nhưng vẫn phục vụ khi partition. Trình bày consistency/availability trade-off, idempotency key, ownership/consensus hoặc home region, reconciliation và cách test split-brain.

## S18 — Tình huống transformation (3 điểm) · D01, D15, D20

Tổ chức muốn “DevOps transformation” bằng cách mua platform và đặt KPI số deploy. Hãy đề xuất roadmap 6 tháng theo value stream, bottleneck, team topology/ownership, pilot golden path, DORA+quality outcome và feedback loop; nêu cách tránh gaming KPI.

## S19 — Tình huống supply-chain incident (3 điểm) · D08, D11, D17

Một build dependency bị compromise; chưa biết artifact nào chứa nó. Lập incident plan: stop/preserve, SBOM/provenance query, credential/release containment, rebuild clean-room, verify/sign/promote, customer/compliance comms và long-term control.

## S20 — Tình huống capstone defense (3 điểm) · D06, D13–D20

Board yêu cầu dịch vụ mới chạy “đa cloud, zero downtime, rẻ hơn 30%” trong ba tháng. Hãy biến yêu cầu thành câu hỏi/assumption đo được, đề xuất options và recommendation, risk/RTO/RPO/SLO/cost model, phase/gate/exit criteria, cùng cách nói “không” có evidence nếu mục tiêu mâu thuẫn.
