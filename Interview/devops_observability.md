# DevOps, Delivery, SRE và Observability

Các câu hỏi tập trung vào khả năng đưa phần mềm đến production an toàn, quan sát được và phục hồi được. Câu trả lời Senior cần gắn pipeline/telemetry với rủi ro và SLO cụ thể.

## 1. CI/CD và release engineering

### DO-001 [Middle]
Continuous Integration, Continuous Delivery và Continuous Deployment khác nhau như thế nào?

### DO-002 [Middle → Senior]
Một pipeline backend tối thiểu nên có những stage/gate nào từ commit đến production?

### DO-003 [Senior]
“Build once, promote the same artifact” giải quyết rủi ro gì? Config theo môi trường được đưa vào lúc nào?

### DO-004 [Middle]
Artifact immutability, versioning và provenance giúp rollback/debug ra sao?

### DO-005 [Senior]
Làm sao xây build reproducible? Lockfile, pinned toolchain, hermetic build và timestamp ảnh hưởng thế nào?

### DO-006 [Middle → Senior]
Pipeline cache và parallelism giảm thời gian build nhưng có thể tạo stale/poisoned cache hoặc flaky behavior ra sao?

### DO-007 [Senior]
Ephemeral runner và long-lived runner khác nhau về tốc độ, isolation, secret exposure và bảo trì thế nào?

### DO-008 [Middle]
Blue-green, rolling và recreate deployment khác nhau thế nào?

### DO-009 [Senior]
Canary/progressive delivery chọn cohort, metric, thời gian quan sát và automated rollback ra sao?

### DO-010 [Senior]
Database migration được phối hợp với deploy application theo expand–contract như thế nào? Migration nào không nên chạy trong startup?

### DO-011 [Middle → Senior]
Rollback code không đồng nghĩa rollback dữ liệu vì sao? Roll-forward phù hợp khi nào?

### DO-012 [Middle]
GitOps là gì? Reconciliation và pull-based deployment thay đổi audit/security ra sao?

### DO-013 [Senior]
Quản lý secret trong CI/CD thế nào để tránh lộ qua log, forked PR, artifact hoặc environment variable?

### DO-014 [Senior]
SBOM, artifact signing và verification chống supply-chain attack ở các điểm nào?

### DO-015 [Senior]
Policy-as-code có thể chặn cấu hình nguy hiểm nào? Làm sao có exception workflow mà không biến policy thành hình thức?

### DO-016 [Middle → Senior]
Feature flag, canary và deployment strategy khác nhau về “deploy” so với “release” như thế nào?

## 2. SRE, SLO và resilience

### DO-017 [Middle]
SLI, SLO, SLA và error budget khác nhau như thế nào?

### DO-018 [Senior]
Chọn SLI availability/latency đúng theo góc nhìn người dùng thế nào? Vì sao average latency thường gây hiểu lầm?

### DO-019 [Senior]
Multi-window, multi-burn-rate alert phát hiện tiêu hao error budget tốt hơn threshold tĩnh ra sao?

### DO-020 [Middle → Senior]
Bốn golden signals, RED và USE method áp dụng cho lớp nào của hệ thống?

### DO-021 [Senior]
Capacity planning dùng demand forecast, headroom và saturation signal thế nào? Khi nào autoscaling không cứu được hệ thống?

### DO-022 [Senior]
Reliability budget nên được phân bổ qua chuỗi dependency như thế nào? Availability của các dependency nối tiếp tác động ra sao?

### DO-023 [Senior]
Resilience test khác load, stress, soak và chaos test thế nào?

### DO-024 [Senior]
Disaster recovery drill cần chứng minh backup restore, quyền truy cập, dependency và communication ra sao?

### DO-025 [Middle → Senior]
Runbook tốt cần trigger, diagnosis, mitigation, verification, rollback và escalation gì?

## 3. Log, metric, trace và profiling

### DO-026 [Middle]
Ba trụ cột log, metric, trace bổ sung nhau thế nào? Loại câu hỏi nào mỗi tín hiệu trả lời tốt nhất?

### DO-027 [Middle → Senior]
Structured logging nên có timestamp, level, event name, correlation và context nào? Vì sao không ghép chuỗi tự do?

### DO-028 [Senior]
Metric cardinality explosion xảy ra thế nào? Vì sao user ID/order ID không nên là label metric?

### DO-029 [Senior]
Counter, gauge, histogram và summary phù hợp cho đại lượng nào? Histogram bucket sai làm percentile vô nghĩa ra sao?

### DO-030 [Middle → Senior]
Distributed trace truyền context qua HTTP/message như thế nào? Mất context ở async boundary biểu hiện ra sao?

### DO-031 [Senior]
Head-based và tail-based sampling khác nhau thế nào? Làm sao giữ error/slow trace mà kiểm soát chi phí?

### DO-032 [Senior]
OpenTelemetry tách API, SDK, Collector và backend ra sao? Collector agent/gateway có trade-off nào?

### DO-033 [Senior]
Exemplar hoặc correlation giữa metric–trace–log rút ngắn điều tra thế nào mà không đưa dữ liệu nhạy cảm vào telemetry?

### DO-034 [Middle → Senior]
Log retention, indexing tier và sampling được chọn theo giá trị điều tra/compliance/cost ra sao?

### DO-035 [Senior]
Continuous profiling bổ sung gì cho trace và metric? CPU, allocation, lock contention và wall-clock profile đọc khác nhau thế nào?

### DO-036 [Senior]
Synthetic monitoring, Real User Monitoring và server-side telemetry cho các góc nhìn khác nhau nào?

### DO-037 [Senior]
Một dashboard vận hành tốt nên dẫn từ symptom đến cause ra sao? Vì sao dashboard có quá nhiều chart là một rủi ro?

## 4. Alert, incident và cải tiến

### DO-038 [Middle]
Một alert actionable cần owner, impact, threshold, duration và runbook thế nào?

### DO-039 [Senior]
Phân biệt symptom-based với cause-based alert. Khi nào page, ticket hoặc chỉ dashboard?

### DO-040 [Senior]
Trong incident lớn, Incident Commander, Operations, Communications và Scribe nên phân vai ra sao?

### DO-041 [Middle → Senior]
Mitigation khác root-cause fix như thế nào? Vì sao nên khôi phục dịch vụ trước khi chứng minh hoàn toàn nguyên nhân?

### DO-042 [Senior]
Blameless postmortem vẫn bảo đảm accountability bằng cách nào? Action item tốt cần owner, deadline và verification gì?

### DO-043 [Senior]
Toil là gì? Đo và ưu tiên automation thế nào để không tự động hóa một quy trình vốn không cần tồn tại?

### DO-044 [Senior]
DORA metrics đo điều gì và dễ bị gaming/sử dụng sai như thế nào?

### DO-045 [Senior]
On-call rotation bền vững cần handoff, escalation, compensation, training và alert hygiene ra sao?

## 5. Tình huống production

### DO-046 [Senior · Troubleshooting]
P99 latency tăng gấp 5 nhưng CPU trung bình bình thường. Hãy lập cây giả thuyết và chọn telemetry để kiểm tra.

### DO-047 [Senior · Troubleshooting]
Container memory tăng chậm trong 3 ngày rồi bị OOMKilled. Bạn phân biệt leak, cache, fragmentation và workload growth thế nào?

### DO-048 [Senior · Troubleshooting]
Sau deploy, error rate chỉ tăng ở một AZ và trace bị thiếu span downstream. Bạn điều tra và giảm thiểu theo thứ tự nào?

### DO-049 [Senior · Delivery]
Pipeline production mất 75 phút khiến team gom thay đổi lớn, rollback hiếm khi được thử. Hãy đề xuất lộ trình cải thiện có metric.

### DO-050 [Senior · Incident]
Một certificate sắp hết hạn trong 6 giờ ở hàng chục service. Bạn xử lý incident và thiết kế quy trình inventory/rotation/alert để tránh lặp lại ra sao?

## 6. Câu hỏi kinh điển bổ sung — Basic đến Senior

### DO-051 [Basic · ⭐ Rất thường gặp]
`git merge` và `git rebase` khác nhau về lịch sử commit, conflict và an toàn khi làm việc trên branch đã chia sẻ thế nào?

### DO-052 [Basic · ⭐ Rất thường gặp]
`git revert`, `reset` và `cherry-pick` giải quyết tình huống nào? Thao tác nào phù hợp để hoàn tác commit đã lên shared branch?

### DO-053 [Basic · ⭐ Rất thường gặp]
Artifact repository nên quản version, retention, promotion, immutability và quyền publish/read thế nào để vừa truy vết được vừa không tăng storage vô hạn?

### DO-054 [Basic · ⭐ Rất thường gặp]
Smoke test, sanity test, regression test và acceptance test khác mục tiêu và thời điểm chạy thế nào?

### DO-055 [Basic · ⭐ Rất thường gặp]
Các log level Trace/Debug/Information/Warning/Error/Critical nên được dùng thế nào để log hữu ích mà không gây nhiễu?

### DO-056 [Basic · ⭐ Rất thường gặp]
Monitoring và observability khác nhau thế nào? Vì sao có dashboard không đồng nghĩa hệ thống dễ chẩn đoán?

### DO-057 [Basic · Thường gặp]
Event được biến thành alert và được correlation thành incident như thế nào? Vì sao quan hệ event–alert–incident không phải 1:1?

### DO-058 [Middle · ⭐ Rất thường gặp]
Configuration drift giữa dev, staging và production hình thành ra sao? Immutable environment và IaC giảm drift thế nào?

### DO-059 [Middle · Thường gặp]
Manual approval trong pipeline khi nào là risk control thật và khi nào chỉ là “security theater” làm chậm flow?

### DO-060 [Middle · ⭐ Rất thường gặp]
Một CI build chỉ fail trên runner nhưng chạy được ở máy developer. Bạn khoanh vùng dependency, environment, timing, cache và resource ra sao?

### DO-061 [Middle · Thường gặp]
Hai pipeline deploy cùng một service/môi trường đồng thời có thể gây race gì? Thiết kế concurrency group, lock và superseding run ra sao?

### DO-062 [Middle · ⭐ Rất thường gặp]
Alert fatigue hình thành từ đâu? Bạn giảm noise mà không che mất incident thật bằng quy trình nào?

### DO-063 [Senior · Thường gặp]
Severity level của incident nên dựa trên user impact, scope và urgency thế nào? Khi nào nâng/hạ severity và ai có quyền quyết định?

### DO-064 [Senior · Thường gặp]
Nếu CI/CD control plane unavailable trong một incident production, quy trình break-glass deploy cần quyền, artifact, audit và thu hồi thế nào?

### DO-065 [Senior · Thường gặp · Incident]
Phát hiện pipeline có thể đã bị compromise sau khi phát hành. Hãy containment, xác minh provenance, rotate identity và rebuild trust chain theo thứ tự nào?
