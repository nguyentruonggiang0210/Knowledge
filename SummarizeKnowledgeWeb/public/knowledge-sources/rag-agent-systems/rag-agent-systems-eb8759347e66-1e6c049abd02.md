# Lesson 30 — Tool calling, bounded agent loops và workflows

## Mục tiêu

Bạn sẽ định nghĩa typed tool schema, validate arguments, dispatch tool an toàn và xây agent loop có state, step budget, stop condition và kết quả kiểm chứng được.

## Bản chất và cách hoạt động

Tool calling gồm model đề xuất tên tool/arguments và application quyết định có thực thi hay không. Schema chỉ là contract; controller vẫn phải validate kiểu/range, authorization, timeout, idempotency và output.

Agent loop quan sát state, chọn action, chạy tool, thêm observation rồi lặp. Loop production bắt buộc có max steps/time/cost, allowlist, checkpoint và termination rõ. Model nói “đã xong” không phải bằng chứng; verifier hoặc trạng thái hệ thống mới là nguồn đúng.

Workflow có đường đi do code xác định và thích hợp quy trình ổn định. Agent phù hợp khi không biết trước chính xác bước nào cần dùng. Có thể đặt agent bên trong một bước workflow có kiểm soát.

## Khi dùng

- Tra cứu rồi hành động nhiều bước, coding/research agent.
- Tool selection phụ thuộc observation trung gian.
- Có verifier và giới hạn rủi ro rõ.

## Khi không dùng

- Không dùng agent cho CRUD một bước đã biết trước.
- Không trao tool ghi/xóa dữ liệu mà thiếu approval và idempotency.
- Không cho loop vô hạn hoặc chấp nhận tool name/argument tùy ý.

## Ví dụ thực tế

Agent kho kiểm tra SKU, thấy tồn kho thấp rồi tạo đề nghị nhập thêm. Tool đọc và tool có side effect đều dùng schema. Controller dừng sau kết quả cuối hoặc khi hết step budget.

## Demo

~~~powershell
python .\Lessions\30-tool-calling-agent-loop-workflows\src\demo.py
~~~

## Bài tập

1. Thêm idempotency key cho tool tạo đề nghị.
2. Thêm approval gate nếu quantity vượt 20.
3. Persist checkpoint JSON sau mỗi observation.
4. Đo task success, tool error, steps và duplicated side effect.

## Checklist

- [ ] Tool name nằm trong allowlist.
- [ ] Argument exact-schema, kiểu/range được validate fail-closed.
- [ ] Side effect có idempotency/approval/audit.
- [ ] Loop có step/time/cost budget và stop reason.
- [ ] Final answer được đối chiếu với observation/verifier.

## Bài trước và bài sau

- Bài trước: Lesson 29 — advanced RAG, document parsers và GraphRAG.
- Bài sau: Lesson 31 — agent patterns, memory/harness theo lộ trình tổng.
