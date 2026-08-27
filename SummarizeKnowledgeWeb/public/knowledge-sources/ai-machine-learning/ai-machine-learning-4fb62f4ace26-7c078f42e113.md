# Checkpoint 02 — Machine Learning (lessons 11–19)

Thời gian: 6 giờ.

## Lý thuyết

Chạy `python Quiz/quiz.py --phase machine-learning --shuffle --seed 202`. Yêu cầu ≥ 80%.

## Mini-build: Risk triage có cost

Dùng dataset synthetic tự tạo nhưng split trước khi tuning. So sánh rule baseline, linear/logistic implementation và tree/stump implementation từ các demo.

Bắt buộc:

- Nêu unit of prediction, decision, false-positive/negative cost.
- Train/validation/test không leakage; time/group split nếu scenario yêu cầu.
- Precision, recall, F1, confusion, calibration bins và bootstrap interval.
- Chọn threshold theo cost trên validation, báo cáo một lần trên test.
- Slice theo ít nhất hai subgroup; không dùng feature importance như causal proof.
- Model card: intended use, limits, data provenance và failure gallery.

Gate: vượt baseline trên metric nghiệp vụ và không làm subgroup guardrail giảm. Nếu không vượt, kết luận đúng là giữ baseline và giải thích evidence.

