# Lesson 34 — Multi-agent orchestration

## Mục tiêu

Sau bài này, bạn có thể:

- quyết định khi nào nên tách một task cho nhiều agent;
- mô hình hóa delegation bằng DAG, input/output contract và ownership;
- phát hiện dependency lạ, cycle/deadlock và xung đột ghi shared state;
- hợp nhất artifact theo bằng chứng thay vì ghép văn bản tùy ý.

## Bản chất và cách hoạt động

Multi-agent không có nghĩa là mở nhiều cửa sổ chat. Nó là bài toán distributed workflow thu nhỏ:

```text
goal -> supervisor -> task DAG -> workers
                 \-> contracts -> isolated artifacts
                                  -> validate -> merge -> final verifier
```

Supervisor phải chỉ rõ cho mỗi task: mục tiêu, context tối thiểu, dependency, output schema, quyền, budget và owner. Các task độc lập có thể chạy song song; task phụ thuộc phải đợi artifact hợp lệ. Shared mutable state gây race condition và khó audit, vì vậy nên ưu tiên artifact bất biến, namespace riêng và merge có kiểm tra.

Các failure mode chính:

- hai agent làm trùng việc hoặc ghi cùng artifact;
- cycle dependency làm cả nhóm chờ nhau;
- context bị mất khi handoff;
- worker báo hoàn thành nhưng vi phạm output contract;
- lỗi/ảo giác truyền qua nhiều tầng;
- token, latency và coordination overhead lớn hơn lợi ích song song;
- supervisor trở thành bottleneck hoặc “rubber-stamp” kết quả.

Demo chạy tuần tự để kết quả tái lập, nhưng các task trong cùng một batch biểu diễn công việc có thể chạy song song. Đây không phải scheduler phân tán thật.

## Khi nào dùng / không dùng

**Dùng khi:** bài toán có nhánh độc lập rõ ràng như code, test, security review; cần chuyên môn/quyền khác nhau; muốn cô lập context; lợi ích latency lớn hơn overhead phối hợp.

**Không nên dùng khi:** task nhỏ hoặc tuần tự chặt; nhiều worker phải liên tục sửa cùng file; chưa định nghĩa output contract; chi phí lỗi handoff cao; chỉ thêm agent để tạo cảm giác “suy nghĩ nhiều”.

## Ví dụ thực tế

Một release có worker `implementation` tạo patch summary và worker `security` tạo risk report. Cả hai độc lập ở batch đầu. Worker `integration` chỉ được chạy sau khi hai artifact pass schema. Demo cũng chứng minh cycle và hai task ghi cùng key đều bị từ chối.

## Lệnh chạy

```powershell
python Lessions/34-multi-agent-orchestration/src/demo.py
```

Demo offline, dùng Python 3.11+ standard library.

## Bài tập

1. Thêm retry riêng cho lỗi tạm thời, nhưng giữ cùng task ID/idempotency key.
2. Thêm `budget` cho từng worker và tổng budget của supervisor.
3. Cho hai worker tạo patch trên hai worktree giả lập rồi thiết kế merge conflict protocol.
4. Thêm verifier cuối không do worker tạo implementation tự chấm.

## Checklist hoàn thành

- [ ] Tôi mô tả được input/output contract của mỗi worker.
- [ ] Tôi phân biệt parallelism có ích với coordination overhead.
- [ ] DAG bị cycle/dependency lạ được phát hiện.
- [ ] Shared artifact có owner duy nhất hoặc merge strategy rõ.
- [ ] Tôi chạy demo và đọc các failure-case assertion.

## Bài trước / bài sau

- Bài trước: [Lesson 33 — Memory, state, compaction và Metis](../33-memory-state-compaction-metis/README.md)
- Bài sau: [Lesson 35 — MCP, skills, connectors và protocols](../35-mcp-skills-connectors-protocols/README.md)
