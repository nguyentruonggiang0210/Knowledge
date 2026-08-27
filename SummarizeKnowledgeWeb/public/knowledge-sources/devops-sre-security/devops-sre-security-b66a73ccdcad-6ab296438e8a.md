# Bộ tự kiểm tra DevOps/SRE từ Foundation đến Senior

Bộ quiz này bám curriculum `D01`–`D20` của track `Devops`. Mục tiêu không phải học thuộc lệnh, mà kiểm tra khả năng nối liền **commit → build/artifact → hạ tầng/runtime → network/data → telemetry/SLO → incident/business outcome**.

## Cấu trúc

```text
Devops/Quiz/
├── README.md
├── lesson-map.md
├── question-bank.md
├── levels/
│   ├── 01-foundation.md
│   ├── 02-core.md
│   ├── 03-cloud-native.md
│   ├── 04-production.md
│   └── 05-senior.md
├── answers/
│   ├── 01-foundation-answers.md
│   ├── 02-core-answers.md
│   ├── 03-cloud-native-answers.md
│   ├── 04-production-answers.md
│   └── 05-senior-answers.md
├── practical/
│   ├── capstone.md
│   └── capstone-rubric.md
└── templates/
    └── answer-sheet.md
```

## Cách học và tự chấm

1. Học lesson trong `Devops`, làm lab và lưu evidence trước khi làm quiz.
2. Mở một file trong `levels/`, sao chép `templates/answer-sheet.md`, rồi làm bài **không mở** `answers/`.
3. Với câu debug/scenario, ghi giả thuyết, evidence cần thu, thứ tự kiểm tra, biện pháp khôi phục và cách ngăn tái diễn. Kết luận đúng do đoán chỉ được tối đa nửa điểm.
4. Chấm theo đáp án tách riêng. Ghi mã câu sai và dùng `question-bank.md` để tìm lesson cần ôn.
5. Đạt từng level ở mức 80% rồi mới chuyển cấp. Sau Production, làm capstone và bảo vệ bằng vấn đáp.

## Quy ước điểm

- Trắc nghiệm hoặc đúng/sai: 1 điểm.
- Giải thích: 2 điểm.
- Scenario/debug: 3 điểm.
- Mỗi level có 20 câu / 38 điểm; toàn bộ lý thuyết có **100 câu / 190 điểm**.

| Cấp | Trọng tâm | Câu | Thời gian gợi ý |
|---|---|---:|---:|
| Foundation | Culture, Linux, network, Git, scripting, cloud/SDLC căn bản | 20 | 45 phút |
| Core | IaC, image/config, CI/CD, artifact, container, security | 20 | 60 phút |
| Cloud-Native | Kubernetes, Helm/GitOps, identity, supply chain, OTel | 20 | 70 phút |
| Production | SRE, data, platform, FinOps, incident, HA/DR | 20 | 75 phút |
| Senior | Systems thinking, distributed/multi-cloud, leadership và trade-off | 20 | 90 phút |

## Diễn giải kết quả

- Dưới 60%: chưa có mental model ổn định; học lại và làm lab nhỏ.
- 60–79%: hiểu khái niệm nhưng chưa đủ an toàn để tự vận hành production.
- 80–89%: đạt level; sửa hết các câu security/data/incident bị sai.
- 90–100%: lý thuyết vững; cần capstone, game day, restore test và kinh nghiệm on-call để xác nhận.

Điểm cao không tự động đồng nghĩa “senior”. Senior phải biết giảm rủi ro tổ chức, giao tiếp trong sự cố, cân bằng reliability/security/cost/speed, tạo guardrail giúp đội khác tự phục vụ và đo được outcome.

## Quy tắc an toàn khi thực hành

- Chỉ thử lỗi, failover, chaos và cleanup trong sandbox có phạm vi/owner rõ.
- Không commit secret, private key, kubeconfig, `.tfstate`, database dump hoặc saved plan nhạy cảm.
- Backup chỉ được coi là dùng được sau khi **restore test** thành công và đo được thời gian.
- Không dùng `curl | sh`, tắt TLS verification, mở firewall toàn Internet hoặc cấp admin lâu dài để “sửa nhanh”.
- Dừng thử nghiệm nếu blast radius vượt giả định; bảo toàn log/audit/timeline để học từ sự cố.

