# Lesson 32 — Agent harness runtime

## Mục tiêu

Sau bài này, bạn có thể:

- giải thích harness khác model, prompt, workflow và UI ở đâu;
- ghép model adapter, typed tools, controller loop, state và verifier;
- áp dụng allowlist, approval, step budget và trace;
- kiểm thử harness mà không phụ thuộc model/API thật.

## Bản chất và cách hoạt động

**Agent harness** là lớp runtime/scaffolding biến language model thành agent có thể làm việc: nó điều phối model call và tool call, quản lý state/context, áp dụng chính sách quyền, ghi trace và tiếp tục qua tác vụ nhiều bước. Model chỉ là một thành phần của hệ thống.

Một harness tối thiểu gồm:

```text
request -> context/controller -> model adapter -> action
                  ^                    |
                  |              typed tool call
                  +-- observation <- dispatcher <- policy/sandbox
                                      |
                               trace + verifier + budget
```

- **Model adapter** cô lập khác biệt API/model và trả action có kiểu.
- **Typed tool registry** khai báo tên, kiểu tham số và handler; mọi input phải được validate trước dispatch.
- **Controller** quản lý vòng lặp, state, retry, termination và ngân sách.
- **Policy boundary** giới hạn tool, đường dẫn, mạng và yêu cầu approval.
- **Trace** lưu quyết định/tool result để debug và eval.
- **Verifier** dùng test/invariant để quyết định hoàn tất; không tin câu tự báo “done”.

Harness thực tế còn có thread persistence, compaction, sandbox cấp hệ điều hành, MCP, subagents, telemetry và recovery. Demo chỉ mô phỏng các contract cốt lõi trong bộ nhớ, không phải security sandbox thật.

Tham khảo định nghĩa chính thức: [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/concepts/harness), [Claude Code hoạt động thế nào](https://code.claude.com/docs/en/how-claude-code-works), [Codex App Server](https://learn.chatgpt.com/docs/app-server) và [Codex sandboxing](https://learn.chatgpt.com/docs/sandboxing).

## Khi nào dùng / không dùng

**Dùng khi:** model cần đọc/ghi/chạy tool qua nhiều bước; cần audit, approval, retry, sandbox hoặc hỗ trợ nhiều model/client.

**Không nên dùng khi:** một hàm quyết định giải được bài toán; chỉ cần structured extraction một lần; hoặc chưa có threat model nhưng lại cấp shell/network rộng. Không tự xây harness production nếu một runtime đã được kiểm chứng đáp ứng đủ yêu cầu vận hành.

## Ví dụ thực tế

Demo có model adapter giả lập đọc `project/budget.txt`, gọi tool cộng hai số rồi trả `TOTAL=150`. Harness validate kiểu tham số, chỉ cho đọc đúng allowlist, giới hạn bốn bước, ghi trace và bắt verifier xác nhận kết quả. Một adapter cố lặp vô hạn chứng minh step budget chặn runaway loop.

## Lệnh chạy

```powershell
python Lessions/32-agent-harness-runtime/src/demo.py
```

Không cần API key, file ngoài hay kết nối mạng.

## Bài tập

1. Thêm typed tool `multiply(a: int, b: int)` và một model action sử dụng nó.
2. Thêm trạng thái `needs_approval` cho tool ghi file; không dùng boolean mặc định ngầm cho phép.
3. Thêm retry tối đa một lần cho lỗi tool tạm thời nhưng không retry lỗi policy.
4. Serialize trace thành JSON và xóa dữ liệu nhạy cảm trước khi ghi.

## Checklist hoàn thành

- [ ] Tôi phân biệt model với harness.
- [ ] Mọi tool argument được validate trước handler.
- [ ] Tôi tìm thấy allowlist, step budget, trace và verifier trong demo.
- [ ] Tôi giải thích được vì sao demo không phải sandbox thật.
- [ ] Tôi chạy được cả happy path và self-check bị từ chối.

## Bài trước / bài sau

- Bài trước: [Lesson 31 — Planning, reflection, verification](../31-planning-reflection-verification/README.md)
- Bài sau: [Lesson 33 — Memory, state, compaction và Metis](../33-memory-state-compaction-metis/README.md)
