# Lesson 24 — Attention và Transformers

## Mục tiêu

Bạn sẽ hiểu query, key, value, scaled dot-product attention, causal/padding mask, multi-head attention, positional information, residual connection và tự tính một attention layer nhỏ.

## Bản chất và cách hoạt động

Mỗi query so với mọi key bằng dot product. Chia cho căn bậc hai của head dimension giúp logits không quá lớn. Mask đặt các vị trí cấm thành âm vô cùng trước softmax. Trọng số sau softmax cộng bằng một và dùng để lấy weighted sum của value.

Causal mask đảm bảo token ở vị trí t không nhìn token tương lai. Padding mask ngăn attention vào token đệm. Sai thứ tự áp mask hoặc sai broadcasting có thể gây leakage rất khó thấy.

Multi-head cho nhiều không gian quan hệ, sau đó concat/project. Transformer còn cần positional information, feed-forward block, residual và layer normalization.

## Khi dùng

- Modeling chuỗi, LLM, VLM, speech và long-context retrieval.
- Khi quan hệ xa quan trọng hơn locality thuần túy.

## Khi không dùng

- Không mặc định attention tốt hơn baseline cho dataset nhỏ.
- Không bỏ qua chi phí bậc hai theo sequence length của full attention.
- Không diễn giải attention weight như explanation nhân quả.

## Ví dụ thực tế

Trong chuỗi sự kiện hỗ trợ, sự kiện hiện tại có thể tham chiếu các sự kiện trước nhưng không được đọc response tương lai trong lúc training next-token.

## Demo

~~~powershell
python .\Lessions\24-attention-transformers\src\demo.py
~~~

Demo chứng minh causal mask làm mọi trọng số tới tương lai bằng zero và mỗi hàng attention cộng bằng một.

## Bài tập

1. Kết hợp causal mask và padding mask.
2. Thêm projection Q/K/V.
3. Cài hai head và concat output.
4. Viết test bắt lỗi mask bị đảo True/False.

## Checklist

- [ ] Q, K, V và mask có shape đúng.
- [ ] Scale bằng sqrt(head_dim).
- [ ] Mask được áp trước softmax.
- [ ] Không có hàng bị mask toàn bộ.
- [ ] Test khẳng định không rò token tương lai.

## Bài trước và bài sau

- Bài trước: Lesson 23 — NLP, tokenization, embeddings và sequences.
- Bài sau: Lesson 25 — LLM training, inference và decoding.
