# 39 — Fine-tuning, LoRA và quantization

## Mục tiêu

Phân biệt lúc nên dùng prompt, RAG, supervised fine-tuning (SFT), LoRA/QLoRA và quantization. Sau bài này bạn phải giải thích được LoRA cập nhật một ma trận trọng số bằng hai ma trận hạng thấp, còn quantization đổi cách biểu diễn số để giảm bộ nhớ/compute; hai kỹ thuật giải quyết hai vấn đề khác nhau.

## Bản chất

SFT dạy model **hành vi/định dạng/phong cách** từ cặp input–output. RAG đưa **tri thức thay đổi thường xuyên** vào context khi inference. Fine-tune không phải database và không đảm bảo nhớ đúng từng fact. Full fine-tune cập nhật phần lớn weights; PEFT chỉ học một phần nhỏ. Với LoRA, thay vì học trực tiếp ma trận lớn `W`, ta giữ `W` và học `ΔW = scale × B × A`, trong đó rank `r` nhỏ hơn nhiều kích thước gốc.

Quantization ánh xạ FP32/FP16 sang INT8/INT4 hoặc dạng nén khác. Nó giảm RAM/VRAM và có thể tăng throughput, đổi lại sai số và phụ thuộc phần cứng/kernel. QLoRA thường dùng base model đã quantize để giảm bộ nhớ trong lúc học adapter; đó không có nghĩa training hoàn toàn bằng integer.

## Khi nào dùng

- Dùng RAG khi knowledge thay đổi, cần citation hoặc quyền truy cập theo tài liệu.
- Dùng SFT/LoRA khi output style/schema hay hành vi chuyên ngành lặp lại và prompt không đủ ổn định.
- Dùng quantization khi model không vừa máy hoặc serving cost/latency là bottleneck.
- Không fine-tune trước khi có baseline và held-out eval; không đánh giá trên dữ liệu đã train.

Ví dụ thực tế: chuẩn hóa cách phân loại ticket theo taxonomy nội bộ bằng LoRA, nhưng nội dung chính sách mới vẫn được lấy bằng RAG.

## Demo

```powershell
python Lessions/39-fine-tuning-lora-quantization/src/demo.py
```

Demo thuần Python tính LoRA forward, số parameter trainable, quantize/dequantize đối xứng và sai số phục hồi. Production exercise có thể thay bằng PyTorch/PEFT nhưng invariant vẫn giống nhau.

## Bài tập và checklist

1. Thử rank 1, 2 và 4; so sánh số parameter và khả năng biểu diễn.
2. Thử quantize cùng vector ở 4 bit và 8 bit; đo max error.
3. Viết decision record cho một bài toán: prompt, RAG hay LoRA, kèm eval trước/sau.

- [ ] Phân biệt knowledge injection và behavior adaptation.
- [ ] Biết tách train/dev/test theo nguồn và thời gian.
- [ ] Đo chất lượng, latency, memory trước/sau quantization.
- [ ] Lưu adapter, tokenizer, base model/version và license cùng artifact.

Bài trước: 36 (eval). Bài sau: 40 (RL và alignment).

