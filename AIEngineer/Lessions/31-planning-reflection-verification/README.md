# Lesson 31 — Lập kế hoạch, phản tư và kiểm chứng

## Mục tiêu

Sau bài này, bạn có thể:

- phân biệt ReAct, plan–execute, router, critic và verifier;
- chia một yêu cầu thành các bước có dependency, điều kiện dừng và ngân sách;
- dùng phản tư để tìm giả thuyết lỗi nhưng dùng kiểm chứng quyết định để chốt kết quả;
- đặt test gate trước khi agent tuyên bố hoàn thành.

## Bản chất và cách hoạt động

Một agent đáng tin không chỉ “nghĩ lâu hơn”. Nó chuyển yêu cầu thành trạng thái có thể quan sát và kiểm tra:

1. **Plan:** xác định mục tiêu, giả định, bước làm, dependency và tiêu chí hoàn thành.
2. **Execute:** thực hiện từng bước, ghi observation thật từ tool thay vì tưởng tượng kết quả.
3. **Reflect:** critic đọc trace để phát hiện thiếu sót và đề xuất sửa kế hoạch. Critic cũng là thành phần có thể sai.
4. **Verify:** test, schema, checksum hoặc invariant quyết định artifact có đạt yêu cầu hay không.
5. **Stop/replan:** dừng khi gate đạt; nếu không thì replan trong giới hạn bước, thời gian và chi phí.

ReAct xen kẽ reasoning/action phù hợp khi môi trường thay đổi liên tục. Plan–execute hữu ích khi dependency rõ. Router chọn workflow/tool chuyên biệt. Critic tạo nhận xét mềm; verifier kiểm tra bằng bằng chứng máy đọc được. Không được dùng câu “có vẻ đúng” của critic thay cho test.

## Khi nào dùng / không dùng

**Dùng khi:** thay đổi nhiều file, điều tra lỗi nhiều giả thuyết, migration có thứ tự, tác vụ cần test/approval hoặc có chi phí sai cao.

**Không nên dùng khi:** phép biến đổi một bước đã có hàm quyết định; việc lập kế hoạch dài hơn chính công việc; không có observation mới để reflection dựa vào; verifier chỉ lặp lại lời model.

## Ví dụ thực tế

Agent sửa hàm tính tổng hóa đơn. Kế hoạch là đọc dữ liệu, tính subtotal, áp dụng giảm giá rồi định dạng kết quả. Critic có thể cảnh báo discount âm, nhưng gate cuối phải kiểm tra invariant số tiền và định dạng. Demo mô phỏng chính vòng đời này và cố ý cho thấy một plan sai dependency bị từ chối.

## Lệnh chạy

Từ thư mục gốc repository:

```powershell
python Lessions/31-planning-reflection-verification/src/demo.py
```

Demo chỉ dùng Python 3.11+ standard library, không gọi API hay mạng.

## Bài tập

1. Thêm bước tính thuế và một invariant “thuế không âm”.
2. Tạo executor trả observation lỗi ở bước `discount`, rồi cho planner sửa kế hoạch tối đa một lần.
3. Thay verifier bằng ba property test sinh từ danh sách giá trị biên.
4. Ghi trace cho cả plan ban đầu và plan sửa; giải thích vì sao không được xóa trace thất bại.

## Checklist hoàn thành

- [ ] Tôi phân biệt được critic với verifier.
- [ ] Tôi chỉ ra được điều kiện dừng và step budget.
- [ ] Tôi giải thích được vì sao observation phải đến từ tool/test thật.
- [ ] Tôi chạy demo và đọc hết các assertion.
- [ ] Tôi tự thêm ít nhất một failure case.

## Bài trước / bài sau

- Bài trước: [Lesson 30 — Tool calling, agent loop và workflow](../30-tool-calling-agent-loop-workflows/README.md)
- Bài sau: [Lesson 32 — Agent harness runtime](../32-agent-harness-runtime/README.md)
