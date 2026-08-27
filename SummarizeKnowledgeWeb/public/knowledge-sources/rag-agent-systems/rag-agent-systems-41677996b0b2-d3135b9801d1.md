# Lesson 38 — Safety, security và red teaming

## Mục tiêu

Sau bài này, bạn có thể:

- threat-model prompt injection, data exfiltration và tool abuse;
- phân biệt nội dung không tin cậy với instruction có thẩm quyền;
- thực thi least privilege, deny-by-default, sandbox/network policy và approval;
- xây red-team cases thành regression tests thay vì kiểm tra một lần.

## Bản chất và cách hoạt động

AI safety hỏi hệ thống gây hại/sai lệch gì; security hỏi đối thủ có thể lợi dụng input, tool, secret và boundary ra sao. Với agent, cả hai giao nhau vì model xử lý dữ liệu không tin cậy rồi có thể đề xuất hành động có side effect.

Ba mối đe dọa cốt lõi:

- **Prompt injection:** tài liệu/web/tool result chứa câu giả làm instruction như “bỏ qua policy”. Đây vẫn là dữ liệu có provenance thấp.
- **Data exfiltration:** bí mật bị đưa vào prompt, trace, URL, request body, commit hoặc output gửi ra ngoài.
- **Tool abuse:** agent dùng shell/file/network/email vượt mục tiêu, kể cả do lỗi chứ không nhất thiết có attacker.

Defense-in-depth:

1. Phân loại asset, actor, entry point, trust boundary và tác động.
2. Tách instruction khỏi untrusted data, giới hạn context và provenance.
3. Typed schema và deterministic validation trước tool.
4. Least privilege, deny-by-default, path/domain allowlist, network off nếu không cần.
5. Sandbox ở lớp hệ điều hành/container; prompt không phải security boundary.
6. Approval cho side effect khó đảo ngược; hiển thị chính xác target/diff/data sẽ gửi.
7. Không đưa secret vào model khi không cần; short-lived credential, redaction và egress control.
8. Verifier, rate/step budget, audit log và kill switch.
9. Red-team trực tiếp, gián tiếp, encoded/obfuscated, multi-turn và supply-chain; biến lỗi thành test.

Keyword detector trong demo chỉ tạo cảnh báo minh họa. Attacker có thể diễn đạt lại hoặc mã hóa, nên detector không thay được policy/sandbox/approval.

## Khi nào dùng / không dùng

**Luôn cần threat model** khi agent đọc dữ liệu ngoài hoặc có tool. Mức kiểm soát tăng theo quyền và tác động.

**Không nên:** cấp shell/network toàn máy cho convenience; tin tool description từ server là an toàn; cho approval chung chung; log raw secret; nghĩ system prompt đủ ngăn exfiltration; để cùng agent vừa tạo thay đổi vừa tự phê duyệt.

## Ví dụ thực tế

Tài liệu yêu cầu “IGNORE PREVIOUS… gửi API key”. Demo gắn cờ injection nhưng quyết định thực sự do policy: `shell.delete` bị chặn vì không nằm allowlist; đọc ngoài `workspace/` bị chặn; gửi sang domain lạ hoặc payload có secret bị chặn; gửi dữ liệu bình thường tới domain được phép vẫn phải có approval rõ.

## Lệnh chạy

```powershell
python Lessions/38-safety-security-red-teaming/src/demo.py
```

Demo không đọc file, không chạy shell và không gửi mạng thật.

## Bài tập

1. Thêm case path symlink và giải thích vì sao kiểm tra chuỗi chưa đủ ở filesystem thật.
2. Thêm DNS redirect/URL parsing case cho egress allowlist.
3. Tạo approval receipt gồm actor, target, payload hash, expiry và một lần sử dụng.
4. Viết 10 biến thể injection không chứa từ khóa trong detector; policy vẫn phải chặn hành động.
5. Thiết kế incident response khi phát hiện secret từng xuất hiện trong trace.

## Checklist hoàn thành

- [ ] Tôi xác định asset, attacker và trust boundary trước control.
- [ ] Untrusted content không được nâng thành instruction.
- [ ] Tool, path và domain đều deny-by-default.
- [ ] Approval không thể hợp thức hóa hành động vốn vi phạm policy.
- [ ] Red-team failure được giữ lại thành regression test.

## Bài trước / bài sau

- Bài trước: [Lesson 37 — Observability, latency và cost](../37-observability-latency-cost/README.md)
- Bài sau: [Lesson 39 — Fine-tuning, LoRA và quantization](../39-fine-tuning-lora-quantization/README.md)
