# Đáp án DevOps, Delivery, SRE và Observability

> Mỗi mục lặp nguyên mã và câu hỏi trong `devops_observability.md`. Phần “Điểm Senior” nhấn mạnh bằng chứng, trade-off và khả năng vận hành ở quy mô production.

## 1. CI/CD và release engineering

### DO-001 [Middle]

**Câu hỏi:** Continuous Integration, Continuous Delivery và Continuous Deployment khác nhau như thế nào?

**Trả lời:** CI là tích hợp thay đổi nhỏ thường xuyên vào nhánh chung, được build và kiểm thử tự động để phát hiện lỗi sớm. Continuous Delivery bảo đảm mỗi thay đổi đạt chuẩn luôn ở trạng thái có thể phát hành, nhưng production có thể cần quyết định thủ công. Continuous Deployment tự động đưa mọi thay đổi vượt gate đến production. Đây là ba mức năng lực liên quan, không chỉ là tên công cụ.

**Pitfall/trade-off:** Deploy tự động mà test, observability và rollback yếu chỉ làm sự cố nhanh hơn. Một approval thủ công mang tính hình thức không tự tạo an toàn.

**Điểm Senior:** Gắn mức tự động hóa với risk class, evidence của gate, lead time, change-failure rate và khả năng phục hồi.

### DO-002 [Middle → Senior]

**Câu hỏi:** Một pipeline backend tối thiểu nên có những stage/gate nào từ commit đến production?

**Trả lời:** Luồng điển hình: checkout nguồn xác định → restore dependency có khóa → lint/static analysis → build → unit test → security/license scan → đóng gói và tạo provenance/SBOM → integration/contract test → deploy môi trường thử → smoke/performance check phù hợp → promote cùng artifact → canary/production → post-deploy verification. Gate phải dựa trên risk: migration, auth hoặc payment cần kiểm tra mạnh hơn thay đổi tài liệu.

**Pitfall/trade-off:** Gate nối tiếp quá nhiều làm feedback chậm và khuyến khích batch lớn; parallelize test độc lập, tách fast PR checks khỏi kiểm tra sâu định kỳ nhưng không bỏ evidence bắt buộc.

**Điểm Senior:** Thiết kế fail-fast, artifact bất biến, quyền tối thiểu, metric theo từng stage và rollback/roll-forward đã diễn tập.

### DO-003 [Senior]

**Câu hỏi:** “Build once, promote the same artifact” giải quyết rủi ro gì? Config theo môi trường được đưa vào lúc nào?

**Trả lời:** Build một lần tạo một digest bất biến rồi promote qua các môi trường, nên thứ được kiểm thử chính là thứ chạy production; tránh compiler/dependency/time khác nhau hoặc chèn mã giữa các lần build. Config môi trường được inject lúc deploy/start/runtime qua config store, secret manager hoặc manifest riêng, không biên dịch lại binary/image. Mọi release record cần nối source commit, artifact digest và config revision.

**Pitfall/trade-off:** Runtime config có thể làm cùng artifact hành xử khác; phải schema-validate, audit, version và canary config. Front-end compile-time config cần thiết kế bootstrap/runtime config nếu muốn nguyên tắc này trọn vẹn.

**Điểm Senior:** Chứng minh promotion bằng digest/signature, kiểm soát config drift và rollback cả code lẫn cấu hình tương thích.

### DO-004 [Middle]

**Câu hỏi:** Artifact immutability, versioning và provenance giúp rollback/debug ra sao?

**Trả lời:** Immutability bảo đảm một version/tag không bị thay nội dung; version/digest định danh chính xác thứ được triển khai; provenance ghi ai/cái gì/từ source, builder và dependency nào đã tạo artifact. Nhờ đó rollback chọn đúng digest, so sánh release đáng tin và truy nguồn một binary tới commit/pipeline.

**Pitfall/trade-off:** Tag mutable như `latest` không đủ; semantic version cũng không chứng minh bytes. Rollback artifact vẫn có thể không tương thích schema/data/config hiện tại.

**Điểm Senior:** Enforce registry immutability, ký provenance, lưu deployment ledger và kiểm tra restore/rollback theo digest.

### DO-005 [Senior]

**Câu hỏi:** Làm sao xây build reproducible? Lockfile, pinned toolchain, hermetic build và timestamp ảnh hưởng thế nào?

**Trả lời:** Cùng source+input phải tạo output giống byte hoặc tương đương được định nghĩa. Commit lockfile và verify checksum; pin compiler/SDK/base image bằng version hoặc digest; build trong môi trường cô lập chỉ đọc input đã khai báo, không tải “latest” hay phụ thuộc máy host. Chuẩn hóa locale, timezone, file ordering, path và timestamp (`SOURCE_DATE_EPOCH` hoặc bỏ metadata biến đổi).

**Pitfall/trade-off:** Pin tuyệt đối tăng tính lặp lại nhưng làm bản vá bảo mật không tự đến; cần bot/update cadence. Reproducible không đồng nghĩa trustworthy nếu input/builder đã bị xâm nhập.

**Điểm Senior:** Build độc lập ở hai môi trường rồi so digest, tạo provenance và quản lý ngoại lệ non-deterministic có bằng chứng.

### DO-006 [Middle → Senior]

**Câu hỏi:** Pipeline cache và parallelism giảm thời gian build nhưng có thể tạo stale/poisoned cache hoặc flaky behavior ra sao?

**Trả lời:** Cache key phải bao gồm lockfile, toolchain, platform, flags và input liên quan; cache output không xác định hoặc dùng key quá rộng có thể trả kết quả cũ. PR không tin cậy ghi vào cache dùng chung có thể đầu độc build đặc quyền. Parallel test làm lộ shared database/port/time/global state, race và phụ thuộc thứ tự.

**Pitfall/trade-off:** Xóa toàn cache chữa triệu chứng nhưng mất tốc độ; cache nên content-addressed, scoped theo trust và read-only với fork. Test cần isolation, deterministic seed và retry chỉ để thu bằng chứng, không che flaky.

**Điểm Senior:** Theo dõi hit rate, correctness incident và flake rate; có cache-bypass verification định kỳ và quarantine với owner/deadline.

### DO-007 [Senior]

**Câu hỏi:** Ephemeral runner và long-lived runner khác nhau về tốc độ, isolation, secret exposure và bảo trì thế nào?

**Trả lời:** Ephemeral runner được tạo sạch cho job rồi hủy, giảm persistence/cross-job contamination và dễ pin image; đổi lại cold start và chi phí hạ tầng. Long-lived runner có warm cache/tooling nên nhanh, nhưng drift, malware persistence, secret/file sót và bảo trì patching cao hơn. Dù loại nào, job không tin cậy không nên cùng trust zone với release job.

**Pitfall/trade-off:** Container trên một host sống lâu chưa chắc isolation mạnh; Docker socket/host mounts có thể trao quyền host. Ephemeral runner vẫn có supply-chain và network exfiltration.

**Điểm Senior:** Phân tách runner pool theo trust, dùng short-lived identity, egress policy, immutable image và đo queue+cold-start để tối ưu.

### DO-008 [Middle]

**Câu hỏi:** Blue-green, rolling và recreate deployment khác nhau thế nào?

**Trả lời:** Blue-green chạy hai môi trường đầy đủ và chuyển traffic, rollback nhanh nhưng tốn gần gấp đôi tài nguyên và cần tương thích data. Rolling thay dần instance, tiết kiệm hơn và không downtime nếu capacity/readiness tốt, nhưng hai version cùng tồn tại. Recreate dừng bản cũ rồi khởi động bản mới, đơn giản nhưng có downtime.

**Pitfall/trade-off:** Chuyển traffic không rollback side effect/database; session local và connection dài làm cutover phức tạp. Rolling có thể làm client gặp phiên bản xen kẽ.

**Điểm Senior:** Chọn theo capacity, compatibility, state/session, RTO và kiểm chứng bằng health/readiness thay vì chỉ theo nền tảng.

### DO-009 [Senior]

**Câu hỏi:** Canary/progressive delivery chọn cohort, metric, thời gian quan sát và automated rollback ra sao?

**Trả lời:** Chọn cohort đại diện nhưng giới hạn blast radius: theo % traffic, tenant nội bộ, region/AZ hoặc request hash ổn định; tránh chỉ traffic “dễ”. So canary với control đồng thời trên error, latency tail, saturation và business KPI, có minimum sample size và cửa sổ đủ bắt warm-up/chu kỳ. Promotion theo bước; rollback tự động khi vượt guardrail có hysteresis và dữ liệu đủ tin cậy.

**Pitfall/trade-off:** Metric trung bình che lỗi cohort; low traffic làm kết luận giả. Rollback loop do telemetry trễ/noisy cần cooldown/manual override có audit.

**Điểm Senior:** Xử lý stateful migration, long-running job, feature flag và compatibility; đánh giá false-positive/false-negative của analysis.

### DO-010 [Senior]

**Câu hỏi:** Database migration được phối hợp với deploy application theo expand–contract như thế nào? Migration nào không nên chạy trong startup?

**Trả lời:** Expand thêm schema tương thích ngược (cột/table/index), deploy code có thể đọc/ghi cả dạng cũ-mới, backfill có checkpoint/throttle, chuyển read path rồi quan sát; chỉ contract/xóa cũ khi mọi version và rollback window đã qua. Migration dài, blocking DDL, data rewrite/backfill hoặc cần quyền cao không nên chạy đồng thời ở startup của mọi replica; dùng job một lần có lock, review và telemetry.

**Pitfall/trade-off:** `ADD NOT NULL`/rename/drop trực tiếp có thể khóa bảng hoặc phá bản cũ. Transaction DDL lớn tăng log/lock; rollback code không khôi phục data đã biến đổi.

**Điểm Senior:** Lập compatibility matrix N/N-1, đo lock/replication lag, có kill switch và validation theo từng phase.

### DO-011 [Middle → Senior]

**Câu hỏi:** Rollback code không đồng nghĩa rollback dữ liệu vì sao? Roll-forward phù hợp khi nào?

**Trả lời:** Code mới có thể đã ghi schema/format/state hoặc gửi side effect mà code cũ không hiểu; đảo binary không đảo payment, message hay migration. Roll-forward phù hợp khi data change không đảo an toàn, migration đã qua điểm không thể quay lại, hoặc bản vá nhỏ/rõ nhanh hơn khôi phục snapshot. Cần thiết kế backward/forward-compatible trước deploy.

**Pitfall/trade-off:** Database restore có thể mất giao dịch sau backup và cần phối hợp toàn hệ thống. Roll-forward dưới áp lực có thể thêm lỗi nếu không có mitigation/canary.

**Điểm Senior:** Phân loại reversible/irreversible change, dùng expand–contract, idempotency/outbox và diễn tập cả hai đường phục hồi.

### DO-012 [Middle]

**Câu hỏi:** GitOps là gì? Reconciliation và pull-based deployment thay đổi audit/security ra sao?

**Trả lời:** GitOps lưu desired state khai báo trong Git; controller trong cluster liên tục so sánh actual state và reconcile về desired state. Pull model giảm việc CI giữ credential ghi trực tiếp vào cluster; commit/PR cung cấp audit, review và rollback desired state. Controller vẫn là privileged principal và Git không tự là source of truth cho secret runtime.

**Pitfall/trade-off:** Revert Git có thể không đảo data/side effect; sửa tay sẽ bị reconcile ngược hoặc tạo drift. Repo bị chiếm quyền trở thành đường điều khiển production.

**Điểm Senior:** Bảo vệ branch/signature, giới hạn controller RBAC/scope, phát hiện drift và có break-glass được audit.

### DO-013 [Senior]

**Câu hỏi:** Quản lý secret trong CI/CD thế nào để tránh lộ qua log, forked PR, artifact hoặc environment variable?

**Trả lời:** Dùng workload identity/OIDC để lấy credential ngắn hạn, quyền theo job/environment; không cấp secret cho untrusted fork. Secret manager inject ở bước tối thiểu, masking chỉ là lớp phụ; tắt shell tracing, không đưa secret vào command line/cache/artifact/test report. Tách build không tin cậy khỏi signing/deploy và giới hạn egress.

**Pitfall/trade-off:** Masking không bắt encoded/substring/derived secret; environment variable có thể lộ qua dump hoặc child process. Secret đã lộ phải revoke/rotate, không chỉ xóa log.

**Điểm Senior:** Threat-model trust boundary, approval cho privileged job, audit access và tự động rotation/revocation khi pipeline compromise.

### DO-014 [Senior]

**Câu hỏi:** SBOM, artifact signing và verification chống supply-chain attack ở các điểm nào?

**Trả lời:** SBOM liệt kê component/version để tìm ảnh hưởng lỗ hổng và license nhưng không chứng minh artifact nguyên vẹn. Chữ ký/provenance gắn digest với identity builder/source; policy tại registry/deploy verify signer, digest, build workflow và attestation trước khi chạy. Dependency scanning, pinning và builder isolation bảo vệ các điểm khác trong chuỗi.

**Pitfall/trade-off:** Ký artifact độc hại vẫn cho chữ ký hợp lệ nếu builder/key bị chiếm; SBOM thiếu/không khớp vô dụng. Key dài hạn trong CI là mục tiêu lớn, ưu tiên keyless/short-lived identity và transparency log khi phù hợp.

**Điểm Senior:** Xác định trust root, admission enforcement, revocation và diễn tập compromise thay vì chỉ “tạo SBOM”.

### DO-015 [Senior]

**Câu hỏi:** Policy-as-code có thể chặn cấu hình nguy hiểm nào? Làm sao có exception workflow mà không biến policy thành hình thức?

**Trả lời:** Policy có thể cấm image không ký/tag mutable, privileged/root container, host mount, public ingress, thiếu resource limit, secret plaintext, wildcard IAM hoặc region không được phép. Chạy sớm ở PR và enforce lại tại admission/deploy. Ngoại lệ phải scope hẹp theo resource/rule, có lý do, owner, approver độc lập, thời hạn tự hết và compensating controls.

**Pitfall/trade-off:** Policy quá cứng làm team bypass; quá nhiều warning không chặn tạo fatigue. Rule cần version, test fixture và rollout audit→warn→enforce.

**Điểm Senior:** Đo violation/exception age, tự động nhắc/hết hạn và review policy dựa trên incident/threat model.

### DO-016 [Middle → Senior]

**Câu hỏi:** Feature flag, canary và deployment strategy khác nhau về “deploy” so với “release” như thế nào?

**Trả lời:** Deploy đưa code/artifact vào môi trường; release cho người dùng tiếp cận hành vi mới. Feature flag tách release khỏi deploy theo user/cohort và có kill switch logic; canary tăng dần exposure của cả version hoặc feature để đo; blue-green/rolling là cách thay hạ tầng/version. Chúng bổ sung nhau chứ không thay thế hoàn toàn.

**Pitfall/trade-off:** Flag tạo nhiều tổ hợp code, nợ cleanup và có thể là quyền truy cập nhạy cảm; cần owner/expiry/audit. Kill switch không giúp nếu schema/side effect không tương thích.

**Điểm Senior:** Thiết kế flag fail-safe, cohort ổn định, telemetry theo variant và xóa flag sau rollout.

## 2. SRE, SLO và resilience

### DO-017 [Middle]

**Câu hỏi:** SLI, SLO, SLA và error budget khác nhau như thế nào?

**Trả lời:** SLI là phép đo trải nghiệm đáng tin cậy, như tỷ lệ request tốt hoặc latency dưới ngưỡng. SLO là mục tiêu nội bộ cho SLI trong cửa sổ thời gian. SLA là cam kết kinh doanh/pháp lý và hệ quả khi vi phạm. Error budget là phần không đạt được phép: với SLO 99,9%, budget là 0,1% eligible events trong cửa sổ.

**Pitfall/trade-off:** Uptime hạ tầng không nhất thiết là success người dùng; đặt SLO 100% làm mất khả năng thay đổi và thường phi thực tế. SLA không nên chặt hơn năng lực/SLO nội bộ thiếu margin.

**Điểm Senior:** Dùng budget để điều tiết tốc độ release và reliability work, với policy đã thống nhất trước sự cố.

### DO-018 [Senior]

**Câu hỏi:** Chọn SLI availability/latency đúng theo góc nhìn người dùng thế nào? Vì sao average latency thường gây hiểu lầm?

**Trả lời:** Xác định event người dùng thật sự quan tâm và điều kiện “good”: request hợp lệ trả kết quả đúng trong ngưỡng, đo ở biên gần user nhất; tách endpoint/tenant/class quan trọng nếu kỳ vọng khác. Latency dùng distribution hoặc tỷ lệ dưới threshold, vì trung bình che tail—99 request nhanh có thể che một request cực chậm.

**Pitfall/trade-off:** P99 trên traffic ít rất nhiễu và percentile không cộng trực tiếp qua service; client cancellation/timeout phải được phân loại nhất quán. Loại bỏ lỗi dependency khỏi denominator có thể tô hồng trải nghiệm.

**Điểm Senior:** Định nghĩa numerator/denominator, missing data, cửa sổ, low-traffic và kiểm chứng SLI tương quan với support/business impact.

### DO-019 [Senior]

**Câu hỏi:** Multi-window, multi-burn-rate alert phát hiện tiêu hao error budget tốt hơn threshold tĩnh ra sao?

**Trả lời:** Burn rate là tốc độ tiêu budget so với tốc độ cho phép. Kết hợp cửa sổ ngắn+dài ở burn cao bắt sự cố lớn nhanh nhưng yêu cầu duy trì, và cặp cửa sổ dài hơn ở burn thấp bắt suy giảm âm ỉ. Alert gắn trực tiếp nguy cơ hết budget, ít page vì spike ngắn hơn threshold error-rate tĩnh.

**Pitfall/trade-off:** SLI/denominator sai làm burn alert sai; low traffic cần minimum events. Missing telemetry không được mặc định là healthy.

**Điểm Senior:** Chọn hệ số/cửa sổ từ SLO window và response time mong muốn, backtest trên incident lịch sử rồi điều chỉnh noise.

### DO-020 [Middle → Senior]

**Câu hỏi:** Bốn golden signals, RED và USE method áp dụng cho lớp nào của hệ thống?

**Trả lời:** Golden signals: latency, traffic, errors, saturation ở mức service/hệ thống. RED (Rate, Errors, Duration) phù hợp request-driven service/endpoint. USE (Utilization, Saturation, Errors) phù hợp resource như CPU, disk, network, thread/connection pool. Chúng là checklist khởi đầu, không thay business SLI.

**Pitfall/trade-off:** CPU utilization thấp không loại trừ saturation ở lock/pool; rate cao không nói request có giá trị. Thu mọi metric mà không có câu hỏi chỉ tăng chi phí.

**Điểm Senior:** Nối symptom ở RED/golden signal xuống USE của dependency/resource và xây drill-down theo causal hypothesis.

### DO-021 [Senior]

**Câu hỏi:** Capacity planning dùng demand forecast, headroom và saturation signal thế nào? Khi nào autoscaling không cứu được hệ thống?

**Trả lời:** Dự báo demand theo trend/season/event, đo capacity mỗi instance ở SLO target và giữ headroom cho burst, failover, deploy và forecast error. Scale theo leading signal phù hợp như queue age/concurrency cùng saturation, xét startup delay và quota. Autoscaling không cứu bottleneck không scale được (DB/partition/lock), resource đã hết quota, dependency chậm, image cold-start lâu hoặc traffic tăng nhanh hơn phản ứng.

**Pitfall/trade-off:** Scale theo CPU đơn lẻ có thể oscillate hoặc bỏ I/O-bound saturation; thêm replica có thể khuếch đại tải DB. Headroom quá cao tốn chi phí nhưng quá thấp mất resilience.

**Điểm Senior:** Load test để dựng capacity curve, đặt max-safe concurrency/load shedding và diễn tập AZ loss.

### DO-022 [Senior]

**Câu hỏi:** Reliability budget nên được phân bổ qua chuỗi dependency như thế nào? Availability của các dependency nối tiếp tác động ra sao?

**Trả lời:** Với dependency nối tiếp bắt buộc và giả định độc lập, availability end-to-end xấp xỉ tích các availability, nên mỗi hop phải tốt hơn mục tiêu tổng hoặc có redundancy/degradation. Phân bổ budget theo criticality và contribution đo được; giảm số dependency synchronous, cache/fallback hoặc async hóa để tách failure domain.

**Pitfall/trade-off:** Failure thường tương quan (cùng cloud/identity/network), nên phép nhân độc lập có thể lạc quan. Retry không tạo reliability miễn phí và có thể tiêu latency/error budget.

**Điểm Senior:** Dùng dependency map, fault-tree và telemetry để thương lượng contract; thiết kế graceful degradation và test failure modes.

### DO-023 [Senior]

**Câu hỏi:** Resilience test khác load, stress, soak và chaos test thế nào?

**Trả lời:** Load test xác nhận hành vi ở tải kỳ vọng; stress tìm điểm gãy/quá tải; soak chạy lâu để lộ leak/drift; resilience test xác nhận hệ thống giữ/degrade/phục hồi khi dependency, instance hoặc network lỗi. Chaos engineering là thực hành đưa fault có kiểm soát để kiểm chứng giả thuyết resilience trong môi trường ngày càng thật.

**Pitfall/trade-off:** Tạo fault mà không có steady-state hypothesis, abort condition và blast radius chỉ là phá hoại. Test tải không đại diện data distribution/cache sẽ cho capacity giả.

**Điểm Senior:** Định nghĩa invariant/SLO, quan sát recovery/RTO, chạy game day định kỳ và chuyển phát hiện thành automation/runbook.

### DO-024 [Senior]

**Câu hỏi:** Disaster recovery drill cần chứng minh backup restore, quyền truy cập, dependency và communication ra sao?

**Trả lời:** Drill phải restore bản sao thực vào môi trường cô lập, kiểm tra checksum/consistency và ứng dụng đọc được; đo RPO từ dữ liệu mất và RTO end-to-end. Xác nhận credential/key/DNS/IAM, quota/capacity, dependency ngoài, thứ tự khởi động và contact/vendor escalation đều dùng được khi vùng chính mất. Diễn tập quyết định, status communication và failback, không chỉ lệnh restore.

**Pitfall/trade-off:** “Backup job thành công” không chứng minh restore; runbook có secret/token hết hạn là vô dụng. Drill production cần blast radius và dữ liệu privacy rõ.

**Điểm Senior:** Thu evidence định kỳ, owner remediation có hạn, test restore tự động và cập nhật BIA/RTO-RPO sau mỗi drill.

### DO-025 [Middle → Senior]

**Câu hỏi:** Runbook tốt cần trigger, diagnosis, mitigation, verification, rollback và escalation gì?

**Trả lời:** Runbook nêu symptom/alert và phạm vi áp dụng; link dashboard/query/lệnh chẩn đoán an toàn; đưa mitigation theo thứ tự giảm blast radius, prerequisite và expected output. Mỗi bước thay đổi có cách verify, rollback và giới hạn thời gian. Có owner, quyền cần thiết, escalation/contact, communication template và thời điểm cập nhật.

**Pitfall/trade-off:** Lệnh copy-paste nguy hiểm phải có placeholder rõ, dry-run/approval và không nhúng secret. Runbook quá dài trong page khẩn cấp khó dùng; tách quick mitigation khỏi deep diagnosis.

**Điểm Senior:** Test runbook qua game day, đo time-to-mitigate/success và tự động hóa bước ổn định sau khi hiểu quy trình.

## 3. Log, metric, trace và profiling

### DO-026 [Middle]

**Câu hỏi:** Ba trụ cột log, metric, trace bổ sung nhau thế nào? Loại câu hỏi nào mỗi tín hiệu trả lời tốt nhất?

**Trả lời:** Metric trả lời “hệ thống có vấn đề không, mức độ/xu hướng thế nào” bằng dữ liệu tổng hợp rẻ để alert. Trace trả lời “một request đã đi qua đâu, thời gian/lỗi nằm ở span nào”. Log trả lời chi tiết sự kiện và context cục bộ để giải thích một trường hợp. Correlation qua service/resource/trace ID cho phép đi từ symptom đến request rồi sự kiện.

**Pitfall/trade-off:** Không tín hiệu nào thay thế correctness/business audit; log mọi thứ rất tốn, trace sampling bỏ mẫu và metric mất chi tiết. Telemetry không nhất thiết chỉ có ba loại—profile và event cũng quan trọng.

**Điểm Senior:** Bắt đầu từ câu hỏi/SLO, chọn signal có chi phí-cardinality phù hợp và thiết kế đường drill-down giữa chúng.

### DO-027 [Middle → Senior]

**Câu hỏi:** Structured logging nên có timestamp, level, event name, correlation và context nào? Vì sao không ghép chuỗi tự do?

**Trả lời:** Mỗi event nên có timestamp chuẩn+timezone, severity, tên/ID ổn định, service/version/environment, trace/span/request ID, operation/result và context domain đã allowlist; exception lưu kiểu/stack có cấu trúc. Message template với named fields cho phép query/aggregate và giữ schema, khác nối chuỗi làm mất field type, tăng cardinality/template và khó redact.

```text
OrderPaymentFailed order_id=… provider=… error_code=… trace_id=…
```

**Pitfall/trade-off:** Không log token, password, full body hoặc PII tùy tiện; high-cardinality field phù hợp log nhưng vẫn tăng index cost. Log level phải có semantics nhất quán.

**Điểm Senior:** Có schema/version, central redaction, sampling/rate limit và correlation xuyên async/message boundary.

### DO-028 [Senior]

**Câu hỏi:** Metric cardinality explosion xảy ra thế nào? Vì sao user ID/order ID không nên là label metric?

**Trả lời:** Mỗi tổ hợp label value tạo một time series; label không giới hạn như user/order/URL raw nhân series theo traffic, làm agent/backend tốn RAM, CPU, storage và query chậm hoặc bị drop. ID riêng lẻ thuộc log/trace; metric chỉ nên dùng dimension bounded, có giá trị tổng hợp như route template, status class, region hoặc operation.

**Pitfall/trade-off:** Hash ID thành bucket giảm nhưng không loại cardinality nếu bucket quá nhiều và khó diễn giải. `error_message`/stack cũng không phải label ổn định.

**Điểm Senior:** Đặt series budget, allowlist label, normalize route, monitor dropped series và review instrumentation trước rollout.

### DO-029 [Senior]

**Câu hỏi:** Counter, gauge, histogram và summary phù hợp cho đại lượng nào? Histogram bucket sai làm percentile vô nghĩa ra sao?

**Trả lời:** Counter tăng tích lũy cho request/bytes/errors và dùng rate; gauge là giá trị hiện tại có thể lên xuống như queue depth/temperature; histogram đếm observation theo bucket, cộng được qua instance và ước lượng percentile; summary thường tính quantile ở client theo cửa sổ và khó aggregate. Bucket phải bao quanh các ngưỡng SLO và phân giải vùng cần quyết định.

**Pitfall/trade-off:** Bucket quá rộng cho percentile thô; quá nhiều bucket nhân cardinality/cost. Average từ sum/count che tail; counter reset phải được query engine xử lý.

**Điểm Senior:** Thiết kế distribution từ SLO/data thực, kiểm tra bucket occupancy và không cộng percentile của từng instance.

### DO-030 [Middle → Senior]

**Câu hỏi:** Distributed trace truyền context qua HTTP/message như thế nào? Mất context ở async boundary biểu hiện ra sao?

**Trả lời:** Caller inject trace context chuẩn như W3C `traceparent`/`tracestate` vào HTTP headers hoặc message properties; receiver extract, tạo child/linked span rồi propagate tiếp. Baggage chỉ mang metadata nhỏ được kiểm soát. Mất context làm downstream tạo root trace mới, service map đứt và log không cùng trace ID; thường do custom client/consumer, background queue hoặc suppress execution context.

**Pitfall/trade-off:** Không tin baggage từ bên ngoài cho authorization và không đưa secret/PII; message fan-out/fan-in đôi khi cần span links thay quan hệ parent đơn.

**Điểm Senior:** Chuẩn hóa propagator, instrument producer/consumer, test boundary và theo dõi tỷ lệ orphan/root span bất thường.

### DO-031 [Senior]

**Câu hỏi:** Head-based và tail-based sampling khác nhau thế nào? Làm sao giữ error/slow trace mà kiểm soát chi phí?

**Trả lời:** Head sampling quyết định ở đầu trace bằng xác suất/rule sớm, rẻ và propagation nhất quán nhưng chưa biết kết quả nên có thể bỏ lỗi hiếm. Tail sampling buffer spans rồi quyết định khi thấy error, latency hoặc thuộc tính, giữ tín hiệu giá trị hơn nhưng cần state, thời gian chờ và tài nguyên collector. Kết hợp baseline probabilistic với ưu tiên error/slow/rare route và giới hạn rate.

**Pitfall/trade-off:** Tail sampler phải nhận đủ spans của trace (routing/load balancing đúng), nếu không quyết định sai; giữ 100% error khi outage có thể tự làm telemetry quá tải. Sampling trace không đồng nghĩa sampling metric.

**Điểm Senior:** Có telemetry budget, priority/rate cap, dấu hiệu dropped spans và adaptive/degraded policy khi collector bão hòa.

### DO-032 [Senior]

**Câu hỏi:** OpenTelemetry tách API, SDK, Collector và backend ra sao? Collector agent/gateway có trade-off nào?

**Trả lời:** API để code/library tạo telemetry trung lập; SDK cấu hình provider, sampler, processor và exporter trong process. Collector là proxy vendor-neutral nhận, xử lý, batch/filter/enrich và export OTLP đến backend lưu/query/alert. Agent/sidecar/daemon gần workload giảm hop, gắn metadata và cô lập tenant; gateway tập trung policy, tail sampling và egress nhưng là tầng cần scale/HA. Thực tế thường kết hợp agent→gateway.

**Pitfall/trade-off:** Collector không tự là backend lưu trữ; processor sai có thể mất/redact nhầm dữ liệu. Gateway tập trung có blast radius và tail sampling cần trace affinity.

**Điểm Senior:** Thiết kế buffering/retry/memory limiter, TLS/auth, multi-tenancy, capacity và self-observability của telemetry pipeline.

### DO-033 [Senior]

**Câu hỏi:** Exemplar hoặc correlation giữa metric–trace–log rút ngắn điều tra thế nào mà không đưa dữ liệu nhạy cảm vào telemetry?

**Trả lời:** Exemplar gắn một observation mẫu của histogram/counter với trace ID, cho phép từ spike/p99 trên metric mở trace cụ thể; trace/span ID trong structured log cho drill-down tiếp. Chỉ liên kết bằng opaque IDs và thuộc tính allowlist, giữ business identifiers nhạy cảm ở kho có kiểm soát hoặc token hóa, áp access/retention theo loại dữ liệu.

**Pitfall/trade-off:** Exemplar bị sampling nên không đại diện mọi request; trace ID không nên được dùng làm metric label. Correlation quá sâu có thể nối các tập dữ liệu thành PII mới.

**Điểm Senior:** Có data classification, redaction tại SDK/collector, RBAC/audit backend và test chống rò secret.

### DO-034 [Middle → Senior]

**Câu hỏi:** Log retention, indexing tier và sampling được chọn theo giá trị điều tra/compliance/cost ra sao?

**Trả lời:** Phân loại log: security/audit có retention và bất biến theo quy định; operational hot logs giữ index ngắn cho incident; dữ liệu cũ chuyển warm/cold object storage và rehydrate khi cần. Giữ error/security events đầy đủ có rate limit, sample debug/info lặp lại theo key hoặc dynamic policy; metric đếm tổng để biết phần đã sample.

**Pitfall/trade-off:** Sampling trước khi biết outcome có thể bỏ sự cố hiếm; retention dài tăng privacy/legal exposure và chi phí. Xóa index không chắc xóa archive/backup.

**Điểm Senior:** Định lượng ingest/query cost, recovery/search SLA, legal hold và tự động lifecycle; review định kỳ trường nào thực sự được dùng.

### DO-035 [Senior]

**Câu hỏi:** Continuous profiling bổ sung gì cho trace và metric? CPU, allocation, lock contention và wall-clock profile đọc khác nhau thế nào?

**Trả lời:** Profiling liên tục cho code-level stack distribution theo thời gian/release mà trace sampling và metric tổng hợp không cho thấy. CPU profile tìm nơi tiêu cycles; allocation profile tìm nơi tạo bytes/objects (không nhất thiết nơi giữ); contention tìm stacks chờ lock; wall-clock/off-CPU cho cả chạy và chờ I/O/sleep/lock, hữu ích khi CPU thấp nhưng latency cao.

**Pitfall/trade-off:** Sample bias, inlining/symbol thiếu và overhead làm diễn giải sai; allocation hotspot không đồng nghĩa leak—heap retention cần dump. Profile có thể chứa tên/stack nhạy cảm.

**Điểm Senior:** So profile theo version/cohort cùng tải, kết hợp trace/GC/thread metrics và xác nhận bằng benchmark.

### DO-036 [Senior]

**Câu hỏi:** Synthetic monitoring, Real User Monitoring và server-side telemetry cho các góc nhìn khác nhau nào?

**Trả lời:** Synthetic chạy hành trình chủ động từ vị trí/lịch định trước, phát hiện outage cả khi không có user và đo critical path ổn định. RUM đo trình duyệt/app thật theo device/network/geography, phản ánh trải nghiệm nhưng bị consent/ad-block/sampling. Server telemetry thấy nội bộ request/resource/dependency, chẩn đoán sâu nhưng có thể bỏ DNS/CDN/client rendering.

**Pitfall/trade-off:** Synthetic “happy path” không đại diện dữ liệu thật; RUM có privacy/cardinality và thiên lệch mẫu. Server 200 không bảo đảm giao diện dùng được.

**Điểm Senior:** Dùng chung journey/release dimensions, correlation hợp lệ và alert chủ yếu trên user-impact signal với kiểm tra chéo.

### DO-037 [Senior]

**Câu hỏi:** Một dashboard vận hành tốt nên dẫn từ symptom đến cause ra sao? Vì sao dashboard có quá nhiều chart là một rủi ro?

**Trả lời:** Bắt đầu bằng SLO/user impact, traffic và deploy annotations; tiếp theo breakdown theo service/region/version/route, rồi dependency và saturation; mỗi panel có đơn vị, ngưỡng, baseline và link sang trace/log/runbook. Quá nhiều chart không có hierarchy làm người trực bỏ sót tín hiệu, tăng cognitive load và tạo “màn hình trang trí” không gắn quyết định.

**Pitfall/trade-off:** Dashboard không thay alert và một view không phục vụ cả executive lẫn responder. Auto-refresh/ngưỡng sai có thể che time range hoặc aggregation.

**Điểm Senior:** Thiết kế theo câu hỏi điều tra, test bằng incident/game day và xóa panel không dẫn đến hành động.

## 4. Alert, incident và cải tiến

### DO-038 [Middle]

**Câu hỏi:** Một alert actionable cần owner, impact, threshold, duration và runbook thế nào?

**Trả lời:** Alert phải mô tả user/service impact, severity và owner/on-call route; condition gồm metric/query, threshold, duration/cửa sổ và scope; kèm dashboard, recent deploy, runbook với bước xác nhận/mitigation/escalation. Responder phải biết “việc gì cần làm ngay” và cách xác nhận hồi phục.

**Pitfall/trade-off:** Alert cho mọi spike gây fatigue; duration quá dài bỏ lỡ outage nhanh. Thiếu-data phải có policy, không mặc định OK.

**Điểm Senior:** Theo dõi precision, pages/action, MTTA và retire/tune alert sau incident; ưu tiên SLO/burn-rate.

### DO-039 [Senior]

**Câu hỏi:** Phân biệt symptom-based với cause-based alert. Khi nào page, ticket hoặc chỉ dashboard?

**Trả lời:** Symptom alert phản ánh trải nghiệm/SLO đang bị ảnh hưởng như error/latency cao; cause alert báo nguyên nhân/rủi ro như disk gần đầy hoặc replication lag. Page khi có tác động khẩn cấp, cần người can thiệp ngay và có hành động; ticket khi cần sửa trong giờ làm việc; dashboard cho chẩn đoán/context không cần thông báo.

**Pitfall/trade-off:** Page mọi cause tạo nhiều cảnh báo cho một incident; chỉ symptom có thể báo quá muộn với resource dự báo chắc chắn. Dedup/inhibition và ownership phải rõ.

**Điểm Senior:** Dùng symptom làm page chính, cause làm enrichment hoặc proactive ticket trừ failure sắp xảy ra, rồi đo actionability.

### DO-040 [Senior]

**Câu hỏi:** Trong incident lớn, Incident Commander, Operations, Communications và Scribe nên phân vai ra sao?

**Trả lời:** IC giữ bức tranh tổng thể, ưu tiên, phân công và quyết định/escalate, không tự sa vào gõ lệnh. Operations điều tra và thực thi thay đổi có peer/checkpoint. Communications cập nhật stakeholder/customer theo nhịp, rõ fact/unknown/next update. Scribe ghi timeline, giả thuyết, lệnh/quyết định và kết quả để handoff/postmortem. Có deputy nếu kéo dài.

**Pitfall/trade-off:** Nhiều người cùng ra lệnh gây xung đột; kênh chat ồn làm mất quyết định. Vai trò không nhất thiết bốn người ở incident nhỏ nhưng trách nhiệm vẫn cần rõ.

**Điểm Senior:** Thiết lập cadence, change log, safety approval, handoff/relief và tuyên bố kết thúc dựa trên verification.

### DO-041 [Middle → Senior]

**Câu hỏi:** Mitigation khác root-cause fix như thế nào? Vì sao nên khôi phục dịch vụ trước khi chứng minh hoàn toàn nguyên nhân?

**Trả lời:** Mitigation giảm tác động nhanh bằng rollback, disable feature, shed load, failover hoặc tăng capacity; root-cause fix loại nguyên nhân/hệ thống điều kiện về lâu dài. Trong outage, chi phí người dùng tiếp tục tăng và dữ liệu thường chưa đủ để chứng minh hoàn toàn; hành động đảo được, blast radius thấp giúp khôi phục rồi điều tra trong trạng thái ổn định.

**Pitfall/trade-off:** Mitigation có thể phá evidence hoặc tạo rủi ro mới; trước thay đổi nên chụp telemetry cần thiết, ghi lệnh và có rollback. Không tuyên bố nguyên nhân chỉ vì mitigation tương quan với hồi phục.

**Điểm Senior:** Chọn hành động theo expected impact/reversibility, time-box giả thuyết và tách workstream restore khỏi diagnosis.

### DO-042 [Senior]

**Câu hỏi:** Blameless postmortem vẫn bảo đảm accountability bằng cách nào? Action item tốt cần owner, deadline và verification gì?

**Trả lời:** Blameless giả định hành động hợp lý trong context để tìm điều kiện hệ thống, incentive và guardrail thiếu; không có nghĩa bỏ qua trách nhiệm hoặc hành vi cố ý. Timeline dựa bằng chứng, nêu contributing factors và điểm kiểm soát. Action item cụ thể, ưu tiên theo risk, có một owner, hạn, trạng thái, tiêu chí hoàn thành và cách kiểm chứng qua test/metric/drill.

**Pitfall/trade-off:** “Cẩn thận hơn/đào tạo lại” khó kiểm chứng; danh sách quá dài không được làm. Không dùng postmortem làm tài liệu kỷ luật nhưng vẫn xử lý vi phạm chính sách qua quy trình riêng.

**Điểm Senior:** Theo dõi action aging/effectiveness, chia sẻ học tập và kiểm tra recurrence/risk reduction thay vì chỉ đóng ticket.

### DO-043 [Senior]

**Câu hỏi:** Toil là gì? Đo và ưu tiên automation thế nào để không tự động hóa một quy trình vốn không cần tồn tại?

**Trả lời:** Toil là việc vận hành thủ công, lặp lại, có thể tự động, mang tính chiến thuật và tăng tuyến tính theo quy mô, ít giá trị bền vững. Đo giờ/tần suất, interruption, error/risk và growth; trước automation hỏi có thể xóa requirement, đơn giản hóa hệ thống hoặc chuyển ownership không. Ưu tiên theo thời gian hoàn vốn và giảm rủi ro.

**Pitfall/trade-off:** Automation hiếm dùng có chi phí xây/bảo trì lớn và tự động hóa quy trình sai chỉ làm sai nhanh hơn. Không coi mọi operations hoặc support là toil.

**Điểm Senior:** Đặt toil budget, chọn top recurring source, chuẩn hóa rồi tự động hóa có telemetry, owner và đường thao tác thủ công an toàn.

### DO-044 [Senior]

**Câu hỏi:** DORA metrics đo điều gì và dễ bị gaming/sử dụng sai như thế nào?

**Trả lời:** [Mô hình DORA hiện hành](https://dora.dev/guides/dora-metrics/) đo throughput bằng change lead time, deployment frequency và failed-deployment recovery time; đo instability bằng change fail rate và deployment rework rate. Chúng là outcome ở cấp team/service để tìm bottleneck và xu hướng, không phải điểm năng suất cá nhân. Gaming xảy ra khi chia deploy giả, đổi định nghĩa failure, bỏ hotfix khỏi mẫu hoặc tối ưu tốc độ bằng batch/risk không được đo.

**Pitfall/trade-off:** So xếp hạng giữa team có domain/risk khác nhau thiếu ý nghĩa; median đơn lẻ che distribution. Metric cần định nghĩa event/denominator nhất quán và ghép SLO, quality, security, well-being.

**Điểm Senior:** Dùng balanced scorecard, xem trend và value-stream experiment; audit dữ liệu nhưng tránh biến metric thành mục tiêu thưởng-phạt.

### DO-045 [Senior]

**Câu hỏi:** On-call rotation bền vững cần handoff, escalation, compensation, training và alert hygiene ra sao?

**Trả lời:** Rotation đủ người và múi giờ, lịch/handoff rõ về incident, change và risk đang mở; primary/secondary/escalation có contact và authority. Người mới shadow→reverse-shadow, game day và có runbook/access trước khi trực. Compensation/time-off và giới hạn page ngoài giờ giảm burnout; theo dõi page load/sleep interruption và dành capacity sửa alert/toil.

**Pitfall/trade-off:** On-call không quyền deploy/rollback chỉ là tổng đài; một chuyên gia luôn bị gọi là bus factor. Handoff bằng miệng dễ mất trạng thái.

**Điểm Senior:** Đặt SLO cho response nhưng cả guardrail sức khỏe, review mỗi page, tự động hóa lỗi lặp và điều chỉnh staffing theo dữ liệu.

## 5. Tình huống production

### DO-046 [Senior · Troubleshooting]

**Câu hỏi:** P99 latency tăng gấp 5 nhưng CPU trung bình bình thường. Hãy lập cây giả thuyết và chọn telemetry để kiểm tra.

**Trả lời:** Xác nhận metric theo route/region/version/cohort và traffic; CPU average thấp vẫn có thể một core throttled. Nhánh giả thuyết: downstream/DB/network chậm (trace spans, query plan, connection/DNS/TLS metrics); queue/pool/thread starvation (queue age, active/waiters, thread dump); lock/GC pause (contention/GC trace); cold instance/cache miss; payload/retry tăng. So control với release/config và lấy slow-trace exemplar/profile wall-clock.

**Pitfall/trade-off:** Đừng tăng timeout/retry trước khi biết bottleneck—sẽ tăng in-flight và tail. Aggregate p99 giữa instance có thể sai; kiểm tra histogram và clock.

**Điểm Senior:** Time-box giả thuyết, giảm blast radius bằng canary rollback/load shedding và xác nhận recovery bằng SLO chứ không chỉ CPU.

### DO-047 [Senior · Troubleshooting]

**Câu hỏi:** Container memory tăng chậm trong 3 ngày rồi bị OOMKilled. Bạn phân biệt leak, cache, fragmentation và workload growth thế nào?

**Trả lời:** Đối chiếu cgroup working set/RSS/limit với managed/native heap, live objects sau GC, allocation rate, GC count và request/cardinality. Heap snapshots theo thời gian+dominator/retention path cho managed leak; cache có key count/eviction và thường tương quan working set; live heap ổn nhưng RSS/committed cao gợi fragmentation/native allocator; tăng traffic/data/queue giải thích growth theo workload. Kiểm tra memory limit và OOM event.

**Pitfall/trade-off:** Ép GC hoặc restart chỉ mitigation, có thể xóa evidence; heap dump gần limit gây thêm memory và chứa PII. Pool/cache giảm allocation nhưng giữ RSS.

**Điểm Senior:** Capture profile an toàn trước OOM, đặt bounded cache/queue, canary fix và soak test dài hơn chu kỳ tái hiện.

### DO-048 [Senior · Troubleshooting]

**Câu hỏi:** Sau deploy, error rate chỉ tăng ở một AZ và trace bị thiếu span downstream. Bạn điều tra và giảm thiểu theo thứ tự nào?

**Trả lời:** Xác nhận scope theo AZ/version/instance và health dependency; ngừng rollout, rút AZ/canary lỗi khỏi traffic hoặc rollback nếu blast radius cho phép. So config, image digest, node/network/DNS/identity/quota và dependency endpoints giữa AZ. Span thiếu có thể do request chưa đến downstream, propagation/instrumentation lỗi hoặc collector/export path AZ lỗi; đối chiếu access log, metrics, message IDs và collector dropped/export errors.

**Pitfall/trade-off:** Thiếu trace không chứng minh downstream không được gọi. Fail traffic sang AZ khác có thể quá tải; kiểm tra headroom trước. Rollback app không chữa lỗi hạ tầng đồng thời.

**Điểm Senior:** Tách data-plane failure khỏi telemetry failure, giữ control group/evidence và chỉ đưa AZ lại sau soak+verification.

### DO-049 [Senior · Delivery]

**Câu hỏi:** Pipeline production mất 75 phút khiến team gom thay đổi lớn, rollback hiếm khi được thử. Hãy đề xuất lộ trình cải thiện có metric.

**Trả lời:** Đo critical path theo stage, queue, cache hit, flake/retry và test value; đặt baseline lead time, deploy frequency, change-fail/recovery. Làm fast feedback trước: parallel/shard test, cache đúng, runner capacity, loại duplicate, incremental/affected tests nhưng giữ suite sâu async. Build once, môi trường ephemeral, canary tự động và post-deploy SLO gates. Tạo one-click rollback theo digest, chạy drill định kỳ và yêu cầu compatibility migration.

**Pitfall/trade-off:** Cắt test để đạt thời gian làm tăng failure; tối ưu chỉ execution nhưng queue vẫn dài không giúp. Rollback tự động không an toàn với data change không đảo được.

**Điểm Senior:** Cải tiến từng bước có guardrail coverage/escape defects/CFR, mục tiêu giảm batch size và đo time-to-signal/time-to-recover, không chỉ tổng phút.

### DO-050 [Senior · Incident]

**Câu hỏi:** Một certificate sắp hết hạn trong 6 giờ ở hàng chục service. Bạn xử lý incident và thiết kế quy trình inventory/rotation/alert để tránh lặp lại ra sao?

**Trả lời:** Mở incident, xác định cert/chain/domain/consumer và blast radius từ inventory+scan; ưu tiên external/critical expiry, phân owner và freeze thay đổi xung đột. Renew qua CA đáng tin, kiểm tra SAN/chain/key, phân phối bằng secret system, reload/restart canary rồi kiểm tra handshake từ nhiều vantage point; rollout theo wave, giữ cert cũ trong overlap và theo dõi errors. Nếu không kịp, có kế hoạch traffic/failover và communication.

**Pitfall/trade-off:** Cấp cert mới nhưng service chưa reload hoặc trust chain/client pinning không nhận vẫn outage; copy private key qua chat là sự cố khác. Clock skew và cert trung gian cũng cần kiểm tra.

**Điểm Senior:** Xây inventory tự động theo endpoint+secret+owner, ACME/rotation trước hạn, cảnh báo nhiều tầng theo lead time, expiry SLO, drill và phát hiện orphan/unmanaged cert.

## 6. Câu hỏi kinh điển bổ sung — Basic đến Senior

### DO-051 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** `git merge` và `git rebase` khác nhau về lịch sử commit, conflict và an toàn khi làm việc trên branch đã chia sẻ thế nào?

**Trả lời:** Merge tạo commit nối hai ancestry, giữ lịch sử/commit IDs; rebase phát lại commit lên base mới, tạo commit IDs mới và lịch sử tuyến tính. Cả hai có thể conflict; rebase có thể xử lý conflict qua từng commit.

**Pitfall/trade-off:** Không rebase/force-push branch chung nếu chưa phối hợp vì người khác dựa ancestry cũ. Rebase local feature trước merge là workflow hợp lệ; merge giữ context branch tốt hơn. Lịch sử sạch không quan trọng hơn traceability và team convention.

### DO-052 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** `git revert`, `reset` và `cherry-pick` giải quyết tình huống nào? Thao tác nào phù hợp để hoàn tác commit đã lên shared branch?

**Trả lời:** Revert tạo commit mới đảo patch, an toàn cho shared history. Reset di chuyển branch/HEAD và tùy mode đổi index/worktree, phù hợp sửa local unpublished history. Cherry-pick áp patch của commit chọn sang branch hiện tại.

**Pitfall/trade-off:** Shared branch nên revert, không reset/force-push thông thường. Revert merge cần chọn parent; cherry-pick có thể duplicate ancestry/conflict và phải theo dõi original fix.

### DO-053 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Artifact repository nên quản version, retention, promotion, immutability và quyền publish/read thế nào để vừa truy vết được vừa không tăng storage vô hạn?

**Trả lời:** Repository nên tách snapshot/prerelease/release, cấm ghi đè release, lưu digest cùng source/provenance/SBOM và promote cùng artifact qua môi trường. Retention giữ release đang deploy, bản rollback, legal hold và bản được tham chiếu; snapshot cũ dọn theo age/count/quota bằng garbage collection reference-aware.

**Pitfall/trade-off:** Quyền publish/delete chỉ cho identity CI ngắn hạn; consumer chủ yếu read, artifact mới có quarantine/scan/signing. Xóa theo tuổi mù có thể mất rollback hoặc layer dùng chung; giữ vô hạn làm tăng cost và blast radius supply-chain.

### DO-054 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Smoke test, sanity test, regression test và acceptance test khác mục tiêu và thời điểm chạy thế nào?

**Trả lời:** Smoke kiểm nhanh build/deploy sống và critical path cơ bản; sanity kiểm hẹp thay đổi/fix cụ thể; regression bảo behavior cũ không hỏng; acceptance xác nhận business criteria/stakeholder expectation. Tên có thể khác giữa team nên scope/time/gate phải định nghĩa.

**Pitfall/trade-off:** Smoke sau deploy phải nhanh/actionable; regression sâu có thể chạy CI/định kỳ; acceptance không thay technical correctness/security test.

### DO-055 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Các log level Trace/Debug/Information/Warning/Error/Critical nên được dùng thế nào để log hữu ích mà không gây nhiễu?

**Trả lời:** Trace/Debug cho chi tiết chẩn đoán thường tắt/sample production; Information cho business/system event bình thường có giá trị; Warning là bất thường đã xử lý/degrade; Error là operation thất bại cần chú ý; Critical đe dọa process/service lớn.

**Pitfall/trade-off:** Không log cùng exception ở mọi layer, không dùng Error cho validation 4xx, và không đặt secret/PII. Level phải gắn event code/context/correlation; alert dựa symptom metric hơn đếm mọi Error log.

### DO-056 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Monitoring và observability khác nhau thế nào? Vì sao có dashboard không đồng nghĩa hệ thống dễ chẩn đoán?

**Trả lời:** Monitoring theo dõi câu hỏi/failure đã biết qua metric/check; observability là khả năng suy ra internal state và khám phá unknown-unknown từ output có context—log, metric, trace, profile. Dashboard chỉ là view; thiếu instrumentation, correlation, cardinality đúng và query/debug workflow thì không giúp root cause.

**Pitfall/trade-off:** Observability không phải thu mọi dữ liệu; thiết kế signal theo critical journey/SLO, sampling/retention/cost và test khả năng trả lời câu hỏi incident.

### DO-057 [Basic · Thường gặp]

**Câu hỏi:** Event được biến thành alert và được correlation thành incident như thế nào? Vì sao quan hệ event–alert–incident không phải 1:1?

**Trả lời:** Event là observation thô; rule tổng hợp theo window/baseline tạo alert khi có điều kiện đáng chú ý; correlation/dedup theo service, topology, time và symptom gom nhiều alert vào một incident có owner/timeline. Một incident có thể sinh hàng trăm alert, một alert có thể không thành incident, và incident cũng có thể do người dùng phát hiện trước telemetry.

**Pitfall/trade-off:** Correlation quá mạnh che nhiều sự cố độc lập; quá yếu tạo alert storm. Giữ raw evidence, cho phép split/merge incident, xác định primary symptom và cập nhật topology/runbook sau postmortem.

### DO-058 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** Configuration drift giữa dev, staging và production hình thành ra sao? Immutable environment và IaC giảm drift thế nào?

**Trả lời:** Drift đến từ click-ops/hotfix, package/image khác, config/secret không version, manual patch và dữ liệu/topology khác. IaC/declarative reconciliation, build-once-promote, pinned dependency và rebuild thay sửa máy giúp môi trường tái tạo/audit được.

**Pitfall/trade-off:** Không thể làm data/scale production giống hệt staging; contract/load test và production canary bù khoảng cách. Detect drift định kỳ và backport emergency change vào code.

### DO-059 [Middle · Thường gặp]

**Câu hỏi:** Manual approval trong pipeline khi nào là risk control thật và khi nào chỉ là “security theater” làm chậm flow?

**Trả lời:** Approval có giá trị khi approver có independent evidence, authority và quyết định risk cụ thể—ví dụ destructive migration/compliance segregation—với checklist/diff rõ. Click approve mọi lần không đọc thêm thông tin chỉ tăng queue/batch size.

**Pitfall/trade-off:** Tự động hóa policy/test cho risk lặp; dùng time-bound approval cho exceptional change và audit outcome. Đo wait time, rejection/finding rate để biết gate có giá trị.

### DO-060 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** Một CI build chỉ fail trên runner nhưng chạy được ở máy developer. Bạn khoanh vùng dependency, environment, timing, cache và resource ra sao?

**Trả lời:** So commit/toolchain/lockfile/OS/arch/env/timezone/locale; chạy cùng container/runner image và command sạch. Tắt cache, cố định seed/time, kiểm shared state/order/parallelism, network registry và CPU/memory/disk limit; giữ log/artifact/test report.

**Pitfall/trade-off:** “Rerun đến pass” che flaky; sửa bằng hermetic build, pinned dependency, isolated workspace và deterministic test. Chỉ tăng timeout/resource sau khi có evidence saturation.

### DO-061 [Middle · Thường gặp]

**Câu hỏi:** Hai pipeline deploy cùng một service/môi trường đồng thời có thể gây race gì? Thiết kế concurrency group, lock và superseding run ra sao?

**Trả lời:** Run cũ có thể hoàn tất sau run mới, ghi đè version/config; migration/traffic switch/rollback xen kẽ làm state không nhất quán. Serialize theo service+environment bằng concurrency group/lease, dùng deployment version/compare-and-set và idempotent reconcile.

**Pitfall/trade-off:** Có thể cancel queued/older run nhưng running migration không luôn hủy an toàn. Lock có TTL/owner và state verify; GitOps reconciler nên quyết định desired version thay imperative scripts tranh nhau.

### DO-062 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** Alert fatigue hình thành từ đâu? Bạn giảm noise mà không che mất incident thật bằng quy trình nào?

**Trả lời:** Nguồn là threshold quá nhạy, duplicate symptom/cause, transient không duration, alert không owner/action và dependency fan-out. Inventory page, đo precision/actionability, gộp/dedup theo incident, chuyển non-urgent sang ticket, dùng SLO burn-rate và fix root cause.

**Pitfall/trade-off:** Tắt hàng loạt theo cảm giác tạo blind spot. Thay đổi alert qua review/canary, backtest lịch sử, có expiry cho silence và theo dõi missed incident/page load.

### DO-063 [Senior · Thường gặp]

**Câu hỏi:** Severity level của incident nên dựa trên user impact, scope và urgency thế nào? Khi nào nâng/hạ severity và ai có quyền quyết định?

**Trả lời:** Severity rubric dùng critical journey, số/loại customer, data/security risk, SLO burn và thời gian/khả năng lan rộng—not độ khó kỹ thuật. Bất kỳ responder nên được phép nâng khi chưa chắc; Incident Commander xác nhận/điều phối, hạ khi impact ổn định và recovery verified.

**Pitfall/trade-off:** Tài khoản VIP nhỏ có thể vẫn severe; security/data event cần rubric riêng. Severity điều khiển role, communication cadence và escalation, không dùng đánh giá lỗi cá nhân.

### DO-064 [Senior · Thường gặp]

**Câu hỏi:** Nếu CI/CD control plane unavailable trong một incident production, quy trình break-glass deploy cần quyền, artifact, audit và thu hồi thế nào?

**Trả lời:** Có procedure được diễn tập: approval hai người theo severity, short-lived JIT credential, chỉ promote artifact đã ký/verify digest từ repository tin cậy, command/runbook hạn chế và log độc lập. Canary/health gate/rollback vẫn bắt buộc trong khả năng.

**Pitfall/trade-off:** Không build laptop hoặc chia sẻ admin key. Sau incident revoke session/credential, reconcile desired state về pipeline/Git, lưu evidence và review mỗi use; break-glass không thành đường deploy thường ngày.

### DO-065 [Senior · Thường gặp · Incident]

**Câu hỏi:** Phát hiện pipeline có thể đã bị compromise sau khi phát hành. Hãy containment, xác minh provenance, rotate identity và rebuild trust chain theo thứ tự nào?

**Trả lời:** Dừng publish/deploy và cô lập runner/cache nhưng giữ forensic evidence; inventory artifact/digest/env đã phát hành, revoke signing/deploy/registry/cloud tokens và giới hạn blast radius. Dùng provenance/log độc lập xác định source, builder, dependency và hành vi; rollback chỉ tới artifact đã chứng minh sạch.

**Pitfall/trade-off:** Artifact ký bởi builder bị chiếm không tự đáng tin. Rebuild runner từ image sạch, pin/verify dependency, rotate key từ root tin cậy, rebuild/re-sign artifacts và redeploy theo priority; theo dõi abuse và postmortem supply-chain controls.
