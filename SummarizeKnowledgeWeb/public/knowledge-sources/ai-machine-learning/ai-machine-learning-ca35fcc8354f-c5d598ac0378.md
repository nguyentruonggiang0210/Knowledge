# Lesson 19 — Explainability, fairness và tư duy nhân quả

## Mục tiêu

Bạn sẽ phân biệt dự đoán, giải thích và kết luận nhân quả; tính permutation importance, demographic-parity gap, equal-opportunity gap và một ước lượng difference-in-differences nhỏ.

## Bản chất và cách hoạt động

Explainability trả lời model đã dựa vào tín hiệu nào. Global explanation mô tả hành vi tổng thể; local explanation mô tả một dự đoán. Permutation importance phá quan hệ giữa một feature và target rồi đo mức metric giảm. Feature tương quan cao hoặc dữ liệu leakage có thể khiến diễn giải sai.

Fairness không có một metric duy nhất phù hợp mọi bài toán. Demographic parity so sánh tỷ lệ quyết định dương; equal opportunity so sánh true-positive rate giữa nhóm. Hai tiêu chí có thể xung đột và phải gắn với bối cảnh pháp lý/nghiệp vụ.

Causal inference hỏi điều gì xảy ra nếu can thiệp, không chỉ điều gì đồng biến. Difference-in-differences so thay đổi của nhóm treatment với thay đổi của nhóm control và dựa trên giả định parallel trends.

## Khi dùng

- Model tín dụng, tuyển dụng, y tế hoặc hệ thống cần audit.
- Debug shortcut/leakage và trao đổi với domain expert.
- Đánh giá tác động của một chính sách/can thiệp khi không thể A/B test đơn giản.

## Khi không dùng

- Không coi feature importance là bằng chứng nguyên nhân.
- Không công bố model “công bằng” chỉ vì một metric đạt ngưỡng.
- Không dùng local explanation để mô tả toàn bộ model.

## Ví dụ thực tế

Ngân hàng xem feature nào ảnh hưởng quyết định vay, đo chênh lệch cơ hội giữa hai nhóm và đánh giá chương trình tư vấn tài chính bằng thay đổi tương đối so với nhóm đối chứng.

## Demo

~~~powershell
python .\Lessions\19-explainability-fairness-causality\src\demo.py
~~~

## Bài tập

1. Thêm confusion matrix theo từng subgroup.
2. Thử hai feature tương quan mạnh và quan sát permutation importance.
3. Tạo counterfactual hợp lệ, không thay thuộc tính bất biến.
4. Kiểm tra giả định parallel trends trên nhiều mốc trước can thiệp.

## Checklist

- [ ] Explanation đúng scope local/global.
- [ ] Báo nhiều fairness metric cùng sample size.
- [ ] Có domain expert và quy trình appeal/human review.
- [ ] Không suy causal từ correlation.
- [ ] Ghi rõ giả định, uncertainty và residual risk.

## Bài trước và bài sau

- Bài trước: Lesson 18 — graph ML và GNN.
- Bài sau: Lesson 20 — neural networks, backprop và autodiff.
