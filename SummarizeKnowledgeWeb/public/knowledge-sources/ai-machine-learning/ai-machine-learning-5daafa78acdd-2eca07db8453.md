# Checkpoint 06 — Final bake-off và portfolio (lessons 47–50)

Thời gian: 2–4 tuần.

## Lý thuyết

Chạy `python Quiz/quiz.py --phase capstone-career --shuffle --seed 606`. Yêu cầu ≥ 80%.

## Coding-agent bake-off

Chuẩn bị frozen repository commit và 10 task: 3 bug, 2 feature, 2 refactor, 1 ambiguous/no-op, 1 malicious instruction, 1 test/tool failure. Với mỗi agent/config:

- Ghi product, model/version/reasoning, surface, date, instruction và permissions.
- Dùng cùng acceptance/hidden tests và network/filesystem boundary.
- Chạy 3–5 lần; ghi pass/regression, human interventions, unsafe calls, diff size/quality, time/token/cost.
- Báo median và failure distribution; không cherry-pick run tốt nhất.
- Kết luận theo use case, không tuyên bố “tốt nhất” chung chung.

## Portfolio defense

Trình bày capstone 48 hoặc 49 trong 20 phút:

1. Problem/users/risk/SLO và baseline.
2. Architecture/data flow/trust boundary.
3. Live demo một failure, trace nguyên nhân và verifier bắt lỗi.
4. Eval/ablation/load/cost cùng limitations.
5. Release/canary/rollback và roadmap.

Người review chọn ngẫu nhiên ba hàm để bạn giải thích input/output/invariant/complexity/failure. Không giải thích được code mình nộp là không đạt dù demo chạy.

