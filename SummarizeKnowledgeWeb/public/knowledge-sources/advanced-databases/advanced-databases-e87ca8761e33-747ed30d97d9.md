# Capstone — Rubric, checklist và đáp án kỳ vọng

Tổng 100 điểm. Điểm cao không bù được hard gate về correctness/an toàn. Rubric đánh giá bằng file và demo tái lập, không bằng slide mô tả.

## Hard gates

Nếu bất kỳ mục nào thất bại, capstone chưa đạt dù tổng điểm cao:

- [ ] inventory có thể âm hoặc hai request cùng idempotency key tạo hai business effects;
- [ ] business write và outbox intent không nguyên tử;
- [ ] retry batch làm serving revenue/order count double mà không phát hiện;
- [ ] latest state có thể chọn version cũ hoặc winner ngẫu nhiên khi conflict;
- [ ] không có restore/rebuild path đã thử;
- [ ] script reset có thể nhắm nhầm production/broad filesystem;
- [ ] chứa credential thật hoặc dữ liệu nhạy cảm.

**Vì sao:** đây là lỗi correctness/security/recoverability, không phải thiếu tối ưu. Production pitfall phổ biến là benchmark đẹp che mất semantics sai.

## 1. PostgreSQL correctness và concurrency — 20 điểm

| Điểm | Tiêu chí | Bằng chứng bắt buộc |
|---:|---|---|
| 4 | constraint/data types đúng | DDL + negative tests |
| 4 | reserve inventory nguyên tử | 20 concurrent requests, invariant = 0 violation |
| 4 | idempotency đúng scope | retry trước/sau timeout, chỉ một effect |
| 4 | transaction/outbox đúng boundary | code/SQL và crash timeline |
| 4 | lock/isolation/retry hợp lý | pg_locks/activity, 40001/deadlock handling |

**Đáp án kỳ vọng:** atomic conditional UPDATE hoặc row lock ngắn; unique (tenant, action, idempotency_key); order change + version + outbox trong cùng transaction; network publish ngoài transaction; retry toàn transaction cho serialization failure.

**Bẫy production cần bị trừ điểm:** SELECT rồi UPDATE tách rời; idempotency key global sai scope; giữ row lock khi gọi remote; retry statement cuối; thiếu timeout/rollback trước trả connection về pool.

## 2. PostgreSQL performance và operations — 15 điểm

| Điểm | Tiêu chí | Bằng chứng bắt buộc |
|---:|---|---|
| 4 | index theo access pattern | plan trước/sau, write/storage trade-off |
| 3 | keyset pagination/sargability | stable tie-break, time zone/range đúng |
| 3 | statistics/plan reasoning | estimate vs actual, skew test |
| 3 | vacuum/transaction observability | xact age, dead/HOT tuples, action |
| 2 | backup/restore | restore log và RPO/RTO đo được |

**Đáp án kỳ vọng:** composite index bắt đầu bằng tenant cho tenant-scoped access, half-open timestamp range, cursor đủ sort keys; ANALYZE/extended stats khi correlation; timeout theo role; restore sang instance tách biệt.

**Bẫy production:** ép planner, index mọi cột, tăng work_mem global, gọi replica là backup hoặc tin backup job chưa test restore.

## 3. ClickHouse schema và correctness — 20 điểm

| Điểm | Tiêu chí | Bằng chứng bắt buộc |
|---:|---|---|
| 4 | type/key/partition hợp workload | DDL + EXPLAIN indexes + rows read |
| 4 | duplicate/out-of-order | raw duplicate test + deterministic serving |
| 4 | aggregate state đúng | State/Merge query + reconciliation |
| 4 | late event/tombstone | test version order và delete semantics |
| 4 | retention/backfill | cutoff, no overlap/gap, rebuild path |

**Đáp án kỳ vọng:** time partition coarse đủ lifecycle; ORDER BY tenant/time/dimension theo workload; stable event_id + source_version; dedup event trước chọn latest aggregate; tombstone được xét sau latest; MV chỉ cho live, backfill theo ingestion cutoff.

**Bẫy production:** xem ORDER BY là unique; đưa version vào Replacing dedup key; filter is_deleted trước argMax; dùng scalar sum thay sumMerge; POPULATE đồng thời live ingest.

## 4. ClickHouse performance và operations — 15 điểm

| Điểm | Tiêu chí | Bằng chứng bắt buộc |
|---:|---|---|
| 4 | pruning/read amplification | parts/granules/read_rows trước-sau |
| 3 | batching/part health | rows per part, merge backlog |
| 3 | memory/approx trade-off | exact vs approximate benchmark |
| 3 | mutation/TTL safety | system.mutations/merges + capacity plan |
| 2 | query guardrail | per-workload limit/cancel demo |

**Đáp án kỳ vọng:** producer batching/async semantics rõ; skipping/projection chỉ sau benchmark; TTL/time partition cho lifecycle; query log/system tables là bằng chứng.

**Bẫy production:** OPTIMIZE FINAL định kỳ, tiny insert, thêm bloom filter cho giá trị xuất hiện mọi granule, tăng max_memory_usage toàn cluster hoặc nhìn CPU trung bình thay straggler.

## 5. Delivery, replay và reconciliation — 15 điểm

| Điểm | Tiêu chí | Bằng chứng bắt buộc |
|---:|---|---|
| 4 | at-least-once state machine | failure matrix bốn crash points |
| 3 | checkpoint/keyset/batching | code + restart demo |
| 3 | poison event/schema evolution | quarantine + replay path |
| 3 | reconciliation | window report và alert lag |
| 2 | backpressure | source/destination slowdown demo |

**Đáp án kỳ vọng:** checkpoint sau ack; retry stable event/batch identity; bad event không chặn toàn partition vô hạn; reconciliation dựa event identity/version và business aggregate; backpressure có bounded queue.

**Bẫy production:** tuyên bố exactly-once nhưng không chứng minh; checkpoint trước ack; dùng OFFSET; poison event retry vô hạn; raw retention ngắn hơn replay window.

## 6. Engineering quality và giải thích — 15 điểm

| Điểm | Tiêu chí | Bằng chứng bắt buộc |
|---:|---|---|
| 4 | setup tái lập/scoped reset | clean run trên Docker |
| 3 | benchmark khoa học | version, distribution, 3 runs, result equality |
| 3 | ADR/trade-off/rollback | ba decisions có phương án bị loại |
| 3 | runbook hành động được | symptom → query → decision → verify |
| 2 | security/least privilege | roles/secrets/PII policy |

**Đáp án kỳ vọng:** một reviewer mới clone có thể chạy; mỗi tối ưu có before/after và regression risk; runbook chứa exact query nhưng yêu cầu xác nhận target trước destructive action.

**Bẫy production:** chỉ có screenshot, seed không tái lập, benchmark kết quả khác nhau, reset toàn volume, password production trong Git hoặc runbook nói chung chung “check logs”.

## Failure drill checklist

### F1 — Lost acknowledgement

- [ ] destination thật sự đã nhận trước khi tạo timeout giả;
- [ ] retry cùng event_id;
- [ ] raw duplicate count tăng hoặc dedup block được giải thích;
- [ ] serving result không đổi;
- [ ] checkpoint cuối cùng tiến lên sau ack.

Điểm cốt lõi: không chấm theo raw có duplicate hay không; chấm theo contract idempotency và kết quả serving/reconciliation.

### F2 — Out-of-order/conflict

- [ ] versions 4,2,3,1 cho latest = 4 trước merge;
- [ ] cùng version/khác payload được detect;
- [ ] tie-break/quarantine rule deterministic;
- [ ] tombstone latest không làm version cũ sống lại.

### F3 — Worker crash

- [ ] claim có lease/attempt;
- [ ] row được retry sau expiry;
- [ ] hai worker không sở hữu đồng thời lease còn hạn;
- [ ] downstream effect idempotent.

### F4 — Backfill overlap

- [ ] phát hiện bucket lệch bằng reconciliation;
- [ ] xác định chính xác cutoff/domain bị overlap;
- [ ] rebuild shadow partition/table hoặc correction có chứng minh;
- [ ] verify rồi mới swap/drop;
- [ ] giữ rollback window.

### F5 — Query overload

- [ ] thấy query qua activity/query_log;
- [ ] xác định read/temp/memory/lock evidence;
- [ ] cancel đúng query_id/pid, không restart bừa server;
- [ ] guardrail theo role/user/workload;
- [ ] query hợp lệ khác vẫn chạy.

### F6 — Restore

- [ ] target container/database khác source;
- [ ] base backup + WAL/config/key cần thiết có đủ;
- [ ] verify count/checksum và business invariant;
- [ ] ghi duration, recovery point và gap;
- [ ] cleanup chỉ target restore.

## Query review checklist

### PostgreSQL

- [ ] actual rows × loops đã được đọc đúng;
- [ ] estimate lệch có kiểm tra stats/skew;
- [ ] index Cond khác Filter được phân biệt;
- [ ] sort spill/temp và heap fetches được ghi;
- [ ] UPDATE/DELETE analyze dùng rollback;
- [ ] index cost phía write/WAL/disk được nêu.

### ClickHouse

- [ ] partition parts và primary-key granules trước/sau được ghi;
- [ ] read_rows/read_bytes/result_rows/memory đều có;
- [ ] active parts và rows/part được theo dõi;
- [ ] State/Merge đúng type;
- [ ] consistency của FINAL/merge/mutation được nêu;
- [ ] hot tenant/shard skew được test.

## Cách tính kết quả

| Điểm | Xếp loại | Diễn giải |
|---:|---|---|
| dưới 60 | chưa đạt | correctness/operation còn khoảng trống lớn |
| 60–74 | đạt có điều kiện | chạy được nhưng cần review khi production hóa |
| 75–89 | tốt | quyết định có bằng chứng, failure path tương đối chắc |
| 90–100 | rất tốt | tái lập, đo tốt, giải thích trade-off và recovery rõ |

Phải đồng thời qua mọi hard gate và đạt ít nhất 60 điểm. Sau tự chấm, reviewer nên trừ 50% điểm của một tiêu chí nếu không tái hiện được từ môi trường sạch.

## Retrospective bắt buộc

Trả lời ngắn năm câu:

1. Giả định nào của bạn bị benchmark bác bỏ?
2. Bug nào chỉ xuất hiện khi retry/concurrency/skew?
3. Metric nào phát hiện sớm nhất?
4. Thao tác recovery nào còn thủ công và rủi ro nhất?
5. Nếu traffic tăng 10 lần, bottleneck đầu tiên dự kiến là gì và phép đo nào sẽ xác nhận?

Một câu trả lời tốt luôn tách fact đo được, inference và việc cần thử tiếp theo.
