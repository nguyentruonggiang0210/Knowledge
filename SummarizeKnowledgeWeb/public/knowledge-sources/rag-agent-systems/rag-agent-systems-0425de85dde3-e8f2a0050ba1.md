# Lesson 33 — Memory, state, context compaction và “Metis”

## Mục tiêu

Sau bài này, bạn có thể:

- phân biệt state, working context, short-term memory và long-term memory;
- chấm điểm memory theo relevance, freshness và importance trong token budget;
- compact context có chủ đích, giữ provenance và không biến summary thành “sự thật mới”;
- áp dụng pre-planning consultant pattern;
- xử lý đúng một tên gọi mơ hồ như “Metis” thay vì đoán.

## Bản chất và cách hoạt động

**State** là dữ liệu có thẩm quyền của workflow, ví dụ task nào đã chạy và artifact version nào đang được xét. **Context** là phần dữ liệu được đưa vào model ở một lượt. **Memory** là thông tin được lưu để có thể truy xuất lại; nó không tự động đúng, mới hay được phép sử dụng.

Pipeline memory điển hình:

```text
event -> classify/write -> store + provenance/TTL
query -> retrieve -> score(relevance, freshness, importance)
      -> filter permission -> compact -> context -> model
```

Compaction là phép nén mất mát. Summary phải liên kết về nguồn, giữ quyết định/ràng buộc quan trọng, đánh dấu thời điểm và cho phép bỏ/quên dữ liệu. Không dùng một transcript dài vô hạn như database.

**Pre-planning consultant pattern:** trước khi planner tạo kế hoạch, một bước chỉ-đọc truy xuất memory liên quan và trả “ràng buộc, rủi ro, câu hỏi còn thiếu”. Planner chính chịu trách nhiệm chọn kế hoạch; consultant không được âm thầm thực thi tool hoặc sửa state. Pattern này giảm việc quên quy ước dự án nhưng cần chống memory poisoning.

### “Metis” không phải thuật ngữ AI phổ quát

Không có một khái niệm chuẩn duy nhất tên “Metis” trong AI/coding agents. Phải yêu cầu URL/repository/câu gốc trước khi diễn giải. Các dự án khác nhau đã xác nhận gồm:

- [colliery-io/metis](https://github.com/colliery-io/metis): project planning/memory dạng file cho coding agents, với Vision → Initiative → Task, MCP và code index.
- [Wholiver/metis](https://github.com/Wholiver/metis): một coding agent terminal/desktop riêng có Plan/Build, durable memory, recovery và delegation.
- [Arm Metis](https://github.com/arm/metis): framework agentic AI cho security code review.
- [Metis Layer](https://www.metislayer.com/): design-system/UI tooling qua MCP.
- [MemTensor/Metis](https://github.com/MemTensor/Metis): research preview về memory foundation model.
- [Metis: Bridging Text and Code Memory for Self-Evolving Agents](https://arxiv.org/abs/2606.24151): nghiên cứu về memory phân cấp với biểu diễn text và code.

Ngoài ra có thể là `METIS` graph partitioner hoặc lỗi gõ của “metrics”. Giáo trình dùng Metis làm bài học về disambiguation, không coi nó là một building block bắt buộc.

## Khi nào dùng / không dùng

**Dùng memory khi:** người dùng cho phép cá nhân hóa qua nhiều phiên; dự án có decision/rule lâu dài; agent cần phục hồi task; retrieval có tiêu chí freshness và quyền rõ.

**Không dùng hoặc phải hạn chế khi:** dữ liệu nhạy cảm không có consent/retention policy; nguồn không đáng tin; state giao dịch cần consistency mạnh; một request độc lập không cần lưu; summary không thể truy ngược provenance.

## Ví dụ thực tế

Trước khi lập kế hoạch sửa payment service, consultant truy xuất quy tắc idempotency và cấm ghi API key vào log. Context selector ưu tiên memory liên quan/mới/quan trọng, còn các ghi chú ít liên quan được compact thành summary có ID nguồn. Planner nhận advice nhưng chưa thực thi hành động nào.

## Lệnh chạy

```powershell
python Lessions/33-memory-state-compaction-metis/src/demo.py
```

Demo offline và chỉ dùng Python standard library.

## Bài tập

1. Thêm tenant/user scope và chứng minh memory của tenant A không lọt sang B.
2. Thêm TTL; memory hết hạn không được chọn dù lexical relevance cao.
3. Lưu provenance cho từng câu summary và viết hàm mở lại nguồn.
4. Tạo một poisoned memory và thêm trust score/quarantine trước consultant.
5. Chọn một dự án “Metis” ở trên, đọc README gốc và giải thích tại sao nó không đồng nghĩa các dự án còn lại.

## Checklist hoàn thành

- [ ] Tôi phân biệt state, context và memory.
- [ ] Tôi hiểu compaction là lossy và cần provenance.
- [ ] Consultant không tự ý thực thi hoặc đổi state.
- [ ] Tôi không dùng “Metis” như thuật ngữ chung khi thiếu ngữ cảnh.
- [ ] Tôi chạy demo và giải thích ba thành phần của memory score.

## Bài trước / bài sau

- Bài trước: [Lesson 32 — Agent harness runtime](../32-agent-harness-runtime/README.md)
- Bài sau: [Lesson 34 — Multi-agent orchestration](../34-multi-agent-orchestration/README.md)
