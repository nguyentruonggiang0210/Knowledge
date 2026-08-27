# 42 — Multimodal: vision, audio, document và diffusion

## Mục tiêu

Hiểu representation theo modality, early/late fusion, OCR/layout, audio features, vision-language alignment và trực giác của diffusion; biết đánh giá perception riêng với reasoning.

## Bản chất

Multimodal model không chỉ “đưa ảnh vào LLM”. Mỗi modality có preprocessing, encoder, resolution/time sampling, token budget và failure mode riêng. Vision cần scale/crop/patch; document cần OCR và layout; audio cần sample rate, window và feature theo thời gian. Sau encoder, representation được align hoặc fuse để model chung suy luận.

Diffusion học đảo quá trình thêm noise: training chọn timestep, làm nhiễu sample rồi học dự đoán noise/score; generation bắt đầu từ noise và denoise nhiều bước. Nó phù hợp sinh ảnh/audio nhưng latency, bản quyền dữ liệu và content provenance phải được quản lý.

## Khi nào dùng

- Invoice/screenshot: OCR + layout parser trước reasoning.
- Call center: speech-to-text, diarization và classifier/LLM; đo word error và task success riêng.
- Product search: embedding ảnh–text cùng không gian.
- Không dùng model đa phương thức đắt nếu deterministic OCR/rule giải đủ; không kết luận “reasoning kém” khi lỗi thực ra nằm ở perception.

## Demo

```powershell
python Lessions/42-multimodal-audio-vision-diffusion/src/demo.py
```

Demo rút feature ảnh/audio, late-fusion score và mô phỏng forward diffusion 1D có seed.

## Bài tập và checklist

1. Thay image fixture và giải thích feature nào mất thông tin không gian.
2. Tạo audio sine/silence, so sánh energy và zero-crossing rate.
3. Thiết kế eval hai tầng cho hệ thống đọc hóa đơn: perception rồi business reasoning.

- [ ] Ghi rõ modality, format, sampling/resolution và preprocessing.
- [ ] Tách metric OCR/ASR/vision khỏi metric câu trả lời cuối.
- [ ] Quản lý privacy, consent, provenance và output watermark/policy khi cần.
- [ ] Có fallback khi một modality thiếu hoặc hỏng.

Bài trước: 41. Bài sau: 43.

