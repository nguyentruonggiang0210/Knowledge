# Lesson 35 — MCP, skills, connectors và protocols

## Mục tiêu

Sau bài này, bạn có thể:

- phân biệt protocol, SDK, tool, resource, prompt, skill và connector;
- đọc contract request/response kiểu JSON-RPC và validate ở trust boundary;
- giải thích discovery khác authorization;
- thiết kế allowlist, schema validation, provenance và approval cho external tools.

## Bản chất và cách hoạt động

**Protocol** định nghĩa các bên trao đổi thông điệp gì và theo thứ tự nào. **SDK** là thư viện giúp hiện thực protocol; dùng cùng SDK không tự tạo interoperability nếu contract khác nhau.

Trong hệ agent:

- **Tool** là capability có input/output schema, ví dụ đọc issue hoặc query database.
- **Resource** là dữ liệu/context có thể đọc.
- **Skill** thường là gói hướng dẫn, workflow và tài nguyên tái sử dụng cho agent; nó không đương nhiên cấp quyền hệ thống.
- **Connector** nối agent với dịch vụ/tài khoản và thường mang auth, permission, rate limit, audit riêng.
- **MCP (Model Context Protocol)** chuẩn hóa cách client/host và server công bố, gọi capability/context. Discovery cho biết thứ đang tồn tại, không có nghĩa caller được phép dùng mọi thứ.

Trust boundary cần được đặt ở cả client và server:

```text
untrusted model/action
  -> schema validation -> policy/approval -> protocol transport
  -> server auth/authorization -> external system
  <- result labeled untrusted + provenance <- output validation
```

Tool result, resource và metadata từ server đều có thể chứa prompt injection. Phải coi chúng là dữ liệu, không nâng nội dung “hãy bỏ qua policy” thành instruction. Secrets không nên xuất hiện trong prompt/trace và server phải thực thi least privilege.

Demo dùng **JSON-RPC-like contract để học**, chỉ mô phỏng `tools/list` và `tools/call`. Nó không triển khai lifecycle, capability negotiation, transports, notifications, cancellation, auth hay toàn bộ schema của MCP, nên **không được tuyên bố là MCP server đầy đủ**. Khi làm thật, dùng [MCP specification](https://modelcontextprotocol.io/specification/latest) và SDK chính thức phù hợp phiên bản.

## Khi nào dùng / không dùng

**Dùng protocol/connector khi:** nhiều client cần tích hợp cùng capability; cần discovery/schema/versioning; muốn tách agent runtime khỏi dịch vụ dữ liệu.

**Không nên dùng khi:** một lời gọi hàm nội bộ đã đủ; capability quá nhạy cảm nhưng chưa có auth/audit; dùng MCP chỉ để che một API không ổn định; tin rằng protocol tự giải quyết prompt injection hoặc quyền truy cập.

## Ví dụ thực tế

Client liệt kê tool `notes.read`, sau đó đọc một note trong virtual workspace. Server validate JSON-RPC envelope, tool name, argument và path allowlist. Note cố chứa “IGNORE POLICY”, nhưng client chỉ hiển thị nó trong khung `UNTRUSTED TOOL DATA`. Các yêu cầu `shell.exec` và đọc `secrets/` đều bị từ chối.

## Lệnh chạy

```powershell
python Lessions/35-mcp-skills-connectors-protocols/src/demo.py
```

Demo chạy offline, không mở socket và không gọi dịch vụ ngoài.

## Bài tập

1. Thêm `resources/list` và cursor pagination nhưng giữ giới hạn số item.
2. Thêm request ID/idempotency cho tool có side effect.
3. Mô hình hóa approval hai trạng thái `pending/approved`, không dùng mặc định ngầm cho phép.
4. So sánh demo với MCP specification và liệt kê ít nhất năm phần còn thiếu.

## Checklist hoàn thành

- [ ] Tôi phân biệt protocol với SDK và discovery với authorization.
- [ ] Tôi phân biệt skill với connector/tool.
- [ ] Tôi không gọi demo này là MCP implementation đầy đủ.
- [ ] Input và output đều được xem qua trust boundary.
- [ ] Tôi chạy demo và thấy unknown tool/path bị chặn.

## Bài trước / bài sau

- Bài trước: [Lesson 34 — Multi-agent orchestration](../34-multi-agent-orchestration/README.md)
- Bài sau: [Lesson 36 — Evals, benchmarks và experiment design](../36-evals-benchmarks-experiment-design/README.md)
