# Quiz theo module — Docker

**Thời gian:** 100 phút. **Tổng:** 64 điểm. Câu chọn/đúng-sai: 1 điểm; câu có ký hiệu `[2đ]`: 2 điểm. Không mở `91-docker-answer-key.md` trước khi nộp.

## Module 1 — Nền tảng Linux và kiến trúc Docker

1. **D01.** Điền chuỗi: Docker CLI → ___ → container runtime mức cao → OCI runtime mức thấp → Linux kernel.
2. **D02.** Namespace nào lần lượt cô lập process ID, network stack, mount points, hostname và user ID?
3. **D03.** Cgroup dùng để đo/giới hạn gì? Nêu ít nhất ba tài nguyên.
4. **D04.** Đúng hay sai: container là một “máy ảo nhẹ” có kernel riêng. Giải thích một câu.
5. **D05. [2đ]** Vì sao PID 1 có semantics signal và zombie reaping đặc biệt? Nêu hai cách để app container xử lý đúng.
6. **D06.** Phân biệt Docker daemon, client và registry; thành phần nào không bắt buộc nằm cùng máy?
7. **D07.** Đúng hay sai: xóa container sẽ luôn xóa image và mọi volume nó từng mount.
8. **D08. [2đ]** Mô tả đường đi của `docker run --rm -p 8080:80 nginx` từ lúc client gửi request đến lúc HTTP tới process nginx.

## Module 2 — Image, Dockerfile, BuildKit và registry

9. **D09.** Layer read-only của image và writable layer của container liên hệ thế nào?
10. **D10.** `CMD` và `ENTRYPOINT` dạng exec phối hợp ra sao? Khi nào `docker run IMAGE args...` override phần nào?
11. **D11.** Shell form khác exec form về signal/environment interpolation thế nào?
12. **D12.** `COPY` nên được ưu tiên hơn `ADD` trong trường hợp thông thường vì sao? Nêu một khả năng riêng của `ADD`.
13. **D13.** `.dockerignore` ảnh hưởng build context, tốc độ và bảo mật thế nào?
14. **D14. [2đ]** Sắp xếp lại Dockerfile sau để cache dependency tốt hơn và giải thích:

    ```dockerfile
    FROM node:22-alpine
    WORKDIR /app
    COPY . .
    RUN npm ci --omit=dev
    CMD ["node", "server.js"]
    ```

15. **D15. [2đ]** Viết khung multi-stage Dockerfile cho Go: build binary ở stage `build`, chạy bằng user non-root trong stage cuối; không cần đầy đủ checksum dependency.
16. **D16.** Vì sao gộp `apt-get update` và `apt-get install` trong cùng `RUN`, rồi xóa package lists?
17. **D17.** Cache invalidation lan truyền thế nào sau một `COPY` thay đổi? Đặt file ít đổi trước hay sau file đổi thường xuyên?
18. **D18.** Phân biệt tag và digest. Trong production, pin digest giải quyết gì và tạo gánh nặng gì?
19. **D19.** Vì sao `ARG SECRET`/`ENV SECRET` không phù hợp cho secret lúc build? Nêu cú pháp BuildKit thay thế ở mức ý tưởng.
20. **D20. [2đ]** Build multi-platform là gì? Nêu vai trò của builder, `--platform`, manifest list và trường hợp QEMU có thể xuất hiện.
21. **D21.** Registry authentication khác image signing/verification thế nào?
22. **D22.** SBOM là gì? Nó không tự mình chứng minh điều gì?
23. **D23.** Khi scan image thấy CVE trong package không được process dùng, có thể bỏ qua ngay không? Quy trình triage tối thiểu?
24. **D24. [2đ]** Nêu pipeline image production tối thiểu từ commit đến deploy, gồm reproducibility, test, scan, provenance/signature và promotion.

## Module 3 — Lifecycle, process, health, log và resource

25. **D25.** `docker create`, `start`, `run`, `stop`, `kill`, `rm` khác nhau ngắn gọn thế nào?
26. **D26.** `docker exec` tạo process ở đâu? Thay đổi tạo ra có tồn tại khi recreate container không?
27. **D27.** `HEALTHCHECK` thất bại có mặc định tự restart standalone container không? Phân biệt health với restart policy.
28. **D28. [2đ]** `STOPSIGNAL`, timeout của `docker stop`, `SIGTERM` và `SIGKILL` tương tác thế nào trong shutdown graceful?
29. **D29.** Exit code `0`, `1`, `126`, `127`, `137`, `143` thường biểu thị gì? (chấp nhận diễn giải shell/Linux chuẩn.)
30. **D30.** Ứng dụng nên log ra stdout/stderr hay tự ghi một file không rotate trong container? Vì sao?
31. **D31.** `docker logs` không có output dù app hoạt động. Nêu ba giả thuyết.
32. **D32. [2đ]** CPU quota, CPU shares/weight và cpuset khác nhau về “trần”, “ưu tiên khi tranh chấp” và “CPU được phép” thế nào?
33. **D33. [2đ]** Memory limit, swap và OOM killer tương tác ra sao? Vì sao tắt OOM killer mà không đặt memory limit nguy hiểm?
34. **D34.** `docker stats`, `docker inspect`, `docker top`, `docker events` lần lượt giúp trả lời loại câu hỏi nào?

## Module 4 — Storage và networking

35. **D35.** So sánh writable layer, named volume, bind mount và tmpfs theo persistence, portability và use case.
36. **D36.** Mount volume lên một thư mục đã có dữ liệu trong image sẽ thấy gì? Cách lấy lại dữ liệu gốc?
37. **D37. [2đ]** Nêu quy trình backup/restore nhất quán một volume database; vì sao chỉ tar khi DB đang ghi có thể hỏng logic?
38. **D38.** User-defined bridge tốt hơn default bridge cho app nhiều container ở điểm DNS/isolation nào?
39. **D39.** `127.0.0.1` bên trong container trỏ tới đâu? App bind `127.0.0.1` thay vì `0.0.0.0` gây lỗi gì khi publish port?
40. **D40.** Phân tích `-p 127.0.0.1:8080:80/tcp`: ba số/địa chỉ và phạm vi truy cập.
41. **D41.** Bridge, host, none, overlay, macvlan phù hợp với các nhóm use case nào?
42. **D42. [2đ]** Container A resolve được tên B nhưng timeout kết nối. Nêu chuỗi kiểm tra từ application đến network/firewall, không sửa vội.
43. **D43.** DNS name tồn tại nhưng connection refused khác timeout về lớp lỗi và giả thuyết thế nào?

## Module 5 — Compose

44. **D44.** `docker compose up`, `up -d`, `down`, `stop`, `rm`, `down -v` khác nhau; thao tác nào có nguy cơ mất dữ liệu volume?
45. **D45.** `depends_on` với `service_started`, `service_healthy`, `service_completed_successfully` dùng cho ba kiểu dependency nào?
46. **D46. [2đ]** Viết đoạn Compose tối thiểu cho `api` phụ thuộc PostgreSQL ready, có healthcheck DB và named volume. Password phải lấy từ biến môi trường hoặc secret, không hard-code giá trị thật.
47. **D47.** Profiles, override files và project name giải quyết những bài toán gì?
48. **D48.** `docker compose config --environment`/`docker compose config` hữu ích khi debug interpolation và merge thế nào?

## Module 6 — Security và vận hành production

49. **D49. [2đ]** Xếp theo least privilege và giải thích: chạy root; non-root; drop all rồi add capability cần thiết; privileged; rootless daemon.
50. **D50. [2đ]** Review cấu hình sau. Chỉ ra ít nhất sáu rủi ro/sai sót và đưa phương án sửa có cân nhắc nhu cầu:

    ```yaml
    services:
      api:
        image: company/api:latest
        privileged: true
        user: "0"
        ports: ["0.0.0.0:8080:8080"]
        volumes:
          - /:/host
          - /var/run/docker.sock:/var/run/docker.sock
        environment:
          DB_PASSWORD: super-secret
        restart: always
    ```

## Phiếu trả lời và bằng chứng

Với câu code/lệnh, ghi thêm:

- Giả định OS/engine/version:
- Lệnh validate (`docker build`, `docker run`, `docker compose config`, test HTTP...):
- Rủi ro/rollback:
