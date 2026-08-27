# Bộ tự kiểm tra Terraform – OCI làm nền tảng chính

Thư mục này giúp bạn **tự kiểm tra**, không thay thế việc thực hành trong `Lessions`. Câu hỏi đi từ nền tảng Terraform đến vận hành production và thiết kế ở mức expert. Oracle Cloud Infrastructure (OCI) là cloud chính; những câu hỏi đa cloud chỉ kiểm tra tư duy portable, không yêu cầu thuộc lòng toàn bộ tên resource AWS/Azure.

## Cấu trúc

```text
Quiz/
├── README.md
├── lesson-map.md
├── question-bank.md
├── levels/
│   ├── 01-foundation.md
│   ├── 02-core.md
│   ├── 03-oci.md
│   ├── 04-production.md
│   └── 05-expert.md
├── answers/
│   ├── 01-foundation-answers.md
│   ├── 02-core-answers.md
│   ├── 03-oci-answers.md
│   ├── 04-production-answers.md
│   └── 05-expert-answers.md
├── practical/
│   ├── capstone-oci.md
│   └── capstone-rubric.md
└── templates/
    └── answer-sheet.md
```

## Cách dùng đề xuất

1. Đọc bài tương ứng trong `Lessions` và tự chạy ví dụ.
2. Mở đề trong `levels/`, sao chép `templates/answer-sheet.md`, rồi làm bài **không mở** `answers/`.
3. Với câu giải thích/tình huống/debug, viết cả lập luận và lệnh hoặc đoạn HCL cần thiết. Một đáp án chỉ có kết luận nhưng không giải thích phụ thuộc, state hay rủi ro production chỉ được tối đa nửa điểm.
4. Chấm bằng đáp án tách riêng. Ghi lại mã câu sai và tra `question-bank.md` để biết bài cần ôn.
5. Sau Level 4, làm capstone trong một tenancy/sandbox OCI riêng. Không dùng tenancy production để thử `destroy`, import hay refactor state.

## Quy ước điểm

- Trắc nghiệm và đúng/sai: 1 điểm/câu.
- Giải thích ngắn: 2 điểm/câu.
- Tình huống và debug code: 3 điểm/câu.
- Nếu câu có nhiều ý, đáp án nêu rõ thang điểm thành phần.
- Ngưỡng đạt khuyến nghị: **80% mỗi level** và không có câu thuộc nhóm an toàn/state bị 0 điểm.

| Level | Trọng tâm | Câu | Điểm tối đa | Thời gian gợi ý |
|---|---|---:|---:|---:|
| 1 – Foundation | IaC, HCL, workflow, provider | 12 | 17 | 25 phút |
| 2 – Core | dependency, state, module, meta-argument | 14 | 25 | 40 phút |
| 3 – OCI | mạng, compute, IAM, dịch vụ OCI | 14 | 27 | 50 phút |
| 4 – Production | backend, CI/CD, security, DR, cost | 14 | 28 | 55 phút |
| 5 – Expert | refactor, migration, scale, debug sâu | 12 | 27 | 60 phút |
| **Tổng lý thuyết** |  | **66** | **124** |  |

## Cách đọc kết quả

- Dưới 60%: học lại lesson được ánh xạ; chưa nên chuyển level.
- 60–79%: hiểu khái niệm nhưng còn lỗ hổng vận hành; làm lại sau 2–3 ngày.
- 80–89%: đạt; tiếp tục level sau và sửa toàn bộ câu sai.
- 90–100%: vững phần lý thuyết; xác nhận bằng capstone và giải thích được quyết định thiết kế cho người khác.

“Master DevOps” không chỉ là điểm quiz. Bạn cần chứng minh được: thay đổi nhỏ và reviewable; state an toàn; không lộ secret; pipeline có kiểm soát; thiết kế phục hồi được; biết điều tra drift/sự cố; và biết khi nào **không nên** dùng Terraform.

## An toàn khi thực hành

- Dùng compartment OCI sandbox, quota/budget nhỏ và tài khoản không phải root.
- Luôn đọc `terraform plan`; không tự động duyệt production chỉ vì plan chạy thành công.
- Không commit private key, API key, password, file `.tfstate`, `*.tfvars` chứa secret hoặc plan file nhạy cảm.
- Xóa tài nguyên theo đúng quy trình sau lab để tránh chi phí, nhưng giữ bằng chứng chấm bài (plan đã redacted, log test, sơ đồ).
- Một giá trị được đánh dấu `sensitive` chỉ bị che trên một số output; nó vẫn có thể tồn tại trong state.

