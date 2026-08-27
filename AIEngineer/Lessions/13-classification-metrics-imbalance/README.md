# 13 — Classification, metric và dữ liệu mất cân bằng

## Mục tiêu

Bạn sẽ hiểu probability score, threshold, confusion matrix, precision, recall, specificity, F1, ROC-AUC, PR-AUC, calibration và class imbalance. Bạn có thể chọn threshold từ yêu cầu nghiệp vụ thay vì mặc định 0.5.

## Bản chất và cách hoạt động

Classifier thường tạo score hoặc xác suất; threshold biến score thành quyết định. Confusion matrix gồm TP, FP, TN, FN. Precision hỏi trong các cảnh báo có bao nhiêu đúng; recall hỏi trong các ca thật có bao nhiêu được bắt; specificity đo tỷ lệ negative được loại đúng. F1 là harmonic mean precision/recall nhưng bỏ qua TN và chi phí thực.

Accuracy có thể đánh lừa: nếu gian lận chiếm 0.1%, model luôn đoán “không gian lận” đạt 99.9% nhưng vô dụng. ROC mô tả trade-off TPR/FPR qua threshold; PR thường giàu thông tin hơn khi positive hiếm. Calibration hỏi score 0.8 có thực sự đúng khoảng 80% hay không.

## Khi nào dùng / không dùng

Dùng recall cao khi bỏ sót nguy hiểm như bệnh hoặc fraud; precision cao khi mỗi cảnh báo tốn chi phí lớn. Chọn threshold trên validation, khóa lại rồi đánh giá test. Không oversample trước split; không chỉ báo accuracy; không tune threshold trên test; không giả định metric tốt toàn cục nghĩa là mọi subgroup đều tốt.

## Ví dụ thực tế

Hệ thống fraud cần bắt ít nhất 80% giao dịch xấu, sau đó chọn threshold có F1 tốt nhất trong các lựa chọn đạt ràng buộc. Demo quét threshold từ score validation và cho thấy baseline đoán toàn negative vẫn có accuracy cao nhưng recall bằng 0.

## Chạy demo

~~~powershell
python .\Lessions\13-classification-metrics-imbalance\src\demo.py
~~~

## Bài tập

1. Đổi yêu cầu recall thành 100% và đo số false positive tăng thêm.
2. Thêm cost FN gấp 20 lần FP rồi chọn threshold giảm expected cost.
3. Chia score thành bin để kiểm tra calibration.

## Checklist

- [ ] Tôi dựng được confusion matrix từ label và prediction.
- [ ] Tôi giải thích precision/recall theo ngôn ngữ nghiệp vụ.
- [ ] Threshold được chọn trên validation theo cost/ràng buộc.
- [ ] Tôi kiểm tra PR, calibration và metric theo subgroup.

## Liên kết bài trước / sau

- Bài trước: 12 — metric cho target liên tục.
- Bài sau: 14 — tree và ensemble cho dữ liệu tabular.
