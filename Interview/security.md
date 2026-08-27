# Application Security cho Backend Engineer

Các câu hỏi bao quát secure design, identity, OWASP-style vulnerability, cloud/container và incident. Cần trả lời theo threat model; không coi một control đơn lẻ là đủ.

## 1. Nền tảng và threat modeling

### SEC-001 [Middle]
Confidentiality, Integrity và Availability là gì? Cho một control và một trade-off cho mỗi mục.

### SEC-002 [Middle → Senior]
Threat, vulnerability, exploit, risk và control khác nhau thế nào?

### SEC-003 [Senior]
Threat modeling bằng data-flow diagram và STRIDE được thực hiện ở thời điểm nào? Trust boundary giúp đặt câu hỏi gì?

### SEC-004 [Senior]
Defense in depth và least privilege được áp dụng xuyên user, service, network, data và pipeline ra sao?

### SEC-005 [Senior]
Zero Trust có ý nghĩa thực tế gì ngoài khẩu hiệu “không tin ai”? Identity, device/workload, policy và telemetry phối hợp thế nào?

## 2. Authentication, authorization và identity protocols

### SEC-006 [Middle]
Authentication và authorization khác nhau thế nào? Vì sao kiểm tra role ở UI không phải authorization?

### SEC-007 [Middle → Senior]
Session cookie và JWT bearer token khác nhau về revocation, scale, size, CSRF/XSS và vận hành ra sao?

### SEC-008 [Senior]
Một JWT consumer phải xác minh algorithm, signature, issuer, audience, expiry/not-before và key rotation thế nào?

### SEC-009 [Senior]
OAuth 2.0 và OpenID Connect giải quyết hai vấn đề gì? Access token và ID token được dùng bởi ai?

### SEC-010 [Senior]
Authorization Code Flow với PKCE ngăn interception ra sao? Vì sao không dùng client secret trong public client?

### SEC-011 [Senior]
Refresh token rotation và reuse detection hoạt động thế nào? Lưu token phía client/server ra sao?

### SEC-012 [Middle → Senior]
RBAC, ABAC và ReBAC phù hợp mô hình quyền nào? Làm sao tránh role explosion?

### SEC-013 [Senior]
Authorization trong multi-tenant application cần chống IDOR/BOLA và cross-tenant query ở các lớp nào?

### SEC-014 [Middle]
Password nên được hash bằng thuật toán chậm, có salt như thế nào? Pepper có vai trò gì?

### SEC-015 [Middle → Senior]
MFA chống được và không chống được tấn công nào? Passkey/WebAuthn cải thiện phishing resistance ra sao?

### SEC-016 [Senior]
Service-to-service authentication bằng workload identity, short-lived token hoặc mTLS có trade-off nào so với static API key?

## 3. Cryptography, key và secret

### SEC-017 [Middle]
Hashing, encryption và digital signature khác mục tiêu thế nào? Vì sao base64 không phải mã hóa?

### SEC-018 [Senior]
Authenticated encryption (AEAD) bảo vệ confidentiality và integrity ra sao? Nonce reuse nguy hiểm thế nào?

### SEC-019 [Senior]
Envelope encryption và KMS/HSM giúp quản lý data key/master key thế nào?

### SEC-020 [Senior]
Key/secret rotation không downtime cần versioning, dual-read/write và revocation thế nào?

### SEC-021 [Middle → Senior]
TLS certificate chain, hostname validation và trust store hoạt động ra sao? “Bỏ verify để sửa lỗi” nguy hiểm thế nào?

### SEC-022 [Senior]
Random token, OTP và public ID cần entropy như thế nào? Vì sao timestamp hoặc non-cryptographic PRNG không đủ?

## 4. Lỗ hổng ứng dụng phổ biến

### SEC-023 [Middle]
SQL injection xảy ra thế nào? Parameterized query bảo vệ gì và không bảo vệ dynamic identifier/order-by ra sao?

### SEC-024 [Middle → Senior]
Command injection, NoSQL injection và LDAP injection có chung nguyên nhân gì? Thiết kế allowlist và API an toàn thế nào?

### SEC-025 [Middle]
Stored, reflected và DOM-based XSS khác nhau thế nào? Output encoding phải theo context ra sao?

### SEC-026 [Senior]
Content Security Policy giảm tác động XSS thế nào? Nonce/hash và `strict-dynamic` có trade-off gì?

### SEC-027 [Middle → Senior]
CSRF dựa vào cơ chế nào? SameSite cookie, anti-forgery token và kiểm tra Origin phối hợp ra sao?

### SEC-028 [Middle]
CORS là chính sách của browser cho đọc response, không phải cơ chế authentication, nghĩa là gì?

### SEC-029 [Senior]
SSRF có thể truy cập metadata/internal service ra sao? URL parser, redirect và DNS rebinding làm allowlist khó thế nào?

### SEC-030 [Senior]
Unsafe deserialization dẫn đến data tampering hoặc code execution thế nào? Polymorphic type handling cần giới hạn gì?

### SEC-031 [Middle → Senior]
Path traversal trong download/extract archive được ngăn bằng canonicalization, allowlist và root containment ra sao?

### SEC-032 [Middle → Senior]
File upload an toàn cần kiểm tra size, content, filename, storage, malware và serving domain thế nào?

### SEC-033 [Senior]
Mass assignment/over-posting xảy ra khi bind DTO/domain thế nào? Allowlist field và command model giải quyết ra sao?

### SEC-034 [Senior]
Rate limit theo IP có thể vừa bị bypass vừa chặn nhầm ra sao? Kết hợp identity, tenant, endpoint, cost và abuse signal thế nào?

### SEC-035 [Senior]
Replay attack với payment/webhook được ngăn bằng timestamp, nonce/idempotency key và signature coverage ra sao?

### SEC-036 [Senior]
Timing side channel xuất hiện khi so sánh secret/token thế nào? Constant-time comparison giải quyết và không giải quyết gì?

## 5. Secure delivery, cloud và dữ liệu

### SEC-037 [Middle → Senior]
SAST, DAST, SCA, secret scanning và penetration test tìm các lớp lỗi khác nhau nào?

### SEC-038 [Senior]
Dependency/supply-chain security cần lockfile, provenance, signing, SBOM và update policy thế nào?

### SEC-039 [Senior]
Container chạy non-root, read-only filesystem, dropped capabilities và seccomp giảm blast radius ra sao?

### SEC-040 [Senior]
Kubernetes/cloud IAM thường bị cấp quyền quá rộng ở đâu? Workload identity và policy boundary cải thiện thế nào?

### SEC-041 [Middle → Senior]
Log và audit trail cần đủ dữ liệu điều tra nhưng tránh password, token, PII thế nào? Redaction nên làm ở đâu?

### SEC-042 [Senior]
Data classification, minimization, retention và deletion ảnh hưởng thiết kế database, backup, cache và analytics ra sao?

### SEC-043 [Senior]
Vulnerability triage không chỉ dựa CVSS: exploitability, exposure, asset criticality và compensating control được dùng thế nào?

### SEC-044 [Senior]
Webhook signature scheme nên canonicalize payload, chọn timestamp window, key ID và rotation ra sao?

### SEC-045 [Senior]
Một public API cần chống enumeration và scraping nhưng vẫn phục vụ client hợp lệ. Bạn kết hợp identifier, pagination, quota và detection thế nào?

## 6. Tình huống incident

### SEC-046 [Senior · Incident]
Một production API key xuất hiện trong public repository. Hãy nêu thứ tự containment, rotation, scoping, investigation và prevention.

### SEC-047 [Senior · Incident]
Phát hiện truy vấn cross-tenant đã trả dữ liệu sai tenant trong 20 phút. Bạn xử lý kỹ thuật, bằng chứng và communication thế nào?

### SEC-048 [Senior · Design]
Thiết kế chức năng “quên mật khẩu” chống account enumeration, token theft, replay và session persistence.

### SEC-049 [Senior · Design]
Thiết kế audit log cho thao tác quản trị nhạy cảm: integrity, access, retention, search, privacy và break-glass.

### SEC-050 [Senior · Case study]
Team muốn cho phép người dùng nhập URL để backend tải và phân tích file. Hãy threat-model toàn bộ luồng và đề xuất kiến trúc sandbox an toàn.

## 7. Câu hỏi kinh điển bổ sung — Basic đến Senior

### SEC-051 [Basic · ⭐ Rất thường gặp]
OWASP Top 10 là gì và nên được dùng như checklist, threat taxonomy hay tiêu chuẩn bảo đảm an toàn tuyệt đối?

### SEC-052 [Basic · ⭐ Rất thường gặp]
Input validation, canonicalization, sanitization và output encoding khác nhau thế nào? Mỗi kỹ thuật nên đặt ở đâu?

### SEC-053 [Basic · ⭐ Rất thường gặp]
Các thuộc tính cookie `Secure`, `HttpOnly`, `SameSite`, `Domain`, `Path` và `Max-Age` bảo vệ hoặc giới hạn điều gì?

### SEC-054 [Basic · ⭐ Rất thường gặp]
Open redirect nguy hiểm thế nào dù “chỉ chuyển hướng”? Kiểm tra redirect URL an toàn ra sao?

### SEC-055 [Basic · Thường gặp]
Clickjacking hoạt động thế nào? `frame-ancestors` và `X-Frame-Options` giảm rủi ro ra sao?

### SEC-056 [Basic · ⭐ Rất thường gặp]
Các HTTP security header quan trọng bảo vệ lớp rủi ro nào, và vì sao không nên copy một bộ header giống nhau cho mọi response?

### SEC-057 [Basic · ⭐ Rất thường gặp]
Brute force, credential stuffing và password spraying khác nhau thế nào? Detection và mitigation khác nhau ra sao?

### SEC-058 [Middle · ⭐ Rất thường gặp]
Session fixation là gì? Rotate session ID sau login hoặc privilege change ngăn tấn công thế nào?

### SEC-059 [Middle · Thường gặp]
Account lockout có thể bị lợi dụng để denial-of-service ra sao? Thiết kế throttling và step-up thay thế thế nào?

### SEC-060 [Middle · ⭐ Rất thường gặp]
BOLA/IDOR và Broken Function Level Authorization khác nhau thế nào? Viết test authorization matrix cho chúng ra sao?

### SEC-061 [Middle · Thường gặp]
CVE, CWE và CVSS khác nhau thế nào? Một CVE record, một CWE category và một CVSS score liên hệ với nhau ra sao?

### SEC-062 [Middle · Thường gặp]
Dependency confusion và typosquatting tấn công package resolution ra sao? Registry policy và lockfile giảm rủi ro thế nào?

### SEC-063 [Senior · Thường gặp]
TOCTOU security race là gì? Nêu ví dụ kiểm tra quyền/path rồi sử dụng và cách làm operation atomic.

### SEC-064 [Senior · Thường gặp]
Confused Deputy Problem xảy ra khi service có quyền cao hành động thay caller thế nào? Audience, capability và authorization context giúp gì?

### SEC-065 [Senior · ⭐ Rất thường gặp · Scenario]
Một workflow nhiều bước hợp lệ riêng lẻ nhưng có thể bị gọi sai thứ tự, lặp hoặc bỏ bước để gian lận. Bạn threat-model và bảo vệ business logic như thế nào?
