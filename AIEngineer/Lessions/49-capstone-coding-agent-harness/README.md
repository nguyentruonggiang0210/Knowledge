# 49 — Capstone: Coding Agent Harness có kiểm soát

## Bài toán

Xây coding agent nhận issue, hiểu repository, đề xuất patch, chạy test và chỉ báo hoàn thành khi verifier pass—đồng thời không ghi ngoài workspace, không phá thay đổi người dùng và không tự ý thực hiện hành động nguy hiểm.

## Kiến trúc bắt buộc

```text
task contract -> repository inventory -> context/search/AST
              -> planner -> bounded executor -> diff
              -> lint/type/test/security verifier -> deliver or iterate
                                     \-> trace/checkpoint/budget/approval
```

Model chỉ là một thành phần. Harness phải sở hữu policy, path resolution, tool schema, timeout, max steps/cost, dirty-worktree snapshot, exact patch, subprocess sandbox, network policy, approval gate, checkpoint và evidence. Model không được tự tuyên bố “xong”; exit code/test artifact quyết định.

## Khi nào dùng/không dùng

Coding agent hữu ích cho bug/feature/refactor có acceptance criteria kiểm chứng được. Autonomy cao chỉ phù hợp trong environment cô lập và quyền tối thiểu. Với migration production, secret rotation, delete dữ liệu hoặc release, luôn cần workflow/human authority riêng. Không gửi task mơ hồ rồi đánh giá bằng cảm giác.

## Chạy reference harness

```powershell
python Lessions/49-capstone-coding-agent-harness/src/demo.py
```

Demo tạo một repository fixture trong thư mục tạm, lấy hash trước edit, tìm function bằng AST, áp exact patch trong workspace, chạy test subprocess có timeout, ghi trace và từ chối path traversal. Không sửa repository thật.

## Eval suite bắt buộc

- 10–30 frozen tasks gồm bug, feature nhỏ, multi-file, ambiguous/no-change và malicious instruction.
- Functional pass rate, regression, diff size/quality, human interventions, unsafe tool calls, time và cost.
- Cùng commit, quyền, instruction và acceptance tests cho baseline/agent khác; chạy nhiều lần vì model có tính ngẫu nhiên.
- Hidden tests phải kiểm tra invariant chứ không khớp implementation cụ thể.

## Definition of Done

1. Workspace boundary được resolve và kiểm test path traversal/symlink.
2. Dirty files được detect; patch dùng expected hash và không overwrite silent.
3. Tool subprocess có allowlist, cwd cố định, timeout, output cap và no-secret environment.
4. Network mặc định off; mutation/release cần approval rõ.
5. Trace chứa plan/tool/result/exit code nhưng redact secret.
6. Verifier chạy formatter/lint/type/unit/integration theo risk.
7. Có checkpoint/resume, step/cost budget, failure taxonomy và postmortem.

## Bài tập mở rộng

Thêm symbol index, unified diff parser, git worktree cô lập, flaky-test detector và reviewer agent độc lập. Sau đó benchmark cùng task bằng các agent ở lesson 47; không tuyên bố công cụ nào tốt nhất nếu chưa có dữ liệu.

Tiên quyết: 05, 32, 36, 38, 44, 47. Bài sau: 50.

