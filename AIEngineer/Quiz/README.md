# Quiz và checkpoint

Quiz dùng để phát hiện lỗ hổng, không phải học thuộc đáp án. Ngưỡng qua đề nghị là **80%**, đồng thời phải giải thích được vì sao các lựa chọn sai và chạy được code challenge.

## Chạy

```powershell
python Quiz/quiz.py --check
python Quiz/quiz.py --phase foundations
python Quiz/quiz.py --phase rag-agents --limit 10 --shuffle --seed 42
python Quiz/quiz.py --all --shuffle
```

Mỗi câu chỉ hiện giải thích sau khi trả lời. Kết quả cuối chỉ ra các lesson yếu. Question bank nằm ở `questions.json`; có thể thêm câu nhưng `--check` phải pass.

## Cách dùng checkpoint

1. Đóng tài liệu, làm quiz trong thời gian giới hạn.
2. Với mỗi câu sai, ghi nguyên nhân: thiếu khái niệm, đọc nhầm, hay không hiểu trade-off.
3. Chạy lại demo của lesson tương ứng và thay input để tạo một failure case.
4. Làm mini-build trong `checkpoints/`; tự chấm theo rubric, không chỉ xem code chạy.
5. Sau 48 giờ làm lại bằng seed khác. Nếu vẫn dưới 80%, chưa qua checkpoint.

## Quy tắc chấm mini-build

- 30% correctness và edge cases.
- 20% tests/reproducibility.
- 15% eval và error analysis.
- 15% safety/privacy/permissions phù hợp rủi ro.
- 10% observability/cost/operations.
- 10% giải thích trade-off và limitations.

Không cần đạt 100% mới học tiếp, nhưng không nên bỏ qua lỗi nền tảng về leakage, metric, parser validation, agent termination, prompt injection hoặc rollback.

