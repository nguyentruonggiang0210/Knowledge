# Bài 26 — Behavioral, leadership, resume deep dive và full interview loop

## Bar senior

Chứng minh scope/ownership/judgment/influence bằng evidence, không kể “team đã làm”. Tạo [story-bank template](../SourceSamples/26-interview-artifacts/story-bank-template.md), project deep dive và chạy full mock loop.

Vòng senior không chỉ technical. Amazon SDE III công khai cho biết loop cân bằng leadership với coding/system design; Microsoft cũng đánh giá competency/resume và khuyên STAR(R): [Amazon SDE III prep](https://amazon.jobs/content/en/how-we-hire/sde-iii-interview-prep), [Microsoft interview tips](https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html).

## 1. STAR(R) có senior signal

- **Situation:** context/scale/stakes ngắn, 15–20% thời gian.
- **Task:** trách nhiệm và constraint riêng của bạn.
- **Action:** 50–60%; quyết định, alternatives, data, stakeholder, disagreement, execution và course correction. Dùng “tôi” rõ, ghi team contribution đúng.
- **Result:** user/business/engineering metric, thời gian, quality, what did not improve.
- **Reflection:** điều học, systemic change, lần sau làm gì khác.

Không bịa metric. Nếu không có số tuyệt đối, dùng relative/baseline/error budget/lead-time hoặc qualitative evidence có nguồn.

## 2. Story bank tối thiểu

Chuẩn bị 8–10 chuyện có thể map chéo nhưng không dùng một chuyện cho mọi câu:

| Theme | Senior follow-up |
|---|---|
| delivery/impact | trade scope/time/quality; metric ownership |
| failure/bad decision | phát hiện, accountability, repair, prevention |
| production incident | stabilize, communicate, evidence, RCA/actions |
| disagreement/conflict | data, listening, decision mechanism, relationship |
| ambiguity | requirement/risk discovery, incremental decision |
| technical debt/migration | business case, sequencing, compatibility/rollback |
| influence without authority | stakeholder incentives, coalition, measurable adoption |
| mentoring | diagnosis, feedback, autonomy, outcome—not “tôi dạy” |
| cross-team/customer | contract/ownership/escalation/trust |
| security/quality pushback | risk framing, compromise, residual risk owner |

Mỗi chuyện có scale: users/QPS/data/team/dependencies/budget/SLO; quyết định kỹ thuật đủ sâu; personal contribution; negative consequence; lesson.

## 3. Câu hỏi khó và anti-pattern

- “Biggest failure”: không chọn lỗi giả (`tôi quá cầu toàn`); nêu responsibility và control được cải thiện.
- “Conflict”: không biến người khác thành villain; nói shared goal, evidence và decision closure.
- “Why Java after C#?”: nhấn mạnh transferable engineering judgment + JVM/Spring semantics đã học/lab, không hạ thấp stack nào.
- “Most complex project”: complexity phải cụ thể (scale/consistency/migration/organization), không chỉ nhiều microservices.
- “What would you change?”: strong senior có reflection thật, không bảo design cũ hoàn hảo.
- Confidentiality: ẩn company/customer/secret, dùng magnitude tương đối; không chia sẻ proprietary source/data.

## 4. Resume/project deep dive

Với mỗi bullet resume trả lời được:

```text
Problem/scale/SLO → baseline evidence → your decision
→ alternatives rejected → architecture/data/concurrency/security
→ rollout/migration/rollback → incident/failure mode
→ measured result → what you learned
```

Interviewer có thể đào 5 lớp “why”. Nếu ghi “reduced latency 60%”, phải biết measurement window, percentile, load, change isolation, trade cost/regression. Nếu ghi “designed microservices”, phải giải thích boundaries/data ownership/why not monolith/deployment/consistency/operations.

Chuẩn bị architecture diagram một trang (không mang nếu format cấm) và ba deep dives: toughest technical decision, incident, cross-team influence.

## 5. Communication trong technical round

- Hỏi clarification có mục đích, state assumptions rồi tiến; không hỏi từng chi tiết để trì hoãn.
- Think aloud ở decision points, không narrate từng ký tự.
- Khi nhận hint: acknowledge, integrate, verify; không defend sai solution.
- Nêu trade-off theo context; tránh “always/never”.
- Kết thúc bằng recap correctness/failure/next validation.
- Khi không biết: nói boundary kiến thức, derive từ principle và đề xuất cách verify; không bluff.

## 6. Full mock loop

Mô phỏng role target, không chỉ luyện phần thích:

1. Coding 45 phút.
2. Coding/LLD 45 phút.
3. Java/JVM/Spring/SQL production depth 60 phút.
4. HLD distributed system 60 phút.
5. Behavioral/project deep dive 45–60 phút.

Chấm 0–4 độc lập; pass khi mọi round ≥3. Không dùng tổng điểm cao để che một round 1–2. Mock interviewer ghi evidence/timestamp, không chỉ “ổn”. Sau loop chọn 3 failure pattern, remediate bằng drill rồi retest unseen prompt.

### Rubric Java/backend production-depth

| Dimension | Weight | 3/4 senior signal |
|---|---:|---|
| language/generics/collections | 15% | contract + Java-specific trap chính xác |
| JMM/concurrency | 15% | happens-before/invariant/capacity/cancel đúng |
| JVM/diagnostics | 10% | chọn artifact/công cụ từ triệu chứng |
| Spring/proxy/lifecycle | 10% | biết boundary auto-config/AOP/request |
| JPA/SQL/transaction | 15% | query shape, lock/isolation/failure rõ |
| API/security/testing | 10% | deny/validate/idempotency/test boundary |
| production scenario | 15% | failure chain, telemetry, mitigation/verify |
| reasoning/communication | 10% | derive, nêu assumption/trade-off, không bluff |

Hard fail nếu giải pháp phá data/concurrency/security invariant cơ bản mà không nhận ra, hoặc chỉ recite annotation/API nhưng không xử lý scenario.

### Rubric behavioral/project deep dive

| Dimension | Weight | 3/4 senior signal |
|---|---:|---|
| context/scope/stakes | 10% | scale và trách nhiệm đủ rõ |
| personal ownership/actions | 20% | phân biệt “tôi”/“team”, hành động cụ thể |
| judgment/trade-off | 20% | alternatives, risk và decision mechanism |
| execution/course correction | 15% | obstacle, feedback và adaptation thật |
| result/evidence | 15% | metric/baseline/consequence trung thực |
| influence/leadership | 10% | stakeholder/mentoring/cross-team impact |
| accountability/reflection | 10% | nhận phần sai, systemic learning |

Hard fail nếu bịa evidence, không xác định được contribution cá nhân sau follow-up, đổ lỗi hoặc vi phạm confidentiality. Với mỗi round: 0 sai/không signal; 1 cần gợi ý; 2 đạt happy path mức Middle; 3 độc lập đạt Senior; 4 strong-hire với ambiguity và hệ quả bậc hai.

## 7. Readiness scorecard

- 2 unseen coding problems/90 phút, compile/test/complexity đúng.
- Java/JMM/JVM/Spring/JPA/SQL random bank ≥80%, follow-up scenario không collapse.
- 1 LLD + 1 HLD ≥3/4, có consistency/failure/security/operations.
- 8–10 STAR(R) có metric, trong đó failure/conflict/incident/mentoring.
- Capstone demo có ADR, load/transaction/concurrency/security/telemetry evidence.
- 3 mock loops; loop gần nhất không round dưới 3; error category lặp đã giảm.

## 8. Company-specific adaptation

Trước lịch phỏng vấn:

- hỏi recruiter round/level/language/tool/system-design/behavioral format;
- map job description thành competency matrix, chọn P2 specialization (low latency, cloud, Kafka, search…);
- đọc product/engineering public material để hỏi câu chất lượng, không đoán internal architecture;
- map stories sang values/competencies bằng hành vi thật, không nhồi từ khóa;
- luyện coding bằng Java nếu role Java, dù công ty cho chọn C#: mục tiêu còn là chứng minh fluency.

## Quiz/self-review

1. Story result không có số tuyệt đối có dùng được?
2. “We migrated…” đủ chứng minh senior ownership?
3. Có thể bù behavioral 2/4 bằng coding 4/4?
4. Một story dùng cho 8 câu có tốt?

<details><summary>Đáp án/rubric</summary>

1. Có nếu có baseline/relative/qualitative evidence trung thực và cách đo rõ; không bịa.
2. Chưa; tách nhiệm vụ/quyết định/hành động/ảnh hưởng của bạn và credit team.
3. Thường không; full loop có independent signals/hard blockers.
4. Không; dễ shallow/rehearsed và thiếu breadth. Chuẩn bị portfolio story, reuse có chọn lọc.
</details>
