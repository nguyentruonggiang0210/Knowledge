# Incident drills

Với mỗi tình huống, ghi: signal, giả thuyết, read-only commands, blast radius,
decision, recovery, verification và prevention.

1. Apply tạo VCN thành công nhưng subnet trả 403; state đã có VCN.
2. Pipeline treo và run mới gặp lock; UI runner cũ không còn cập nhật.
3. Console đổi NSG mở port 22 từ Internet lúc xử lý sự cố.
4. Provider upgrade làm plan replace database critical.
5. State Object Storage bị xóa, bucket versioning còn snapshot một giờ trước.
6. Primary region unavailable; DR chưa có đủ compute shape quota.

Safety gate: không force-unlock, state push, destroy, target hoặc restore trước khi
xác minh exact state/address/writer và có reviewer.

