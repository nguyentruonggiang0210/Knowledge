# Network troubleshooting lab

Chỉ chạy trong local lab/sandbox bạn sở hữu. Packet capture có thể chứa dữ liệu nhạy cảm;
lọc hẹp, bảo vệ output và xóa theo policy.

## Evidence sheet

| Thời điểm UTC | Layer | Hypothesis | Command/query | Evidence | Kết luận |
|---|---|---|---|---|---|
| | | | | | |

## Incident A - DNS cũ

1. Chạy hai HTTP server local trả version khác nhau.
2. Dùng một DNS server lab hoặc hosts abstraction để endpoint đổi từ A sang B.
3. Cho client cache record lâu hơn mong đợi.
4. Chứng minh authoritative answer, recursive answer và client cache khác nhau.
5. Mitigate không bằng cách “restart tất cả”; ghi TTL/pre-change plan đúng.

Acceptance: nêu được nơi cache, expiry, negative cache và cách verify từ ít nhất hai resolver.

## Incident B - Return path/firewall

1. Dùng container network hoặc network namespace để tạo client, router và server.
2. Cho chiều đi tới server nhưng cố ý thiếu route/rule chiều về.
3. Quan sát SYN ở từng hop bằng tcpdump; không dựa vào một lệnh ping.
4. Sửa route/rule nhỏ nhất và verify connection lẫn application response.

Acceptance: sơ đồ có source/destination trước và sau NAT, state và return path.

## Incident C - TLS/MTU

1. Tạo CA/certificate lab cho api.lab; truy cập bằng hostname đúng và hostname sai.
2. Kiểm certificate chain, SAN, SNI và clock bằng openssl/curl.
3. Cố ý tạo MTU mismatch trong namespace/container network.
4. So sánh request/response nhỏ với payload lớn; dùng tracepath/packet capture.
5. Sửa trust/name/MTU thay vì tắt certificate verification.

Acceptance: phân biệt được connect timeout, TLS validation error và application 5xx.

## Runbook output

Mỗi incident cần:

- symptom/user impact và scope;
- timeline UTC và change gần nhất;
- ít nhất ba hypothesis có thứ tự;
- evidence khiến hypothesis được giữ/bỏ;
- mitigation, fix, verify và cleanup;
- guardrail/monitoring ngăn tái diễn.
