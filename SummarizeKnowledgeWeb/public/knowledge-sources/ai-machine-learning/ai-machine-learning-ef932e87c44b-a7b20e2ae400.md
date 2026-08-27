# Checkpoint 03 — Deep Learning và LLM (lessons 20–27)

Thời gian: 8 giờ.

## Lý thuyết

Chạy `python Quiz/quiz.py --phase deep-learning-llm --shuffle --seed 303`. Yêu cầu ≥ 80%.

## Mini-build: Tiny language pipeline

1. Normalize Unicode tiếng Việt và xây tokenizer nhỏ; version vocabulary.
2. Cài scalar autodiff hoặc matrix backprop, có finite-difference gradient check.
3. Cài masked self-attention nhỏ; test token không nhìn tương lai.
4. Từ logits fixture, cài greedy, temperature và top-k với seed.
5. Parse output JSON bằng deterministic parser/schema, test missing/wrong/extra fields.
6. Quantize một weight vector; báo memory estimate và reconstruction error.

## Oral review

Vẽ shape của Q/K/V, attention scores và output. Giải thích KV cache giảm compute nhưng tăng memory; token khác word; structured generation không thay business validation.

Gate: mọi shape/mask/gradient test pass. Hard-code output hoặc dùng `eval()` là không đạt.

