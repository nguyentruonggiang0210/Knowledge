# Bài học tổng ôn CCAR-F Foundations cho người mới

Tài liệu này được biên soạn từ toàn bộ 162 câu trong `quiz_questions_answers.md`. Mục tiêu không phải là học thuộc vị trí đáp án, mà là hiểu các nguyên tắc lặp lại để vẫn chọn đúng khi đề đổi ví dụ hoặc cách diễn đạt.

> Lưu ý: đây là bài học bám theo logic và đáp án của bộ đề. Một số tên lệnh/cấu hình là kiến thức riêng của Claude Code và MCP trong phạm vi bài thi.

## 1. Bức tranh lớn: một agent hoạt động như thế nào?

Hãy hình dung agent là một nhân viên thông minh nhưng có ba giới hạn:

1. Agent chỉ biết những gì đang nằm trong **context** hiện tại.
2. Agent chỉ làm được những hành động mà **tool** được cấp cho phép.
3. Agent có thể suy luận sai, nên các quy tắc quan trọng phải được **hệ thống bên ngoài thực thi**, không chỉ nhắc bằng lời.

Một vòng lặp agent cơ bản là:

```text
Yêu cầu người dùng
    ↓
Model suy luận và chọn tool
    ↓
Ứng dụng chạy tool
    ↓
Kết quả tool được thêm vào conversation
    ↓
Model đọc kết quả và quyết định bước tiếp theo
    ↓
Hoàn thành / thử lại / hỏi thêm / chuyển cho con người
```

Điểm rất quan trọng: API là **stateless**. Nếu ứng dụng không gửi lại các message cũ trong lần gọi tiếp theo, model không nhớ chúng. Đây là ý chính của câu 58, 77 và 99.

## 2. Khám phá codebase và chọn chế độ làm việc

### 2.1. Dùng đúng công cụ tìm kiếm

- **Glob** tìm theo tên hoặc mẫu đường dẫn, ví dụ `**/*test*.py`.
- **Grep** tìm nội dung bên trong file, ví dụ chuỗi lỗi `SYNC_CONFLICT`, câu lệnh import hoặc `eval(`.
- **Read** dùng sau khi đã thu hẹp phạm vi để hiểu ngữ cảnh.
- **Edit/Write** dùng để sửa. Nếu Edit không tìm được đoạn neo duy nhất do file lặp cấu trúc, đọc toàn file rồi ghi lại nội dung đã chỉnh là lựa chọn đáng tin cậy trong logic câu 2.

Quy tắc nhớ: **tìm rộng bằng chỉ mục, đọc hẹp theo dấu vết**. Không đọc tuần tự hàng trăm file và cũng không chỉ grep một cái tên rồi cho rằng đã hiểu luồng chương trình.

Ví dụ, muốn xóa `calculateTax` an toàn:

1. Đọc module gốc và các wrapper.
2. Ghi lại mọi alias như `computeOrderTax`.
3. Grep từng tên trên toàn repo.
4. Đọc caller để xác nhận cách dùng thực tế.

### 2.2. Điều tra tăng dần thay vì lập kế hoạch cứng

Khi chưa biết kiến trúc hoặc nguyên nhân lỗi, kế hoạch phải thích nghi theo phát hiện mới:

```text
Tìm entry point → đọc router → thấy middleware → lần theo service
→ thấy repository → kiểm tra query/test/log → cập nhật giả thuyết
```

Một chuỗi bước cố định thường sai vì ta chưa biết trước đường đi. Với codebase lớn, hãy tìm entry point, theo import/call chain, xác định interface hoặc lớp nền trước rồi mới xem implementation cụ thể.

### 2.3. Direct execution hay plan mode?

- Thay đổi nhỏ, rõ và cục bộ: làm trực tiếp. Ví dụ thêm một điều kiện kiểm tra ngày ở một hàm (câu 102), hoặc lỗi production đã có stack trace rõ (câu 68).
- Thay đổi lớn, phá vỡ tương thích hoặc ảnh hưởng nhiều module: vào plan mode, lập bản đồ phạm vi rồi mới sửa. Ví dụ nâng thư viện auth v2 lên v3 trong 45 file (câu 87).
- Nhiệm vụ mở như “thêm test cho 200 file”: map cấu trúc, tìm module liên kết cao, ưu tiên vùng rủi ro lớn và điều chỉnh kế hoạch khi phát hiện dependency (câu 109).

Mẹo thi: **độ mơ hồ và bán kính ảnh hưởng càng lớn thì càng cần khám phá/lập kế hoạch; việc càng cục bộ và rõ thì càng nên thực thi trực tiếp**.

### 2.4. Phát triển lặp có kiểm chứng

Khi các lỗi phụ thuộc nhau, sửa một biến tại một thời điểm rồi kiểm tra. Với thuật toán phức tạp, hãy viết test cho hành vi thường, edge case và hiệu năng trước; cho code chạy qua test và dùng lỗi test làm feedback cho vòng tiếp theo. Một ví dụ input/output cụ thể thường hiệu quả hơn lời nhắc chung chung “hãy sửa tốt hơn”.

### 2.5. Đưa quy ước vào đúng nơi

- Quy tắc chung của dự án: `CLAUDE.md`.
- Quy tắc theo loại đường dẫn: `.claude/rules/` với path scoping.
- Quy trình dùng chung cho team và gọi như skill: `.claude/skills/<tên>/SKILL.md`, commit vào version control.
- Tài liệu chuẩn riêng từng package: dùng `@imports` trong `CLAUDE.md` của package.
- File mẫu cần tham chiếu cho một nhiệm vụ: dùng `@references`.
- Nếu quy tắc dường như tải không ổn định: chạy `/memory` để kiểm tra file memory nào thực sự được nạp.
- Hành vi bắt buộc, có thể tự động hóa như format: dùng Post ToolUse hook chạy Prettier sau Edit/Write, đừng chỉ tăng chữ “MUST”.

## 3. Session, context và memory

### 3.1. Continue, resume và fork

- `--continue`: tiếp tục cuộc trò chuyện gần nhất.
- `--resume <tên>`: quay lại đúng session đã đặt tên.
- `fork_session`: tách hai nhánh từ cùng một nền kiến thức để thử hai phương án độc lập.

Nếu code thay đổi sau khi lưu session, vẫn có thể resume để giữ công sức cũ, nhưng phải báo rõ file/hàm nào đã thay đổi và đọc lại phần đó. Không cần bỏ toàn bộ context, cũng không được giả vờ code vẫn như cũ.

Fork phù hợp khi cần so sánh hai chiến lược từ cùng một điểm xuất phát. Làm tuần tự trong cùng thread dễ khiến phương án thứ hai bị “neo” vào phương án thứ nhất.

### 3.2. Context dài không đồng nghĩa với trí nhớ bền

Context có giới hạn token và còn bị cạnh tranh bởi:

- system prompt;
- tool definitions;
- lịch sử user/assistant;
- output tool rất dài;
- tài liệu/RAG đã truy xuất.

Vì vậy tài liệu 190K token cộng schema tool 2.5K token và prompt có thể chạm cửa sổ 200K, làm phần cuối tài liệu bị xử lý kém (câu 73). Context mới dùng 35% vẫn có thể dùng sai sở thích cũ vì vấn đề là trạng thái mâu thuẫn, không phải thiếu chỗ (câu 157).

### 3.3. Chiến lược context lai

Không có một cách nén duy nhất cho mọi dữ liệu. Hãy chia thành ba lớp:

| Loại thông tin | Cách giữ |
|---|---|
| Sự thật phải chính xác lâu dài | Structured state / database / “story bible” |
| Kết luận và quyết định cũ | Progressive summary |
| Trao đổi đang hoạt động | Giữ nguyên văn các lượt gần đây |

Ví dụ tiệc tối: dị ứng hải sản, số khẩu phần và định nghĩa 68°F phải thành dữ liệu cấu trúc; trao đổi chung có thể tóm tắt; vài lượt mới giữ nguyên. Với bài báo khoa học, p-value và sample size nên lưu trong kho fact có cấu trúc, không chỉ nằm trong tóm tắt văn xuôi.

Các mẫu quan trọng:

- Scratchpad lưu phát hiện khi khám phá code lâu.
- Session cũ quá nặng: tạo session mới, bơm structured summary và gọi tool mới để lấy trạng thái hiện hành.
- RAG tích lũy lấn lịch sử: chỉ giữ kết quả RAG của 2–3 query gần nhất.
- Sở thích thay đổi: duy trì object “current preferences”, cập nhật và gửi ở mỗi request.
- Truyện dài: giữ “story bible”, chỉ tóm tắt brainstorming.

### 3.4. Giữ hành vi ổn định

Persona và quy tắc hành vi toàn cục phải ở system prompt. Tuy nhiên trong hội thoại dài, phản hồi tích lũy có thể làm ảnh hưởng của chỉ dẫn bị loãng. Có thể:

- rút prompt dài thành nguyên tắc ngắn, tổng quát;
- dùng few-shot để minh họa hành vi;
- nhắc lại guideline quan trọng bằng user-role message ở điểm chuyển tự nhiên;
- đưa trạng thái hệ thống mới nhận được, như “đơn đã giao”, vào system prompt trước request kế tiếp;
- version system prompt theo conversation, tránh đổi phong cách giữa một cuộc trò chuyện đang kéo dài.

`--system-prompt` có thể thay thế prompt mặc định của Claude Code. Nếu cần giữ hướng dẫn built-in về đọc và điều hướng repo, dùng `--append-system-prompt` để bổ sung chỉ dẫn review (câu 159).

## 4. Structured extraction: đúng JSON chưa chắc đúng dữ liệu

### 4.1. Ba tầng đúng

1. **Syntax**: JSON có parse được không?
2. **Schema**: đúng field, type, enum và required không?
3. **Semantic**: giá trị có đúng nghĩa và đúng nguồn không?

Tool use với input schema giải quyết rất tốt tầng 1–2, nhưng không tự bảo đảm tầng 3. Ví dụ `"30 minutes"` vẫn là string hợp lệ dù bị nhét nhầm vào trường số lượng nguyên liệu.

Muốn output bắt buộc theo schema, định nghĩa tool có input schema chính là cấu trúc cần lấy và đọc `tool_use` response. Nếu phải gọi đúng một tool trước, đặt `tool_choice` tới tên tool. Nếu có nhiều schema theo loại tài liệu nhưng tool nào cũng chấp nhận được, dùng `tool_choice: "any"` để bắt buộc gọi một trong số chúng.

### 4.2. Schema phải biểu diễn được thực tế

Schema tốt không ép thế giới vào các lựa chọn quá hẹp:

- Thông tin không được nói đến: cho phép `null` và chỉ dẫn “không suy đoán”.
- Danh sách không có bằng chứng: dùng mảng rỗng, không bịa phần tử.
- Sentiment mơ hồ: thêm `unclear`.
- Enum có long tail: thêm `other` và trường chi tiết.
- Hợp đồng có sửa đổi: giữ nhiều giá trị cùng source location và effective date, thay vì tự chọn một giá trị rồi mất dấu lịch sử.

Nguyên tắc: **schema phải bảo toàn bằng chứng và độ bất định**.

### 4.3. Few-shot dùng khi nào?

Schema nói “hình dạng”; few-shot dạy “cách hiểu”. Dùng 2–3 cặp input/output tiêu biểu khi model:

- chuẩn hóa vật liệu không nhất quán;
- không nhận ra citation/methodology ở nhiều bố cục;
- tách compound skills quá to hoặc quá nhỏ;
- xử lý đơn vị đời thường như “một nắm”, “một chút”;
- bỏ sót nhánh chưa test;
- tạo test hời hợt;
- không hiểu quy ước riêng của đội.

Few-shot hiệu quả nhất khi minh họa đúng lỗi thực tế và cả biên giữa “được phép” với “phải báo lỗi”.

### 4.4. Validation và tự sửa

Khi schema hợp lệ nhưng phép tính hoặc định dạng nghiệp vụ sai:

1. Giữ cả dữ liệu trích xuất và dữ liệu dẫn xuất, ví dụ `stated_total` và `calculated_total`.
2. Tính cờ nhất quán.
3. Nếu fail, gửi lại document + output cũ + lỗi validation để model sửa.
4. Nếu vẫn không thể vì dữ liệu không có trong input, retry không giúp; chuyển review hoặc trả `null`.

Retry chỉ hiệu quả khi model có đủ thông tin để tự sửa. Không thể retry để tìm danh sách đồng tác giả chỉ tồn tại trong một tài liệu bên ngoài chưa được cung cấp.

### 4.5. Confidence và human review

Không dùng confidence thô theo cảm tính. Hãy:

- hiệu chuẩn threshold bằng tập validation đã gắn nhãn;
- đánh giá theo từng field và từng loại tài liệu, không chỉ accuracy tổng;
- output confidence cấp field, `requires_review`, và `review_reasons`;
- vẫn lấy mẫu ngẫu nhiên phân tầng từ nhóm high-confidence để đo lỗi “tự tin nhưng sai” và phát hiện mẫu lỗi mới.

Nếu human chỉ kiểm được 20%, ưu tiên ca dưới threshold đã hiệu chuẩn; nhưng vẫn dành một phần audit cho nhóm tự tin cao.

### 4.6. Tài liệu dài và batch

- Tài liệu dài, thông tin rải rác: chia chunk, extract từng chunk, merge và deduplicate.
- Batch fail do context: chỉ gửi lại item lỗi theo `custom_id`, sau khi chia nhỏ; không chạy lại toàn bộ batch.
- Khối lượng lớn không gấp: Batch API tiết kiệm 50% nhưng có cửa sổ xử lý tới 24 giờ.
- Dữ liệu đến liên tục với SLA 30 giờ: gom batch định kỳ, ví dụ mỗi 4 giờ, tạo dư địa cho cửa sổ 24 giờ và retry.
- Báo cáo khẩn dưới 30 phút: dùng Messages API thời gian thực; dữ liệu thường mới dùng batch.
- Với 50.000 tài liệu: batch toàn bộ, phân loại lỗi, cải tiến prompt theo failure mode rồi batch lại các ca fail.

## 5. Thiết kế tool và MCP để model chọn đúng

### 5.1. Description là giao diện dành cho model

Tên và JSON type chưa đủ. Mỗi tool/parameter cần mô tả:

- dùng khi nào;
- không dùng khi nào;
- input có format gì;
- output gồm gì;
- khác tool gần giống ở điểm nào.

Ví dụ `delete_file` phải nói không dùng cho backup nếu policy yêu cầu archive. `user_id` nên mô tả “UUID của user cần cập nhật (bắt buộc)”. Khi agent bỏ qua tool MCP chuyên dụng để dùng Grep/sed, hãy làm rõ lợi ích, use case, input/output trong description trước khi nghĩ đến xóa tool nền tảng.

### 5.2. Tách hay gộp tool?

Hai nguyên tắc tưởng đối lập nhưng thực ra bổ sung nhau:

- **Tách** khi một tool có nhiều mục đích hoặc các operation cần bộ tham số khác nhau. Ví dụ refund, cancel và reship nên là ba tool; cardio và strength có schema riêng.
- **Gộp** khi hai tool trùng nghĩa hoặc tạo race condition. Ví dụ `issue_credit` và `process_refund` gây nhầm có thể gom thành hành động bồi hoàn rõ ràng; check slot rồi book nên gộp thành thao tác atomic.

Câu hỏi tự kiểm tra:

```text
Các thao tác khác intent hoặc khác required fields? → TÁCH
Các thao tác cùng intent, chồng nghĩa hoặc phải nguyên tử? → GỘP
```

### 5.3. Dùng ID chuẩn thay vì nhiều chuỗi mơ hồ

Đừng bắt model tự phối `game_date + home_team + away_team` nếu có thể chọn nhầm. Tạo `search_games` trả về `game_id`, rồi mutation chỉ nhận `game_id`. Tương tự, tool search nên trả ID và metadata có cấu trúc để các bước sau dùng trực tiếp.

### 5.4. Giảm không gian lựa chọn

18 tool cùng lúc khiến chọn sai nhiều hơn 4–5 tool liên quan. Chỉ cấp tool đúng vai trò cho từng subagent. Với 50 connector, dùng discovery tool để tìm rồi **động nạp** connector phù hợp; connector chưa discover thì chưa callable.

MCP resources thích hợp để công bố catalog có thể đọc như danh mục issue, cây tài liệu và database schema. Nhờ vậy agent biết server chứa gì trước khi gọi 8–10 tool dò đường.

Các tool từ nhiều MCP server đã cấu hình được khám phá và khả dụng đồng thời. Phạm vi cấu hình:

- Team/project server: `.mcp.json`.
- Server cá nhân thử nghiệm: `~/.claude.json`.

## 6. Output tool và xử lý lỗi

### 6.1. Structured output giúp bước sau chắc chắn hơn

Thay vì trả chuỗi “Portfolio is worth…”, hãy trả object có field rõ. Lợi ích chính không phải JSON ít token hoặc tự xác minh API, mà là agent/bộ điều phối lấy đúng giá trị mà không parse văn bản tự do.

Kết quả nên chỉ chứa dữ liệu liên quan. Nếu `lookup_order` trả 40 field nhưng bài toán hoàn hàng chỉ cần item, ngày mua, return window và status, hãy cô đọng trước khi context phình lên. Với kết quả nhiều trang, trả trang đầu + tổng số match + cursor, không tự tải 200 kết quả.

### 6.2. Phân loại lỗi đúng tầng

- Request MCP sai cấu trúc/protocol, như thiếu tham số bắt buộc ở cấp gọi: JSON-RPC protocol error.
- Tool đã chạy nhưng nghiệp vụ/API bên dưới trả 404/503: tool result có `isError: true`.

Đừng trả chỉ “Operation failed”. Error tốt nên có:

```json
{
  "error_category": "transient | validation | permission | business",
  "is_retryable": false,
  "reason": "Order exceeds return window",
  "user_message": "Đơn hàng đã quá thời hạn hoàn tiền"
}
```

### 6.3. Ai chịu trách nhiệm retry?

- Timeout, 503, lỗi mạng tạm thời: tool tự retry với exponential backoff.
- Sai cú pháp, validation, permission, business rule: trả ngay lỗi mô tả cụ thể để agent sửa input, dùng tool khác, giải thích hoặc escalates.

Làm vậy tiết kiệm turn và tránh model lặp vô ích.

## 7. An toàn: biến quy tắc thành kiến trúc

Prompt không phải hàng rào bảo mật. Nếu hoàn tiền trên $500 cần duyệt, kiểm tra ngưỡng **bên trong tool/backend**. Dù model bị prompt thế nào, tool chỉ tạo pending approval chứ không giải ngân.

Ba mẫu quan trọng:

1. **Preview → confirm → execute**: preview trả thông tin tác động và token dùng một lần; execute bắt buộc token đó. Mạnh hơn một cờ `dry_run` mà model có thể bỏ qua.
2. **Xác nhận đúng đối tượng**: hiển thị các record gần giống cùng field phân biệt, người dùng chọn một lần trước khi xóa.
3. **Hook chặn hành động**: nếu tool call vượt giới hạn chính sách, hook block và chuyển human escalation.

Nếu yêu cầu “bảo đảm mọi vòng lặp kết thúc bằng resolution hoặc escalation”, cần orchestration-layer kiểm tra outcome sau **mọi kiểu termination**, kể cả hết `max_turns`, rồi tự gọi escalation nếu chưa có terminal state. Chỉ dặn model không tạo ra bảo đảm tuyệt đối.

## 8. Multi-agent orchestration

### 8.1. Coordinator không chia sẻ trí nhớ bằng phép màu

Subagent chỉ biết output trước đó nếu coordinator đưa vào prompt hoặc cấp quyền đọc shared store. Luồng điển hình:

```text
Search agents ──┐
                ├─> Coordinator gom output + nguồn ─> Synthesis ─> Report
Document agents ┘
```

Nếu synthesis nói “không có findings”, nguyên nhân thường là coordinator không truyền output. Để giữ citation, mỗi agent phải trả claim-source mapping hoặc tách `content` khỏi metadata nguồn; synthesis phải bảo toàn mapping đó.

Khi context lớn, không chuyển 120K token thô. Chuyển synthesis draft cùng source index ánh xạ claim → URL/excerpt. Có thể lưu structured report ở vị trí chung, truyền reference ID và cấp read access.

### 8.2. Khi nào song song, tuần tự hay động?

- Song song: các việc độc lập, ví dụ tìm web và phân tích tập tài liệu độc lập; phát hai Task call trong cùng response.
- Tuần tự/prompt chaining: bước sau cần kết quả bước trước hoặc workflow cố định theo giai đoạn.
- Dynamic delegation: query rất đa dạng; coordinator chọn subagent dựa trên độ phức tạp.
- Fast path: câu factual đơn giản coordinator trả trực tiếp; chỉ query phân tích mới đi full pipeline.
- Fan-out/fan-in: chia 12 án lệ hay 45 file thành các nhóm song song rồi aggregate.

Coordinator muốn spawn agent phải được cấp `Task` trong `allowedTools`. Có AgentDefinitions thôi chưa đủ.

### 8.3. Phân việc theo mục tiêu, không micromanage

Prompt cho subagent nên nêu mục tiêu, tiêu chí chất lượng, phạm vi và format output. Không ép chuỗi query cứng vì tình huống thực tế có thể bất ngờ. Nhưng output phải đủ cấu trúc: ngày công bố/thu thập dữ liệu để không nhầm hai số liệu khác năm là mâu thuẫn; phần confirmed và contested riêng; dữ liệu tài chính dạng bảng, tin tức dạng văn xuôi.

Pipeline nghiên cứu tốt phải có vòng feedback:

```text
Search → Analyze → Synthesize → phát hiện gap
   ↑                              │
   └──── targeted re-search ──────┘
```

### 8.4. Không lạm dụng subagent

Spawn agent có chi phí latency và context. Follow-up chỉ cần tóm tắt điều coordinator đã biết thì coordinator làm luôn. Chỉ dùng subagent khi chuyên môn hóa, song song hóa hoặc tách context thực sự có lợi.

## 9. Customer support và escalation

Mục tiêu là giải quyết tối đa nhưng không cản quyền gặp người thật.

- Khách bực và đòi người thật nhưng chưa rõ vấn đề: thừa nhận cảm xúc, hỏi **một câu có mục tiêu**, rồi escalates với đủ thông tin.
- Nếu vấn đề đã rõ và agent giải quyết ngay được: nói có thể xử lý ngay, đồng thời cho họ quyền chọn escalation.
- Escalate khi khách yêu cầu, cần ngoại lệ/chấp thuận vượt quyền, hoặc agent không còn tiến triển có ý nghĩa.
- Trước escalation, tạo structured handoff: customer ID, order, root cause, amount, bước đã làm, trạng thái và đề xuất.
- Tool timeout sau khi đã xác nhận eligibility: giải thích điều đã biết, minh bạch lỗi hệ thống, đề nghị retry hoặc escalation; đừng giả vờ refund thành công.

Human agent không có transcript thì không nên nhận cả hội thoại thô; họ cần bản bàn giao cô đọng đủ hành động.

## 10. Prompting và trải nghiệm hội thoại

### 10.1. Hỏi ít nhưng đúng

Với ambiguity có thể đảo ngược, dùng context để đưa giả định hợp lý, nói rõ giả định và mời sửa. Chỉ hỏi khi lựa chọn làm thay đổi hành động đáng kể hoặc hành động không thể đảo ngược.

- “Set up my focus music” mơ hồ giữa play ngay và cấu hình lâu dài: hỏi một câu về loại hành động.
- “Giúp báo cáo” trong context đã đủ gợi ý: nêu giả định và bắt đầu, đừng hỏi ba câu cùng lúc.
- Đặt venue: có thể đề xuất dựa trên giả định; trước khi booking thật phải xác nhận ngày/số khách/ngân sách cần thiết.

### 10.2. Few-shot hơn luật điều kiện dài

Muốn tutor thay độ khó theo trình độ hoặc reviewer phân biệt cảnh báo thật/false positive, ví dụ đối chiếu cụ thể thường tốt hơn hàng trang quy tắc. Quy tắc tổng quát như “điều chỉnh độ sâu theo thuật ngữ và tín hiệu chuyên môn của người dùng” tốt hơn danh sách `if` dễ bỏ sót. Giữ điều kiện cứng cho safety, ví dụ chấn thương cần tư vấn chuyên môn.

### 10.3. Ép phần mở đầu khi cần

Nếu câu trả lời cứ bắt đầu “Certainly!”, có thể prefill một partial assistant message với mở đầu trực tiếp để model viết tiếp. Đây là kỹ thuật điều khiển hình thức, không thay cho system prompt về hành vi lâu dài.

## 11. Đánh giá chất lượng và code review

### 11.1. Precision và recall

- Precision cao: trong các lỗi đã báo, nhiều lỗi là thật.
- Recall cao: trong tổng số lỗi thật, tìm được nhiều lỗi.

Prompt “chỉ báo khi chắc chắn” tăng precision nhưng làm mất lỗi thật. Để tăng recall mà vẫn kiểm soát noise:

1. Stage tìm kiếm tối ưu coverage, ghi confidence và severity.
2. Stage sau đặt threshold/filter.

Nếu một prompt nhiều mục tiêu làm các tiêu chí cạnh tranh, tách prompt tập trung theo nhóm như security/API và business logic, rồi merge findings. Workflow cố định style → security → docs là prompt chaining.

### 11.2. Review cần nhìn ngoài diff

Một API call chỉ chứa diff và changed files không tìm được caller ở unchanged files. Biến review thành agentic task có giới hạn turn, cho phép Read/Grep/Glob và lần reference trong repo. PR quá lớn làm output JSON vượt `max_tokens` thì chia changed files thành nhiều API call và merge mảng findings.

Review code do chính session vừa viết dễ bị thiên kiến với lý luận trước đó. Independent/CI review có góc nhìn mới và dễ chất vấn quyết định hơn (câu 151).

### 11.3. Chất lượng test

Muốn test tốt ngay từ đầu, ghi trong `CLAUDE.md`:

- thế nào là behavioral test có giá trị;
- edge case cần quan tâm;
- fixture có sẵn và cách dùng;
- ví dụ test tốt so với assertion hời hợt;
- tránh trùng coverage hiện có.

Few-shot một nhánh chưa phủ kèm review comment cụ thể giúp model học cách nhận ra branch-level gap.

## 12. Chi phí, latency và giới hạn chạy

- Batch chỉ phù hợp nếu feedback trễ tới 24 giờ vẫn còn giá trị. Đây là câu hỏi nghiệp vụ/SLA, không chỉ là tiết kiệm 50%.
- Câu đơn giản cần fast path; đừng bắt đi qua bốn agent.
- Công việc độc lập chạy song song.
- Output/tool result dài phải lọc hoặc phân trang.
- CLI non-interactive có thể dùng `--max-turns 10 --max-budget-usd 2.00` để giới hạn lượt và chi phí mỗi invocation.
- Giới hạn turn/budget chỉ dừng vòng lặp; muốn chắc chắn có kết thúc nghiệp vụ, orchestration vẫn phải kiểm tra terminal outcome và fallback escalation.

## 13. Công thức chọn đáp án nhanh

Khi phân vân, chạy lần lượt các câu hỏi sau:

1. **Thiếu thông tin hay thiếu cấu trúc?** Thiếu thông tin thật thì `null`/review; thiếu cấu trúc thì schema/tool use.
2. **Lỗi transient hay permanent?** Transient retry trong tool; permanent trả metadata rõ cho agent.
3. **Quy tắc chỉ là hướng dẫn hay phải bảo đảm?** Hướng dẫn đặt prompt; bảo đảm đặt trong tool/backend/hook/orchestrator.
4. **Nhiệm vụ độc lập hay phụ thuộc?** Độc lập song song; phụ thuộc chaining.
5. **Tool khác intent hay chồng nghĩa?** Khác intent/params thì tách; chồng nghĩa/race thì gộp.
6. **Dữ liệu cần nhớ là fact hay trò chuyện?** Fact vào structured state; chuyện cũ tóm tắt; lượt mới giữ nguyên.
7. **Việc nhỏ rõ hay lớn mơ hồ?** Nhỏ làm trực tiếp; lớn map và plan.
8. **Đang tối ưu syntax hay semantic?** JSON schema không chữa được giá trị sai nghĩa; cần examples, validation, confidence và review.
9. **Có cần con người hành động tiếp không?** Truyền structured handoff, không dump transcript.
10. **Đáp án có hứa tuyệt đối chỉ bằng prompt không?** Thường là đáp án nhiễu nếu đề yêu cầu “guarantee”, “tamper-proof”, “cannot bypass”.

## 14. Các bẫy đáp án thường gặp

- “Đọc tất cả file” nghe toàn diện nhưng phá context và không theo quan hệ code.
- “Xóa tool cạnh tranh” né vấn đề thay vì cải thiện description/interface.
- “Dùng model lớn hơn” không thay thế quản lý state/context.
- “Retry mọi lỗi” lãng phí với lỗi permanent hoặc thông tin không tồn tại.
- “Random review 20%” đo tổng thể nhưng không ưu tiên rủi ro; cần confidence đã hiệu chuẩn, đồng thời audit mẫu high-confidence.
- “Chỉ tăng cường system prompt” không thực thi được policy an toàn.
- “Tóm tắt toàn bộ” có thể làm mất số liệu chính xác; phải tách fact quan trọng.
- “Spawn subagent cho mọi việc” tăng latency mà không thêm giá trị.
- “JSON tự bảo đảm API đúng” là sai: JSON chỉ bảo đảm hình dạng nếu schema hợp lệ.
- “Context window còn rộng nên không thể quên” là sai: sự loãng chỉ dẫn và state mâu thuẫn vẫn xảy ra.

## 15. Bản đồ ôn tập đủ 162 câu

Bảng dưới cho biết câu nào kiểm tra nguyên lý nào. Hãy dùng nó để quay lại đúng chương khi làm sai.

| Câu | Trọng tâm cần nhớ |
|---|---|
| 001–006 | Khám phá thích nghi; Read/Write khi Edit không neo được; resume/fork; alias-aware search |
| 007–015 | Scratchpad, context handoff, subagent, entry-point tracing, mô tả MCP tool |
| 016–024 | Schema bảo toàn sửa đổi; confidence; kiểm tra tổng; tool_choice; retry có giới hạn thông tin |
| 025–030 | Schema + normalization; enum `other`; validation theo segment; batch/SLA; few-shot |
| 031–040 | Tool chuyên biệt; quyền Task; state của agent; ngày dữ liệu; claim-source mapping |
| 041–045 | Fast path, truyền context cô đọng, song song hóa, bảo toàn citation |
| 046–056 | MCP error, structured handoff, escalation, retryability, enforcement bằng hook |
| 057–061 | Context hội thoại hỗ trợ; stateless API; session mới + summary; tổng tính toán |
| 062–070 | Subagent có mục tiêu; dynamic delegation; error metadata; feedback loop; safety token |
| 071–075 | Semantic repair; tool schema; context budget; `tool_choice:any`; validation feedback |
| 076–086 | Progressive summary; lịch sử messages; prompt dilution; structured state/fact store |
| 087–096 | Plan/direct execution; iterative tests; references/imports; schema extraction; agentic review |
| 097–105 | Backoff; split tool theo domain; stateless API; ambiguity; hook format; test case cụ thể |
| 106–116 | Parallel Task; chunk review; Grep; MCP resources; dynamic connector; atomic tool; error ownership |
| 117–126 | Confidence output; canonical ID; giảm tool; `/memory`; batch suitability; pagination; MCP error tầng |
| 127–136 | Fork; focused prompts; chaining; shared store; tool descriptions; confirmation; batch; prompt version |
| 137–145 | Test-first; path rules; gộp/tách tool; prompt nguyên tắc; Grep; test standards; policy trong backend |
| 146–154 | Structured output; RAG window; team skill; schema cho uncertainty; terminal guarantee; budget caps |
| 155–162 | Parameter description; story bible; current-state object; few-shot; append prompt; system prompt; MCP scope |

## 16. Đáp án tự kiểm tra

Chỉ dùng phần này sau khi đã tự giải. Mỗi mục có dạng `số câu: số lựa chọn đúng`.

```text
001:3 · 002:1 · 003:1 · 004:1 · 005:3 · 006:3 · 007:1 · 008:3 · 009:4 · 010:2 · 011:2 · 012:1 · 013:1 · 014:2 · 015:2 · 016:2 · 017:2 · 018:2
019:2 · 020:3 · 021:3 · 022:1 · 023:1 · 024:1 · 025:2 · 026:2 · 027:1 · 028:1 · 029:1 · 030:4 · 031:2 · 032:4 · 033:1 · 034:1 · 035:4 · 036:4
037:2 · 038:1 · 039:2 · 040:2 · 041:4 · 042:4 · 043:2 · 044:1 · 045:1 · 046:4 · 047:1 · 048:2 · 049:2 · 050:2 · 051:4 · 052:4 · 053:3 · 054:1
055:1 · 056:3 · 057:3 · 058:1 · 059:2 · 060:3 · 061:4 · 062:1 · 063:1 · 064:4 · 065:2 · 066:2 · 067:4 · 068:1 · 069:2 · 070:1 · 071:4 · 072:1
073:3 · 074:2 · 075:1 · 076:4 · 077:3 · 078:2 · 079:2 · 080:1 · 081:4 · 082:1 · 083:1 · 084:3 · 085:2 · 086:3 · 087:2 · 088:4 · 089:4 · 090:4
091:2 · 092:1 · 093:4 · 094:4 · 095:1 · 096:4 · 097:1 · 098:2 · 099:4 · 100:1 · 101:2 · 102:1 · 103:2 · 104:2 · 105:3 · 106:2 · 107:4 · 108:2
109:2 · 110:3 · 111:3 · 112:2 · 113:3 · 114:1 · 115:3 · 116:1 · 117:3 · 118:4 · 119:2 · 120:3 · 121:1 · 122:1 · 123:2 · 124:4 · 125:2 · 126:1
127:1 · 128:3 · 129:2 · 130:1 · 131:4 · 132:2 · 133:2 · 134:1 · 135:2 · 136:4 · 137:2 · 138:1 · 139:1 · 140:1 · 141:4 · 142:3 · 143:3 · 144:2
145:3 · 146:2 · 147:3 · 148:3 · 149:2 · 150:3 · 151:1 · 152:1 · 153:3 · 154:4 · 155:3 · 156:3 · 157:2 · 158:1 · 159:1 · 160:1 · 161:2 · 162:4
```

## 17. Cách học đề xuất trong 3 lượt

**Lượt 1 – Hiểu:** đọc chương 1–12, tự giải thích mỗi nguyên tắc bằng ví dụ của riêng bạn.

**Lượt 2 – Nhận dạng:** làm 162 câu nhưng trước khi nhìn lựa chọn, ghi câu đó thuộc cặp đối lập nào: plan/direct, retry/permanent, prompt/enforcement, split/merge, summary/state, parallel/sequential.

**Lượt 3 – Sửa lỗi:** chỉ học lại những câu sai theo bản đồ ở chương 15. Với mỗi câu sai, viết một dòng: “Tín hiệu trong đề là gì?” và “Vì sao đáp án mình chọn không giải quyết nguyên nhân gốc?”.

Nếu bạn nhớ một tư tưởng xuyên suốt, hãy nhớ câu này:

> Cho model đủ ngữ cảnh và giao diện rõ để suy luận; dùng schema để định hình dữ liệu; dùng code/hook/backend để bảo đảm những điều không được phép sai.
