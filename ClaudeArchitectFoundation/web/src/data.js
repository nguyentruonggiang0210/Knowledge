import {
  Bot, Braces, Boxes, Code2, Compass, Database, GitFork, MessagesSquare,
  Search, ShieldCheck, Sparkles, Workflow,
} from 'lucide-react'

export const chapters = [
  {
    id: 'agent-loop', number: '01', title: 'Agent hoạt động thế nào?',
    eyebrow: 'Nền tảng', icon: Bot, color: 'violet', questions: 'Câu 54, 58, 77, 99', duration: 7,
    summary: 'Hiểu vòng lặp suy luận–hành động và vì sao API không tự ghi nhớ hội thoại.',
    intro: 'Agent không phải một chương trình chạy đúng một lệnh. Nó quan sát yêu cầu, chọn công cụ, đọc kết quả rồi quyết định bước tiếp theo. Nhưng mỗi lần gọi API chỉ biết dữ liệu được gửi vào lần đó.',
    principles: [
      ['Context là trí nhớ làm việc', 'Model chỉ biết system prompt, message và tool result có trong request hiện tại.'],
      ['Tool tạo khả năng hành động', 'Model có thể mô tả một hành động nhưng không thể thực thi nếu tool tương ứng không được cấp.'],
      ['Orchestrator vận hành vòng lặp', 'Ứng dụng thực thi tool, đưa kết quả trở lại context và kiểm tra trạng thái kết thúc.'],
    ],
    callout: 'Nếu ứng dụng không gửi lại messages cũ, model sẽ “quên” ngay cả khi đó vẫn là cùng một người dùng.',
    visual: 'loop',
  },
  {
    id: 'code-exploration', number: '02', title: 'Khám phá codebase đúng cách',
    eyebrow: 'Developer workflow', icon: Search, color: 'cyan', questions: 'Câu 1–6, 13–14, 108–109, 131, 143', duration: 10,
    summary: 'Tìm rộng bằng pattern, đọc hẹp theo dấu vết và để kế hoạch thích nghi với phát hiện mới.',
    intro: 'Trong codebase lớn, đọc tất cả file vừa tốn context vừa không cho thấy quan hệ thực thi. Hãy bắt đầu từ dấu hiệu có độ phân biệt cao rồi lần theo import, caller và interface.',
    principles: [
      ['Glob tìm đường dẫn', 'Dùng khi biết mẫu tên file hoặc muốn lập bản đồ cấu trúc repo.'],
      ['Grep tìm nội dung', 'Dùng cho chuỗi lỗi, import, function name hoặc pattern nguy hiểm như eval(.'],
      ['Read để hiểu ngữ cảnh', 'Chỉ đọc file và vùng code đã được thu hẹp bởi kết quả tìm kiếm.'],
      ['Theo mọi alias', 'Đọc wrapper để tìm tên export lại rồi Grep từng tên trước khi xóa API.'],
    ],
    callout: 'Công thức: entry point → import/call chain → interface → implementation → tests.',
    visual: 'trace',
  },
  {
    id: 'workflow', number: '03', title: 'Plan, Execute, Resume & Fork',
    eyebrow: 'Cách làm việc', icon: GitFork, color: 'amber', questions: 'Câu 3–5, 10–12, 68, 87–90, 102, 127, 153', duration: 9,
    summary: 'Chọn direct execution cho việc nhỏ, plan cho thay đổi lớn và fork để so sánh độc lập.',
    intro: 'Chế độ làm việc phải tương xứng với độ mơ hồ và bán kính ảnh hưởng. Session giúp giữ công sức cũ; fork giữ cùng điểm xuất phát nhưng tránh hai phương án làm nhiễu nhau.',
    principles: [
      ['Direct execution', 'Việc nhỏ, rõ, cục bộ hoặc stack trace đã chỉ đúng vùng lỗi.'],
      ['Plan mode', 'Migration phá vỡ tương thích, nhiều module hoặc yêu cầu mở cần khám phá trước.'],
      ['Resume có cập nhật', 'Tiếp tục session cũ nhưng báo file nào đã đổi để đọc lại có mục tiêu.'],
      ['Fork session', 'Tạo hai nhánh độc lập khi cần so sánh hai chiến lược từ cùng context.'],
    ],
    callout: 'Độ mơ hồ × bán kính ảnh hưởng càng lớn, nhu cầu lập kế hoạch càng cao.',
    visual: 'decision',
  },
  {
    id: 'context', number: '04', title: 'Quản lý context & memory',
    eyebrow: 'Trí nhớ', icon: Database, color: 'rose', questions: 'Câu 7, 9, 48, 57, 60, 73, 76–86, 122, 147, 156–157', duration: 12,
    summary: 'Tách fact bền vững, tóm tắt quá khứ và giữ nguyên các lượt đang hoạt động.',
    intro: 'Context không chỉ chứa hội thoại; system prompt, tool definitions và RAG cũng chiếm token. Giải pháp tốt không phải giữ tất cả mà là giữ đúng dạng dữ liệu cho đúng thời gian.',
    principles: [
      ['Structured facts', 'Sở thích hiện tại, allergy, p-value và world rules cần lưu thành state có cấu trúc.'],
      ['Progressive summary', 'Kết luận và quyết định cũ được nén nhưng phải bảo toàn ý nghĩa.'],
      ['Recent verbatim', 'Giữ nguyên các lượt gần đây của vấn đề đang hoạt động.'],
      ['Retrieval có giới hạn', 'RAG chỉ giữ kết quả 2–3 query gần nhất để không lấn lịch sử.'],
    ],
    callout: 'Còn nhiều context không có nghĩa là model sẽ tự chọn đúng giữa sở thích cũ và mới.',
    visual: 'layers',
  },
  {
    id: 'extraction', number: '05', title: 'Structured extraction',
    eyebrow: 'Dữ liệu', icon: Braces, color: 'cyan', questions: 'Câu 16–30, 61, 69–75, 85–86, 91, 117, 126, 134, 136, 149', duration: 14,
    summary: 'Phân biệt JSON hợp lệ, schema hợp lệ và dữ liệu đúng nghĩa.',
    intro: 'Structured output loại bỏ lỗi hình thức nhưng không tự loại bỏ lỗi semantic. Một pipeline đáng tin phải thiết kế schema sát thực tế, validate nghiệp vụ và biết khi nào cần con người.',
    principles: [
      ['Syntax', 'JSON parse được; tool use giúp bảo đảm cấu trúc đầu ra.'],
      ['Schema', 'Đúng field, type, enum và required; dùng other, null hoặc unclear khi cần.'],
      ['Semantic', 'Giá trị đúng nguồn và đúng ý nghĩa; kiểm bằng calculated fields và domain rules.'],
      ['Human review', 'Confidence phải hiệu chuẩn theo field và segment, kèm audit nhóm tự tin cao.'],
    ],
    callout: 'Schema định hình dữ liệu; few-shot dạy cách hiểu; validation phát hiện điều model vẫn có thể hiểu sai.',
    visual: 'pyramid',
  },
  {
    id: 'tool-design', number: '06', title: 'Thiết kế Tool & MCP',
    eyebrow: 'Giao diện', icon: Boxes, color: 'violet', questions: 'Câu 8, 15, 31, 67, 72, 91, 98, 110, 112–119, 132, 139–141, 146, 152, 155, 162', duration: 13,
    summary: 'Tool description rõ, schema hẹp và không gian lựa chọn nhỏ giúp agent hành động chính xác.',
    intro: 'Tool là API dành cho model. Tên, mô tả, tham số và output đều ảnh hưởng trực tiếp tới việc model có chọn đúng và truyền đúng dữ liệu hay không.',
    principles: [
      ['Description có tính hướng dẫn', 'Nêu khi dùng, khi không dùng, input/output và khác biệt với tool gần giống.'],
      ['Tách theo intent', 'Operation khác required fields nên có tool riêng: refund, cancel, reship.'],
      ['Gộp phần chồng nghĩa', 'Tool cùng intent hoặc cần atomicity nên hợp nhất để hết cạnh tranh/race.'],
      ['Dùng canonical ID', 'Search trả ID chuẩn, mutation chỉ nhận ID thay vì nhiều chuỗi mơ hồ.'],
    ],
    callout: 'Khác intent hoặc required fields → tách. Cùng intent, chồng nghĩa hoặc cần nguyên tử → gộp.',
    visual: 'splitmerge',
  },
  {
    id: 'errors', number: '07', title: 'Output & xử lý lỗi',
    eyebrow: 'Độ tin cậy', icon: Workflow, color: 'amber', questions: 'Câu 46, 52–53, 59, 65, 92–93, 97, 107, 114, 116, 123–125', duration: 10,
    summary: 'Retry lỗi tạm thời trong tool; trả lỗi vĩnh viễn có cấu trúc để agent phục hồi đúng.',
    intro: '“Operation failed” không đủ cho agent quyết định. Error cần cho biết loại lỗi, có retry được không, nguyên nhân và hành động hợp lý tiếp theo.',
    principles: [
      ['Transient', 'Timeout, 503 và lỗi mạng: retry tự động với exponential backoff trong tool.'],
      ['Permanent', 'Validation, permission và business rule: trả ngay metadata và hướng xử lý.'],
      ['Đúng tầng MCP', 'Request sai protocol là JSON-RPC error; backend fail là tool result isError.'],
      ['Output cô đọng', 'Trả field liên quan, ID, cursor và impact thay vì văn bản dài khó parse.'],
    ],
    callout: 'Để model phục hồi đúng, lỗi phải mô tả cả “điều gì xảy ra” và “có thể làm gì tiếp theo”.',
    visual: 'errors',
  },
  {
    id: 'safety', number: '08', title: 'Safety & enforcement',
    eyebrow: 'Guardrails', icon: ShieldCheck, color: 'rose', questions: 'Câu 50–56, 70, 115, 133, 145, 150', duration: 9,
    summary: 'Điều không được phép sai phải được thực thi bằng backend, hook hoặc orchestrator.',
    intro: 'Prompt chỉ hướng dẫn model; nó không phải hàng rào bảo mật. Ngưỡng tiền, xác nhận xóa và trạng thái kết thúc bắt buộc phải được khóa bằng kiến trúc.',
    principles: [
      ['Policy trong backend', 'Khoản trên $500 tự chuyển pending approval, bất kể model yêu cầu gì.'],
      ['Preview token', 'Preview trả impact + token dùng một lần; execute bắt buộc token đã xác nhận.'],
      ['Hook chặn hành động', 'Intercept tool call vượt quyền rồi chuyển human escalation.'],
      ['Terminal guarantee', 'Orchestrator kiểm tra mọi kiểu kết thúc và escalates nếu chưa resolution.'],
    ],
    callout: 'Nếu đề dùng từ guarantee, tamper-proof hoặc cannot bypass, đáp án chỉ dựa vào prompt thường là bẫy.',
    visual: 'shield',
  },
  {
    id: 'multi-agent', number: '09', title: 'Điều phối multi-agent',
    eyebrow: 'Orchestration', icon: GitFork, color: 'cyan', questions: 'Câu 32–45, 62–66, 106, 111, 119, 129–130', duration: 13,
    summary: 'Coordinator phải truyền state, chọn đúng kiểu phân rã và bảo toàn nguồn qua mọi bước.',
    intro: 'Subagent không tự nhìn thấy kết quả của agent khác. Coordinator phải truyền output hoặc reference, cấp tool phù hợp và quyết định song song, tuần tự hay fast path.',
    principles: [
      ['Parallel', 'Chạy đồng thời khi nhiệm vụ độc lập; phát nhiều Task call trong cùng response.'],
      ['Sequential', 'Dùng chaining khi bước sau cần output của bước trước.'],
      ['Dynamic routing', 'Coordinator chọn agent theo độ phức tạp; câu factual đi fast path.'],
      ['Source lineage', 'Mỗi claim đi cùng source metadata và được bảo toàn tới final report.'],
    ],
    callout: 'Có AgentDefinitions chưa đủ: coordinator phải có Task trong allowedTools để thực sự delegate.',
    visual: 'agents',
  },
  {
    id: 'conversation', number: '10', title: 'Hội thoại & escalation',
    eyebrow: 'Trải nghiệm', icon: MessagesSquare, color: 'violet', questions: 'Câu 47–55, 60, 81–84, 100–101, 135, 142, 161', duration: 9,
    summary: 'Hỏi ít nhưng đúng, dùng giả định có thể sửa và bàn giao có cấu trúc cho con người.',
    intro: 'Trải nghiệm tốt cân bằng giữa chủ động và an toàn. Không hỏi bốn câu trước mọi hành động, nhưng phải xác nhận trước lựa chọn không thể đảo ngược.',
    principles: [
      ['Giả định minh bạch', 'Dùng context để tiến hành, nói rõ giả định và mời người dùng sửa.'],
      ['Một câu có mục tiêu', 'Chỉ hỏi điều làm thay đổi hướng hành động đáng kể.'],
      ['Structured handoff', 'Customer, order, root cause, amount, status và next action.'],
      ['System prompt', 'Persona và hành vi bền vững phải được định nghĩa ở vai trò system.'],
    ],
    callout: 'Escalate khi người dùng yêu cầu, cần ngoại lệ vượt quyền hoặc agent không còn tiến triển có ý nghĩa.',
    visual: 'handoff',
  },
  {
    id: 'quality', number: '11', title: 'Đánh giá & code review',
    eyebrow: 'Quality', icon: Code2, color: 'amber', questions: 'Câu 69, 85, 94, 96, 128–129, 137, 144, 151, 158, 160', duration: 11,
    summary: 'Tách discovery và filtering, review ngoài diff, dùng examples và test làm feedback.',
    intro: 'Precision và recall thường đánh đổi. Một reviewer tốt cần tự do tìm rộng ở stage đầu, sau đó mới threshold, đồng thời nhìn được caller và dependency ngoài phần diff.',
    principles: [
      ['Coverage stage', 'Tìm mọi issue tiềm năng và gắn confidence, severity.'],
      ['Filter stage', 'Dùng threshold riêng để kiểm soát false positive.'],
      ['Agentic review', 'Cho Read/Grep/Glob để kiểm tra tương tác cross-file.'],
      ['Fresh perspective', 'Independent review ít bị neo vào lý luận của session vừa viết code.'],
    ],
    callout: 'Few-shot giúp phân biệt bug thật với pattern được chấp nhận tốt hơn lời nhắc chung “hãy thận trọng”.',
    visual: 'precision',
  },
  {
    id: 'cost', number: '12', title: 'Chi phí, latency & chiến thuật thi',
    eyebrow: 'Tổng kết', icon: Compass, color: 'rose', questions: 'Câu 20, 28, 30, 41–44, 107, 121, 124, 134, 136, 154', duration: 8,
    summary: 'Đặt đúng SLA, fast path, batch, pagination và giới hạn chạy; nhận diện bẫy bằng nguyên nhân gốc.',
    intro: 'Giải pháp tốt nhất không chỉ đúng kỹ thuật mà còn đúng SLA và chi phí. Batch rẻ hơn nhưng chậm; subagent mạnh hơn nhưng tốn latency; context đầy đủ hơn nhưng dễ quá tải.',
    principles: [
      ['Batch theo SLA', 'Chỉ dùng khi kết quả trễ tới 24 giờ vẫn còn giá trị.'],
      ['Fast path', 'Câu factual đơn giản không cần đi qua toàn bộ pipeline.'],
      ['Giới hạn trực tiếp', '`--max-turns` và `--max-budget-usd` chặn lượt và chi phí mỗi invocation.'],
      ['Tìm nguyên nhân gốc', 'Loại đáp án đọc tất cả, retry tất cả, spawn tất cả hoặc chỉ nhấn mạnh prompt.'],
    ],
    callout: 'Từ khóa thi: thiếu structure → schema; thiếu fact → null/retrieve; cần guarantee → code enforcement.',
    visual: 'compass',
  },
]

export const lessonDetails = {
  'agent-loop': {
    plain: 'Hãy tưởng tượng model là bộ não ngồi trong một căn phòng kín. Nó không tự nhìn thấy database, file hay lịch sử tài khoản. Mỗi request giống như một chiếc hộp được chuyển vào phòng: trong hộp có gì thì model biết thứ đó. Tool là những nút bấm để bộ não yêu cầu hệ thống bên ngoài hành động.',
    example: {
      title: 'Ví dụ: kiểm tra một đơn hàng',
      scenario: 'Người dùng hỏi: “Đơn #A102 của tôi đang ở đâu?” Agent cần lấy trạng thái thật thay vì đoán.',
      steps: [
        ['01', 'Model đọc yêu cầu', 'Nhận ra đây là dữ liệu hiện thời mà kiến thức có sẵn không thể trả lời.'],
        ['02', 'Model gọi lookup_order', 'Nó tạo tool call với order_id = A102; chính ứng dụng mới là bên chạy API.'],
        ['03', 'Tool trả dữ liệu', 'Kết quả “shipped, ETA Friday” được thêm vào conversation như một message mới.'],
        ['04', 'Model trả lời', 'Model dựa trên kết quả thật để giải thích, hoặc chọn tool tiếp theo nếu cần.'],
      ],
      conclusion: 'Nếu bước 03 không được gửi lại, model không biết tool đã tìm thấy gì. Nếu lượt sau không kèm lịch sử, model cũng không nhớ đơn A102.',
    },
    traps: ['Cho rằng cùng session ID thì API tự nhớ messages.', 'Cho rằng model đã nói “tôi sẽ gọi tool” nghĩa là tool thật sự được chạy.', 'Để model tự bịa trạng thái hiện thời thay vì dùng tool.'],
    check: 'Ứng dụng của bạn gọi API lần thứ hai nhưng chỉ gửi message mới nhất. Model có nhớ lượt đầu không?',
    checkAnswer: 'Không. API stateless; ứng dụng phải gửi lại lịch sử cần thiết hoặc một state/summary tương đương.',
  },
  'code-exploration': {
    plain: 'Khám phá code giống điều tra một đường ống bị rò. Bạn không tháo toàn bộ tòa nhà; bạn tìm dấu nước, lần ngược qua các khớp nối rồi chỉ mở đúng khu vực đáng nghi. Glob và Grep giúp tìm dấu vết, Read giúp hiểu quan hệ, còn kế hoạch được cập nhật sau mỗi phát hiện.',
    example: {
      title: 'Ví dụ: lỗi SYNC_CONFLICT chưa rõ service nào tạo',
      scenario: 'Monorepo có 12 service. Log chứa chuỗi hiếm “SYNC_CONFLICT: entity version mismatch”.',
      steps: [
        ['01', 'Grep chuỗi đặc trưng', 'Tìm chính “SYNC_CONFLICT” trên toàn repo; đây là dấu hiệu có độ phân biệt cao.'],
        ['02', 'Read file khớp', 'Đọc vùng tạo exception và các import để biết điều kiện phát sinh.'],
        ['03', 'Theo call chain', 'Tìm caller của hàm, route hoặc worker gọi vào nó; kiểm tra cả wrapper và alias.'],
        ['04', 'Xác nhận bằng test/log', 'Tìm test liên quan và đối chiếu input thực tế trước khi kết luận root cause.'],
      ],
      conclusion: 'Grep đưa bạn tới điểm bắt đầu, không phải kết luận cuối. Phải đọc ngữ cảnh và lần quan hệ thực thi.',
    },
    traps: ['Đọc tuần tự cả 200 file để “không bỏ sót”.', 'Chỉ tìm tên gốc mà bỏ qua tên được export lại.', 'Lập một chuỗi điều tra cố định trước khi biết kiến trúc.'],
    check: 'Bạn cần tìm mọi file import @company/auth. Glob hay Grep phù hợp hơn?',
    checkAnswer: 'Grep, vì bạn đang tìm một pattern nằm trong nội dung file. Glob phù hợp khi tìm theo tên hoặc đường dẫn.',
  },
  workflow: {
    plain: 'Plan không phải nghi thức bắt buộc trước mọi thay đổi. Nó là công cụ giảm rủi ro khi chưa biết đầy đủ phạm vi. Resume tiết kiệm công sức khám phá cũ; fork cho phép hai giả thuyết phát triển độc lập mà vẫn thừa hưởng cùng kiến thức ban đầu.',
    example: {
      title: 'Ví dụ: nâng thư viện auth v2 lên v3',
      scenario: '45 file import thư viện; API callback đổi thành Promise, User type đổi cấu trúc và ba method bị xóa.',
      steps: [
        ['01', 'Vào plan mode', 'Map mọi cách dùng API cũ, wrapper, type và test bị ảnh hưởng.'],
        ['02', 'Nhóm migration', 'Chia theo callback, User fields và deprecated methods thay vì sửa ngẫu nhiên từng file.'],
        ['03', 'Chọn thứ tự an toàn', 'Sửa abstraction nền trước, sau đó caller và cuối cùng là test/integration.'],
        ['04', 'Thực thi có checkpoint', 'Build/test sau từng nhóm để lỗi không chồng lên nhau.'],
      ],
      conclusion: 'Ngược lại, thêm một điều kiện ngày trong một hàm đã rõ không cần một kế hoạch nhiều giai đoạn.',
    },
    traps: ['Dùng plan mode dài cho thay đổi một dòng.', 'Tiếp tục session cũ mà không báo code vừa thay đổi.', 'Phân tích hai phương án trong một thread rồi tưởng chúng độc lập.'],
    check: 'Bạn đã phân tích hệ thống hôm qua và muốn thử microservice lẫn refactor tại chỗ. Cấu trúc session nào tốt nhất?',
    checkAnswer: 'Resume phân tích cũ rồi fork thành hai nhánh, mỗi nhánh phát triển một phương án.',
  },
  context: {
    plain: 'Context nên được xem như chiếc bàn làm việc, không phải kho lưu trữ vô hạn. Tài liệu đang dùng cần nằm trên bàn; facts quan trọng được ghi vào sổ; trao đổi cũ được tóm tắt; giấy RAG không còn liên quan phải dọn đi. Giữ mọi thứ nguyên văn sẽ khiến thông tin quan trọng bị chìm.',
    example: {
      title: 'Ví dụ: trợ lý lên thực đơn sau 40 phút',
      scenario: 'Khách có dị ứng hải sản nghiêm trọng, bữa ăn cho 8 người và “bơ nhiệt độ phòng” được định nghĩa là 68°F.',
      steps: [
        ['01', 'Trích fact bền vững', 'Lưu allergy, serving_count và user-defined terms trong object riêng.'],
        ['02', 'Tóm tắt thảo luận cũ', 'Nén tranh luận về trình bày và thời gian thành các quyết định đã thống nhất.'],
        ['03', 'Giữ recent turns', 'Bảo toàn nguyên văn các lượt đang chốt món để hội thoại tự nhiên.'],
        ['04', 'Gửi đủ ba lớp', 'Mỗi request có critical state + summary + recent messages.'],
      ],
      conclusion: 'Nếu chỉ dùng sliding window 25 lượt, allergy có thể biến mất. Nếu chỉ tóm tắt văn xuôi, con số 68°F có thể bị làm tròn hoặc mất.',
    },
    traps: ['Dùng model lớn hơn thay cho thiết kế memory.', 'Để sở thích cũ và mới cùng tồn tại mà không có current state.', 'Dồn mọi kết quả RAG cũ vào mọi request.'],
    check: 'Người dùng đổi ngân sách từ $500K lên $650K khi context mới dùng 35%. Có nên tăng context window không?',
    checkAnswer: 'Không. Đây là xung đột trạng thái; hãy cập nhật current_preferences và đưa object hiện hành vào mỗi request.',
  },
  extraction: {
    plain: 'Một kết quả có thể là JSON hoàn hảo nhưng vẫn sai nghiệp vụ. Hãy kiểm tra theo ba cổng: parse được, đúng schema, rồi đúng nghĩa. Schema cũng phải có chỗ biểu diễn “không biết”, “không có” và các trường hợp hiếm để model không bị ép phải bịa.',
    example: {
      title: 'Ví dụ: trích xuất hóa đơn',
      scenario: 'Model lấy ba line item 100, 200 và 50 nhưng stated_total trên hóa đơn là 380.',
      steps: [
        ['01', 'Tool schema', 'Buộc output có line_items, stated_total, calculated_total và is_total_consistent.'],
        ['02', 'Tính độc lập', 'Pipeline cộng line items thành 350 thay vì tin ngay con số tổng.'],
        ['03', 'Semantic validation', '350 ≠ 380 nên đánh dấu không nhất quán dù JSON hoàn toàn hợp lệ.'],
        ['04', 'Repair hoặc review', 'Gửi document + output + lỗi lại cho model; nếu vẫn mơ hồ thì chuyển người kiểm tra.'],
      ],
      conclusion: 'Schema xử lý hình dạng. Validation nghiệp vụ mới bắt được sai lệch ý nghĩa.',
    },
    traps: ['Tin rằng JSON schema xác minh dữ liệu nguồn.', 'Retry khi thông tin thực sự không có trong tài liệu.', 'Dùng accuracy tổng và bỏ qua một loại document đang sai nhiều.'],
    check: 'Bài review chỉ viết “Great product!” nhưng schema bắt buộc pros/cons. Output hợp lý là gì?',
    checkAnswer: 'Cho phép mảng rỗng vì không có chi tiết được nói rõ; không bịa ưu/nhược điểm. Sentiment mơ hồ cần enum unclear.',
  },
  'tool-design': {
    plain: 'Tool tốt giống một biểu mẫu chuyên dụng: người dùng nhìn vào là biết khi nào dùng và chỉ thấy các ô cần thiết. Một tool chung chung với nhiều tham số tùy chọn làm tăng số tổ hợp sai; quá nhiều tool gần nghĩa lại làm tăng xác suất chọn nhầm.',
    example: {
      title: 'Ví dụ: thiết kế tool quản lý đơn hàng',
      scenario: 'Một tool chung xử lý refund, cancel và reship; model thường quên amount khi refund và gửi shipping_address vào cancel.',
      steps: [
        ['01', 'Nhìn vào intent', 'Ba hành động có mục tiêu nghiệp vụ khác nhau.'],
        ['02', 'Nhìn required fields', 'Refund cần amount; cancel cần reason; reship cần address.'],
        ['03', 'Tách schema', 'Tạo refund_order, cancel_order và reship_order với đúng field của từng hành động.'],
        ['04', 'Mô tả ranh giới', 'Description nêu rõ khi dùng/không dùng và output trả về.'],
      ],
      conclusion: 'Nhưng check slot rồi book phải gộp atomic vì khoảng thời gian giữa hai call tạo race condition.',
    },
    traps: ['Tạo một tool “do_everything” với instruction tự do.', 'Cho mọi subagent cả 18 tool không liên quan.', 'Dùng team name/date mơ hồ thay cho ID chuẩn từ lookup tool.'],
    check: 'issue_credit và process_refund liên tục bị chọn lẫn vì cùng giải quyết bồi hoàn. Nên tách thêm hay gộp?',
    checkAnswer: 'Gộp thành một interface compensation rõ ràng vì lỗi đến từ semantic overlap, không phải thiếu tool.',
  },
  errors: {
    plain: 'Một lỗi tốt là một quyết định được mã hóa. Agent cần biết lỗi thuộc loại gì, thử lại có ích không và hành động tiếp theo là gì. Những lỗi có thể phục hồi cơ học nên được tool xử lý để không tiêu tốn lượt suy luận.',
    example: {
      title: 'Ví dụ: search_catalog có hai failure mode',
      scenario: '8% call timeout rồi thành công khi thử lại; 4% sai cú pháp filter và không bao giờ tự hết.',
      steps: [
        ['01', 'Phân loại tại tool', 'Timeout = transient; malformed filter = validation/permanent.'],
        ['02', 'Ẩn retry cơ học', 'Tool tự retry timeout với exponential backoff trong giới hạn.'],
        ['03', 'Surface lỗi cần suy luận', 'Trả syntax error ngay với field sai và format mong đợi.'],
        ['04', 'Agent chọn recovery', 'Agent sửa filter hoặc hỏi đúng một thông tin còn thiếu, không bảo người dùng chờ.'],
      ],
      conclusion: 'Cùng chuỗi “Operation failed” cho cả hai lỗi khiến agent lúc retry vô ích, lúc escalates quá sớm.',
    },
    traps: ['Để agent dùng 3–4 turn retry một business error.', 'Trả stack trace dài mà không có category/retryable.', 'Tự fetch mọi page kết quả và làm response chậm 20 giây.'],
    check: 'MCP tool được gọi đúng schema nhưng calendar API trả 503. Đây là JSON-RPC error hay tool result isError?',
    checkAnswer: 'Tool result với isError: true. JSON-RPC error dành cho request/protocol malformed trước khi nghiệp vụ tool chạy đúng.',
  },
  safety: {
    plain: 'Model có thể hiểu và tuân thủ policy phần lớn thời gian, nhưng “phần lớn” không đủ cho tiền, quyền truy cập hay xóa dữ liệu. Hệ thống phải khiến hành động sai trở nên bất khả thi ngay cả khi model bị prompt injection hoặc chọn nhầm tool.',
    example: {
      title: 'Ví dụ: hoàn tiền trên $500',
      scenario: 'Policy yêu cầu manager approval, nhưng người dùng cố thuyết phục agent “bỏ qua lần này”.',
      steps: [
        ['01', 'Model gửi amount', 'Agent có thể yêu cầu refund $847 như bình thường.'],
        ['02', 'Backend kiểm policy', 'Tool tự so amount với ngưỡng $500, không tin quyết định của model.'],
        ['03', 'Chuyển trạng thái', 'Thay vì giải ngân, backend tạo pending approval và trả mã yêu cầu.'],
        ['04', 'Agent giải thích', 'Model thông báo đang chờ duyệt và tạo handoff cho người có thẩm quyền.'],
      ],
      conclusion: 'Dù system prompt bị bỏ qua, tiền vẫn không thể được giải ngân trái policy.',
    },
    traps: ['Chỉ thêm câu “NEVER refund above $500” vào prompt.', 'Dùng dry_run boolean nhưng cho phép gọi thẳng false.', 'Tin rằng max_turns tự bảo đảm escalation.'],
    check: 'Làm sao bảo đảm xóa thành viên luôn có preview được xác nhận?',
    checkAnswer: 'Tách preview và execute; preview cấp token dùng một lần gắn với action cụ thể, execute bắt buộc token đó.',
  },
  'multi-agent': {
    plain: 'Multi-agent giống một nhóm nghiên cứu: mỗi người có bàn làm việc và ghi chú riêng. Trưởng nhóm phải giao mục tiêu, thu báo cáo, chuyển bằng chứng cho người tổng hợp và phát hiện phần còn thiếu. Không ai tự biết đồng đội vừa tìm thấy gì.',
    example: {
      title: 'Ví dụ: báo cáo thị trường có 25 nguồn',
      scenario: 'Web agent tìm nguồn, document agents đọc tài liệu, synthesis viết luận điểm và report agent định dạng kết quả.',
      steps: [
        ['01', 'Fan-out', 'Chia tài liệu độc lập thành nhóm và chạy analysis song song.'],
        ['02', 'Structured output', 'Mỗi agent trả claim, source URL, ngày dữ liệu và excerpt liên quan.'],
        ['03', 'Fan-in', 'Coordinator gom kết quả, loại trùng và đưa claim-source map cho synthesis.'],
        ['04', 'Gap loop', 'Nếu synthesis thiếu token refresh, coordinator tạo search mục tiêu rồi tổng hợp lại.'],
      ],
      conclusion: 'Final report nhận draft cô đọng + source index, không cần nuốt lại 120K token thô.',
    },
    traps: ['Coordinator nói sẽ delegate nhưng không có Task trong allowedTools.', 'Spawn synthesis cho câu tóm tắt mà coordinator đã biết đáp án.', 'Tóm tắt làm rơi URL/page number trước bước viết báo cáo.'],
    check: 'Web search và phân tích một bộ tài liệu nội bộ không phụ thuộc nhau. Gọi thế nào?',
    checkAnswer: 'Phát cả hai Task call trong cùng response để chạy song song, sau đó coordinator gom kết quả.',
  },
  conversation: {
    plain: 'Một trợ lý tốt không biến mọi mơ hồ thành bảng câu hỏi dài. Nó tận dụng context cho các giả định có thể sửa, hỏi đúng điểm rẽ quan trọng và xác nhận trước hành động không thể đảo ngược. Khi chuyển người, nó bàn giao trạng thái công việc thay vì cả transcript.',
    example: {
      title: 'Ví dụ: khách đòi gặp người thật về hoàn hàng',
      scenario: 'Khách rất bực, nhưng lookup_order cho thấy đơn còn hạn và agent có thể xử lý ngay.',
      steps: [
        ['01', 'Thừa nhận cảm xúc', 'Không tranh luận hoặc bắt khách kể lại toàn bộ.'],
        ['02', 'Nói rõ khả năng', 'Thông báo vấn đề đủ điều kiện và có thể xử lý ngay bây giờ.'],
        ['03', 'Giữ quyền lựa chọn', 'Đề nghị hoàn tất ngay hoặc vẫn chuyển người theo mong muốn.'],
        ['04', 'Nếu chuyển người', 'Gửi customer, order, eligibility, việc đã làm và next action.'],
      ],
      conclusion: 'Cách này vừa tăng first-contact resolution vừa không phớt lờ yêu cầu escalation.',
    },
    traps: ['Hỏi 4 câu cùng lúc cho một yêu cầu có thể suy ra.', 'Dump 25 lượt chat cho human agent tự đọc.', 'Giả vờ refund thành công sau khi tool timeout.'],
    check: '“Set up my focus music” có thể là phát ngay hoặc cấu hình lâu dài. Nên hỏi gì?',
    checkAnswer: 'Một câu về action type: muốn phát nhạc ngay hay cấu hình sở thích cho những lần sau.',
  },
  quality: {
    plain: 'Review chất lượng là bài toán cân bằng: tìm rộng để không bỏ bug rồi lọc để không gây nhiễu. Nếu ép model chỉ nói điều chắc chắn ngay từ đầu, các race condition hoặc edge case ít hiển nhiên sẽ biến mất trước khi được đánh giá.',
    example: {
      title: 'Ví dụ: review bỏ sót race condition',
      scenario: 'Prompt yêu cầu “chỉ báo lỗi chắc chắn”; precision cao nhưng một lỗi cạnh tranh gây outage không được nêu.',
      steps: [
        ['01', 'Discovery stage', 'Tìm mọi issue hợp lý, cho phép giả thuyết và ghi confidence/severity.'],
        ['02', 'Đi ra ngoài diff', 'Dùng Grep/Read để kiểm tra caller, shared state và unchanged files.'],
        ['03', 'Validation stage', 'Xác minh evidence, chạy test/static analysis nếu có.'],
        ['04', 'Threshold stage', 'Chỉ post findings qua ngưỡng phù hợp với tolerance của team.'],
      ],
      conclusion: 'Recall được tối ưu trước, precision được quản lý sau; không bắt một prompt làm hai mục tiêu đối nghịch cùng lúc.',
    },
    traps: ['Chỉ đưa raw diff nên không thấy caller ở file không đổi.', 'Dùng cùng session tự review code vừa viết.', 'Đo chất lượng test chỉ bằng line coverage.'],
    check: 'Few-shot nào giúp tìm branch chưa test tốt nhất?',
    checkAnswer: 'Ví dụ gồm đoạn code có một nhánh cụ thể chưa phủ và review comment chỉ ra đúng test case bị thiếu.',
  },
  cost: {
    plain: 'Tối ưu hệ thống là chọn đúng chất lượng dịch vụ cho từng việc. Batch rẻ nhưng chậm; real-time nhanh nhưng đắt; subagent hữu ích nhưng thêm latency; output đầy đủ có ích nhưng có thể vượt token. Đáp án tốt luôn khớp SLA thực tế.',
    example: {
      title: 'Ví dụ: hai loại báo cáo cùng schema',
      scenario: 'Báo cáo tháng chỉ lưu trữ; exception report phải kích hoạt cảnh báo trong 30 phút.',
      steps: [
        ['01', 'Phân loại theo SLA', 'Hai tài liệu giống schema nhưng khác giá trị thời gian.'],
        ['02', 'Route standard reports', 'Đưa báo cáo tháng sang Batch API để tiết kiệm 50%.'],
        ['03', 'Route urgent reports', 'Dùng Messages API thời gian thực để đáp ứng 30 phút.'],
        ['04', 'Giới hạn vận hành', 'Đặt max-turns/budget và orchestration fallback cho terminal outcome.'],
      ],
      conclusion: 'Không có một pipeline tối ưu cho mọi request; routing mới là phần tạo hiệu quả.',
    },
    traps: ['Chọn batch chỉ vì rẻ mà không xét độ trễ 24 giờ.', 'Tải tự động 200 kết quả thay vì page + cursor.', 'Cho rằng max budget tự tạo resolution hoặc escalation.'],
    check: 'Yếu tố quyết định CI review có phù hợp Batch API là gì?',
    checkAnswer: 'Feedback đến trễ tối đa 24 giờ có còn actionable trong quy trình phát triển hay không.',
  },
}

export const lessonVisualGuides = {
  'agent-loop': {
    keywords: [
      { name: 'Context', note: 'Thông tin model nhìn thấy trong lần gọi hiện tại.', flow: ['System + messages', 'Model đọc', 'Suy luận có căn cứ'] },
      { name: 'Tool', note: 'Cánh tay nối model với hệ thống bên ngoài.', flow: ['Model tạo tool call', 'Ứng dụng thực thi', 'Trả tool result'] },
      { name: 'Agent loop', note: 'Chu kỳ lặp cho tới khi có kết quả cuối.', flow: ['Quan sát', 'Hành động', 'Đọc kết quả', 'Quyết định tiếp'] },
      { name: 'Stateless API', note: 'Server không tự giữ ký ức giữa hai request.', flow: ['Request #1 kết thúc', 'Không có memory tự động', 'Request #2 phải gửi lại state'] },
    ],
    applications: [
      ['Chatbot nhiều lượt', 'Mỗi API request gửi lại messages cần thiết', 'Người dùng hỏi tiếp mà agent vẫn hiểu “đơn đó” là đơn nào.'],
      ['Dữ liệu thời gian thực', 'Cho model gọi tool thay vì trả lời từ trí nhớ', 'Tra cứu trạng thái đơn, số dư hoặc lịch trống.'],
      ['Workflow nhiều bước', 'Orchestrator nối tool result vào vòng lặp', 'Lookup khách → tìm đơn → kiểm policy → refund.'],
    ],
    decision: 'Nếu câu trả lời phụ thuộc dữ liệu không nằm trong prompt hiện tại, hãy bổ sung context hoặc cấp tool; đừng yêu cầu model tự đoán.',
  },
  'code-exploration': {
    keywords: [
      { name: 'Glob', note: 'Tìm file theo tên hoặc mẫu đường dẫn.', flow: ['Pattern **/*test*', 'So khớp paths', 'Danh sách file'] },
      { name: 'Grep', note: 'Tìm chuỗi hoặc pattern bên trong nội dung file.', flow: ['Chuỗi SYNC_CONFLICT', 'Quét nội dung repo', 'Các dòng khớp'] },
      { name: 'Read', note: 'Đọc ngữ cảnh sau khi đã thu hẹp phạm vi.', flow: ['Kết quả Grep', 'Đọc file + lân cận', 'Hiểu logic'] },
      { name: 'Call-chain tracing', note: 'Lần từ entry point qua caller và dependency.', flow: ['Route', 'Middleware', 'Service', 'Database'] },
    ],
    applications: [
      ['Tìm nguồn chuỗi lỗi', 'Grep chuỗi đặc trưng rồi Read file khớp', 'Nhanh hơn đọc lần lượt 12 service.'],
      ['Tìm test trong repo', 'Glob theo tên test/spec trước', 'Tạo danh sách test files để ưu tiên đọc.'],
      ['Xóa API cũ', 'Đọc wrapper, tìm alias rồi Grep mọi tên', 'Không bỏ sót caller dùng tên domain khác.'],
    ],
    decision: 'Biết tên/path nhưng chưa biết nội dung → Glob. Biết text/import/error → Grep. Đã có điểm khớp → Read và lần call chain.',
  },
  workflow: {
    keywords: [
      { name: 'Direct execution', note: 'Thực hiện ngay khi phạm vi nhỏ và cách sửa đã rõ.', flow: ['Yêu cầu rõ', 'Sửa một vùng code', 'Chạy test xác nhận'] },
      { name: 'Plan mode', note: 'Khám phá và lập bản đồ trước khi thay đổi lớn.', flow: ['Khảo sát usage', 'Map tác động', 'Lập thứ tự', 'Implement'] },
      { name: 'Resume', note: 'Tiếp tục đúng session để giữ kiến thức đã tích lũy.', flow: ['Session đã lưu', 'Nạp context cũ', 'Đọc lại phần vừa đổi', 'Tiếp tục'] },
      { name: 'Fork', note: 'Tách nhiều nhánh từ cùng một điểm kiến thức.', flow: ['Context chung', 'Nhánh A: microservice', 'Nhánh B: in-place'], kind: 'branch' },
    ],
    applications: [
      ['Direct execution', 'Đổi validation trong một hàm, lỗi có stack trace rõ', 'Thêm kiểm tra event_date > now rồi chạy unit test.'],
      ['Plan mode', 'Migration, refactor cross-module hoặc yêu cầu mơ hồ', 'Map 45 nơi dùng auth v2 trước khi nâng v3.'],
      ['Resume', 'Quay lại investigation dài đã làm trước đó', 'Resume auth-deep-dive và báo ba file vừa đổi.'],
      ['Fork', 'So sánh hai phương án mà không muốn chúng ảnh hưởng nhau', 'Một nhánh thử E2E, nhánh còn lại thử snapshot.'],
    ],
    decision: 'Nhỏ + rõ → Direct. Lớn + chưa rõ tác động → Plan. Tiếp tục một hướng cũ → Resume. So sánh nhiều hướng từ cùng nền → Fork.',
  },
  context: {
    keywords: [
      { name: 'Structured state', note: 'Fact hiện hành được lưu bằng field rõ ràng.', flow: ['User đổi budget', 'Cập nhật budget=650K', 'Gửi state mới mỗi lượt'] },
      { name: 'Progressive summary', note: 'Nén phần cũ theo từng giai đoạn, giữ kết luận.', flow: ['20 lượt cũ', 'Rút decisions + facts', 'Summary cô đọng'] },
      { name: 'Recent verbatim', note: 'Giữ nguyên các lượt gần đây để bảo toàn sắc thái.', flow: ['Active issue', 'Giữ message gốc', 'Trả lời tự nhiên'] },
      { name: 'RAG window', note: 'Chỉ giữ retrieval gần nhất còn liên quan.', flow: ['Nhiều RAG results', 'Giữ 2–3 query mới', 'Giải phóng context'] },
    ],
    applications: [
      ['Trợ lý mua nhà', 'Dùng current-preferences object', 'Budget mới ghi đè budget cũ một cách xác định.'],
      ['Nghiên cứu dài hạn', 'Lưu số liệu chính xác trong fact store', 'Truy xuất đúng p-value thay vì dựa vào summary.'],
      ['Truyện nhiều chương', 'Giữ story bible, tóm tắt brainstorming', 'Tính cách nhân vật không bị thay đổi sau 40 lượt.'],
    ],
    decision: 'Cần chính xác và tồn tại lâu → structured state. Là kết luận cũ → summary. Đang trao đổi → recent verbatim. Là tài liệu tham khảo → retrieve khi cần.',
  },
  extraction: {
    keywords: [
      { name: 'Syntax validation', note: 'Kiểm tra output có parse được hay không.', flow: ['Raw output', 'JSON parser', 'Valid / malformed'] },
      { name: 'Schema validation', note: 'Kiểm field, type, required và enum.', flow: ['Parsed JSON', 'JSON Schema', 'Đúng cấu trúc'] },
      { name: 'Semantic validation', note: 'Kiểm giá trị có hợp lý theo nghiệp vụ.', flow: ['Line items', 'Tính tổng + rules', 'Đúng nghĩa?'] },
      { name: 'Human review', note: 'Chuyển ca rủi ro theo threshold đã hiệu chuẩn.', flow: ['Field confidence', 'Review rules', 'Approve / inspect'] },
    ],
    applications: [
      ['Hóa đơn', 'So stated_total với calculated_total', 'Bắt JSON đúng nhưng tổng tiền sai.'],
      ['Hợp đồng sửa đổi', 'Lưu value + source + effective date', 'Không nhầm điều khoản gốc với amendment.'],
      ['Review có giới hạn', 'Threshold theo field/document type', 'Ưu tiên ca rủi ro và audit mẫu high-confidence.'],
    ],
    decision: 'Output vỡ định dạng → tool schema. Output đúng dạng nhưng không nhất quán → semantic rules. Nguồn không có dữ liệu → null/review, không retry mù.',
  },
  'tool-design': {
    keywords: [
      { name: 'Tool description', note: 'Hướng dẫn model chọn đúng công cụ.', flow: ['Intent người dùng', 'Đọc when / not-when', 'Chọn tool'] },
      { name: 'Split tools', note: 'Tách khi intent hoặc required fields khác nhau.', flow: ['Tool nhiều operation', 'Nhóm theo intent', 'Schema chuyên biệt'] },
      { name: 'Merge tools', note: 'Gộp khi chức năng chồng nghĩa hoặc cần atomicity.', flow: ['Hai tool cạnh tranh', 'Một boundary chung', 'Không còn chọn nhầm'] },
      { name: 'Canonical ID', note: 'Lookup trước rồi dùng định danh duy nhất.', flow: ['Tên/ngày mơ hồ', 'Search trả game_id', 'Mutation bằng ID'] },
    ],
    applications: [
      ['Workout logging', 'Tách cardio và strength tool', 'Không còn measurement=reps cho chạy bộ.'],
      ['Appointment', 'Gộp find + book thành atomic tool', 'Tránh slot bị người khác lấy giữa hai call.'],
      ['Game score', 'Search game rồi update bằng game_id', 'Không chọn nhầm trận tái đấu cùng mùa.'],
    ],
    decision: 'Khác mục tiêu/required fields → tách. Cùng mục tiêu/chồng nghĩa hoặc có race → gộp. Đối tượng mơ hồ → lookup để lấy canonical ID.',
  },
  errors: {
    keywords: [
      { name: 'Transient error', note: 'Lỗi tạm thời có khả năng tự hết.', flow: ['Timeout / 503', 'Backoff + retry', 'Success hoặc hết giới hạn'] },
      { name: 'Permanent error', note: 'Lỗi không thể hết nếu lặp cùng input.', flow: ['Validation / permission', 'Không retry', 'Sửa input hoặc escalate'] },
      { name: 'isError tool result', note: 'Tool chạy đúng nhưng nghiệp vụ bên dưới thất bại.', flow: ['Tool invocation hợp lệ', 'Backend 404/503', 'Result isError=true'] },
      { name: 'Pagination cursor', note: 'Tải kết quả theo trang để kiểm soát latency.', flow: ['Page 1 + total', 'Agent cần thêm?', 'Gọi cursor tiếp'] },
    ],
    applications: [
      ['Airline API 503', 'Retry trong tool với exponential backoff', 'Agent không tốn 5 lượt lặp giống nhau.'],
      ['Filter sai cú pháp', 'Trả field và format mong đợi', 'Agent sửa query thay vì bảo thử lại sau.'],
      ['Catalog 200 kết quả', 'Trả page đầu + cursor', 'Người dùng thấy kết quả sớm hơn.'],
    ],
    decision: 'Cùng input có thể thành công sau ít phút → transient/retry. Cùng input chắc chắn tiếp tục fail → trả lỗi cụ thể để thay đổi hành động.',
  },
  safety: {
    keywords: [
      { name: 'Backend enforcement', note: 'Policy được kiểm bằng code tại nơi thực thi.', flow: ['Tool request', 'Policy check', 'Allow / pending approval'] },
      { name: 'Preview token', note: 'Ràng buộc execute với đúng hành động đã xem trước.', flow: ['Preview impact', 'User confirm', 'One-time token', 'Execute'] },
      { name: 'Safety hook', note: 'Chặn tool call trước khi hậu quả xảy ra.', flow: ['Model gọi action', 'Hook kiểm ngưỡng', 'Block / allow'] },
      { name: 'Terminal guarantee', note: 'Orchestrator bảo đảm resolution hoặc escalation.', flow: ['Loop dừng', 'Kiểm terminal state', 'Fallback escalate'] },
    ],
    applications: [
      ['Hoàn tiền', 'Backend tự khóa ngưỡng $500', 'Prompt injection không thể giải ngân trái phép.'],
      ['Xóa thành viên', 'Preview + confirmation token', 'Người dùng biết impact trước khi xóa.'],
      ['Hết max_turns', 'Orchestrator kiểm outcome sau loop', 'Tự escalates thay vì bỏ khách giữa chừng.'],
    ],
    decision: 'Nếu sai sót gây mất tiền, dữ liệu, quyền hoặc vi phạm compliance, hãy enforce ngoài model. Prompt chỉ dùng để hướng dẫn hành vi mềm.',
  },
  'multi-agent': {
    keywords: [
      { name: 'Coordinator', note: 'Phân việc, chuyển state và kiểm tra khoảng trống.', flow: ['Phân tích query', 'Chọn agents', 'Gom outputs', 'Quyết định tiếp'] },
      { name: 'Parallel fan-out', note: 'Chạy đồng thời các nhiệm vụ không phụ thuộc.', flow: ['Một task lớn', 'Agent A + B + C', 'Fan-in kết quả'], kind: 'branch' },
      { name: 'Prompt chaining', note: 'Bước sau dùng output của bước trước.', flow: ['Research', 'Analysis', 'Synthesis', 'Report'] },
      { name: 'Claim-source map', note: 'Giữ dấu vết nguồn qua mọi agent.', flow: ['Claim + URL', 'Synthesis giữ mapping', 'Report có citation'] },
    ],
    applications: [
      ['12 án lệ độc lập', 'Chia nhóm và chạy document agents song song', 'Giảm latency mà vẫn aggregate được.'],
      ['Review cố định ba bước', 'Dùng prompt chaining', 'Style → security → documentation → merge.'],
      ['Câu factual đơn giản', 'Coordinator dùng fast path', 'Không gọi bốn subagent cho một năm sự kiện.'],
    ],
    decision: 'Không phụ thuộc → parallel. Output trước là input sau → chain. Query đơn giản → fast path. Query thay đổi khó đoán → coordinator route động.',
  },
  conversation: {
    keywords: [
      { name: 'Reasonable assumption', note: 'Tiến hành với giả định có thể sửa và nói rõ.', flow: ['Đọc context', 'Nêu giả định', 'Đề xuất', 'Mời chỉnh'] },
      { name: 'Targeted question', note: 'Chỉ hỏi điểm làm thay đổi hướng hành động.', flow: ['Yêu cầu mơ hồ', 'Xác định decision point', 'Hỏi một câu'] },
      { name: 'Structured handoff', note: 'Chuyển trạng thái cần hành động, không dump chat.', flow: ['Facts + steps', 'Root cause + status', 'Human tiếp tục'] },
      { name: 'System prompt', note: 'Nơi đặt persona và hành vi bền vững.', flow: ['Global behavior', 'System role', 'Áp dụng mọi lượt'] },
    ],
    applications: [
      ['Gợi ý địa điểm', 'Giả định có thể sửa để đưa lựa chọn trước', 'Chỉ xác nhận đầy đủ trước khi booking thật.'],
      ['Khách rất bực', 'Thừa nhận + một câu có mục tiêu', 'Có đủ issue để human xử lý ngay.'],
      ['Trợ lý âm nhạc', 'Đặt tone và cách giải thích trong system prompt', 'Hành vi ổn định qua mọi user turn.'],
    ],
    decision: 'Có thể hoàn tác → nêu giả định và tiến hành. Không thể hoàn tác hoặc thay đổi mục tiêu lớn → hỏi xác nhận. Chuyển người → structured handoff.',
  },
  quality: {
    keywords: [
      { name: 'Recall', note: 'Tỷ lệ lỗi thật được hệ thống tìm thấy.', flow: ['Tất cả bug thật', 'Reviewer phát hiện', 'Recall = found / total'] },
      { name: 'Precision', note: 'Tỷ lệ cảnh báo được báo là lỗi thật.', flow: ['Tất cả findings', 'Xác minh bug thật', 'Precision = true / reported'] },
      { name: 'Agentic review', note: 'Reviewer dùng tool để nhìn ngoài diff.', flow: ['Đọc diff', 'Theo callers', 'Kiểm unchanged files', 'Finding'] },
      { name: 'Few-shot rubric', note: 'Ví dụ dạy ranh giới giữa đúng và sai.', flow: ['Code mẫu', 'Nhãn accept / flag', 'Áp dụng pattern mới'] },
    ],
    applications: [
      ['Bug detection', 'Discovery tối ưu recall, filter tối ưu precision', 'Không bỏ race condition chỉ vì chưa chắc 100%.'],
      ['PR đổi API', 'Agentic review tìm caller ở unchanged files', 'Phát hiện argument order cũ ngoài diff.'],
      ['Sinh unit test', 'CLAUDE.md có tiêu chí và examples', 'Giảm test chỉ assert “không throw”.'],
    ],
    decision: 'Sợ bỏ sót bug → tăng recall ở discovery. Team bị quá nhiều noise → threshold ở stage sau. Bug có thể cross-file → cần agentic tools.',
  },
  cost: {
    keywords: [
      { name: 'Batch API', note: 'Xử lý bất đồng bộ, rẻ hơn nhưng có thể trễ.', flow: ['Gom requests', 'Xử lý ≤24h', 'Nhận batch results'] },
      { name: 'Fast path', note: 'Đường ngắn cho câu đơn giản.', flow: ['Classify query', 'Simple', 'Coordinator trả ngay'] },
      { name: 'Turn budget', note: 'Giới hạn số vòng suy luận trong một invocation.', flow: ['Agent loop', 'Đếm turns', 'Dừng tại max'] },
      { name: 'Cost budget', note: 'Giới hạn chi phí tối đa cho một lần chạy.', flow: ['Token/tool usage', 'Theo dõi USD', 'Dừng tại cap'] },
    ],
    applications: [
      ['Báo cáo tháng', 'Batch API vì không gấp', 'Tiết kiệm chi phí cho lượng lớn tài liệu.'],
      ['Exception alert', 'Messages API thời gian thực', 'Đáp ứng SLA 30 phút.'],
      ['Review PR lớn', 'Đặt max-turns và max-budget-usd', 'Ngăn một invocation chạy vòng lặp quá lâu.'],
    ],
    decision: 'Giá trị giảm mạnh khi chậm → real-time. Chấp nhận tối đa 24 giờ → batch. Câu đơn giản → fast path. Mọi agent loop production → đặt budget.',
  },
}

// Only concepts missing from the original 12 lessons are included here.
// Every item is attached to an existing lesson to avoid duplicate curricula.
export const supplementalKnowledge = {
  'agent-loop': [
    {
      source: 'D1 · Foundations', title: 'Agentic hay workflow cố định?',
      explanation: 'Agentic phù hợp khi bước tiếp theo phụ thuộc kết quả vừa quan sát: điều tra, dùng nhiều tool hoặc xử lý ngoại lệ. Workflow cố định phù hợp khi chuỗi bước ổn định, deterministic và dễ audit.',
      example: 'Format ngày tháng luôn theo một quy tắc nên dùng code cố định. Điều tra vì sao đơn chưa tới cần agent đọc trạng thái rồi tự chọn hỏi thêm, tra vận chuyển hay escalation.',
      remember: 'Cần phán đoán thích nghi → agentic. Có thể viết chính xác mọi bước từ trước → workflow truyền thống.',
    },
    {
      source: 'D1 · Loop lifecycle', title: '`stop_reason` là tín hiệu điều khiển',
      explanation: '`tool_use` nghĩa là model chưa xong: ứng dụng phải chạy tool và tiếp tục loop. `end_turn` thường nghĩa là có thể kết thúc. `max_tokens`, `pause_turn` hoặc context-limit cần nhánh xử lý riêng, không được coi là hoàn thành.',
      example: 'Model viết “Tôi sẽ kiểm tra đơn hàng” không phải tín hiệu chạy tiếp. Ứng dụng kiểm `response.stop_reason === "tool_use"` và đọc tool blocks.',
      remember: 'Điều khiển loop bằng protocol field, không parse câu chữ như “I am done”.',
    },
    {
      source: 'D1 · Tool-result protocol', title: 'Client tool và server tool khác nhau',
      explanation: 'Client tool do ứng dụng của bạn thực thi và phải gửi lại `tool_result` tham chiếu đúng `tool_use_id`. Server tool do nền tảng thực thi. Với client tool, assistant tool-use message phải đứng trước user tool-result message.',
      example: 'Một `lookup_order` nội bộ cần backend chạy rồi append result. Server web search có thể được nền tảng thực hiện và tích hợp kết quả trực tiếp.',
      remember: 'Message ordering là một phần của giao thức, không phải vấn đề trình bày.',
    },
  ],
  'code-exploration': [
    {
      source: 'D2/D3 · Built-in tools', title: 'Edit, Write và Bash có boundary khác nhau',
      explanation: 'Edit phù hợp thay đổi có đoạn neo duy nhất; file lặp khiến old_string mơ hồ thì Read toàn file rồi Write lại. Bash dành cho lệnh build, test, git hoặc script—not thay thế việc đọc hiểu code.',
      example: 'Chèn helper giữa hai hàm có docstring giống nhau: Read → tạo nội dung mới → Write đáng tin hơn replace_all.',
      remember: 'Chọn tool theo loại thao tác, không theo thói quen.',
    },
    {
      source: 'D3/D5 · Exploration', title: 'Top-down exploration và exploration journal',
      explanation: 'Bắt đầu từ README/architecture/entry point để có bản đồ, sau đó đi sâu vào call path. Với phiên dài, journal ghi file đã đọc, giả thuyết, bằng chứng và câu hỏi còn mở để tránh điều tra lặp.',
      example: 'Auth investigation: route → middleware → token service → repository; journal ghi alias và test còn thiếu.',
      remember: 'Scratchpad lưu kết luận; exploration journal còn lưu cả hành trình và khoảng trống.',
    },
    {
      source: 'D1/D5 · Decomposition', title: 'Kiểm tra phân rã có đầy đủ hay không',
      explanation: 'Chia việc không chỉ theo số file. Có thể chia theo layer, câu hỏi, dependency hoặc rủi ro. Sau khi gom kết quả, coordinator phải kiểm tra coverage thay vì mặc định mọi phần đã được xem.',
      example: 'Tìm untested payment paths cần task tìm test, task trace refund và task map error branches—không chỉ chia 45 file thành ba nhóm bằng nhau.',
      remember: 'Decomposition tốt tạo output có thể ghép và có tiêu chí biết lúc nào đã đủ.',
    },
  ],
  workflow: [
    {
      source: 'D3 · CLAUDE.md hierarchy', title: 'Ba tầng `CLAUDE.md` và `@imports`',
      explanation: 'User-level chứa preference cá nhân; root chứa chuẩn toàn dự án; subdirectory chứa quy tắc theo module. `@imports` tái sử dụng tài liệu chuẩn mà không copy nội dung vào nhiều file.',
      example: 'Root quy định test command; `packages/payments/CLAUDE.md` quy định audit log; maintainer import riêng security rules liên quan.',
      remember: 'Đặt hướng dẫn ở phạm vi nhỏ nhất nhưng vẫn áp dụng đúng mọi nơi cần thiết.',
    },
    {
      source: 'D3 · Rules and skills', title: 'Rules, Skills và CLAUDE.md không thay thế nhau',
      explanation: 'CLAUDE.md là context/advice chung. `.claude/rules/` dùng YAML frontmatter để chỉ tải quy tắc khi path khớp. Skill đóng gói một workflow có thể gọi lại và version-control cho team.',
      example: 'Terraform conventions vào path-scoped rule; quy trình React→Vue lặp lại vào project skill; naming chung ở CLAUDE.md.',
      remember: 'Thông tin chung → CLAUDE.md; theo file → rules; quy trình tái sử dụng → skill.',
    },
    {
      source: 'D3 · Iteration', title: 'Requirements interview và TBD pattern',
      explanation: 'Khi người dùng mới có ý tưởng thô, yêu cầu agent phỏng vấn để lộ constraint, failure mode và tiêu chí thành công trước khi code. Điểm chưa quyết định được ghi TBD thay vì model tự chọn âm thầm.',
      example: 'Caching layer cần hỏi invalidation, consistency, TTL, failure fallback và cache stampede trước khi chọn Redis implementation.',
      remember: 'Không rõ requirement mà code ngay thường tạo rework lớn hơn thời gian hỏi đúng câu.',
    },
  ],
  context: [
    {
      source: 'D5 · Context reliability', title: 'Context rot và “lost in the middle”',
      explanation: 'Model thường chú ý tốt hơn ở đầu và cuối input; chi tiết quan trọng bị chôn giữa context dài dễ bị bỏ qua. Context còn trong giới hạn token không đồng nghĩa mọi phần được sử dụng đồng đều.',
      example: 'Đặt system rules và critical state rõ ở đầu, yêu cầu hiện tại và evidence liên quan gần cuối; không kẹp allergy giữa 60K token tool logs.',
      remember: 'Quản lý cả vị trí thông tin, không chỉ tổng token.',
    },
    {
      source: 'D5 · Prompt caching', title: 'Caching giảm chi phí, không giảm context',
      explanation: 'Prompt caching tái sử dụng prefix ổn định để giảm latency/chi phí. Nó không giải phóng context window và không chữa context rot. Muốn giảm token vẫn cần compact, trim hoặc retrieve có chọn lọc.',
      example: 'Cache system prompt 8K token giúp gọi lặp rẻ hơn, nhưng 80K tool history vẫn chiếm nguyên cửa sổ.',
      remember: 'Caching là tối ưu tính toán; summarization/context editing là tối ưu dung lượng.',
    },
    {
      source: 'D5 · Re-grounding', title: 'Re-ground sau compaction',
      explanation: 'Sau khi tóm tắt hoặc chuyển session, model nên được neo lại bằng facts, quyết định, mục tiêu và trạng thái công việc hiện hành. Với dữ liệu biến động, gọi lại tool thay vì tin snapshot cũ.',
      example: 'Session mới nhận summary “refund pending”, rồi lookup lại trạng thái trước khi nói với khách bốn giờ sau.',
      remember: 'Summary giữ continuity; fresh tool call khôi phục freshness.',
    },
  ],
  extraction: [
    {
      source: 'D2/D4 · tool_choice', title: 'Bốn chế độ `tool_choice`',
      explanation: '`auto`: model tự chọn gọi hay trả text. `any`: bắt buộc gọi một trong các tool. `tool`: bắt buộc một tool có tên cụ thể. `none`: cấm gọi tool. Chọn sai mode có thể khiến pipeline nhận prose thay vì JSON.',
      example: 'Không biết document là invoice hay contract → `any`. Luôn phải extract metadata trước enrichment → ép tool `extract_metadata`.',
      remember: 'Any = bắt buộc một tool bất kỳ; tool = bắt buộc đúng tool được chỉ định.',
    },
    {
      source: 'D4 · Schema semantics', title: 'Required, optional và nullable',
      explanation: 'Required nói field phải xuất hiện. Optional cho phép field vắng mặt. Nullable cho phép field xuất hiện với `null`. Với extraction ổn định, thường giữ field required nhưng nullable để downstream luôn biết schema shape.',
      example: 'News article không nói attendee_count: `{ "attendee_count": null }` rõ hơn lúc có field lúc không.',
      remember: 'Không có bằng chứng không đồng nghĩa chuỗi rỗng, số 0 hay giá trị model đoán.',
    },
    {
      source: 'D4 · Structured outputs', title: 'Strict structure vẫn cần semantic checks',
      explanation: 'Native structured output hoặc strict tool schema có thể bảo đảm type/shape, nhưng không biết giá trị có đúng ngữ cảnh. Pydantic/JSON Schema là cổng cấu trúc; business validators là cổng ý nghĩa.',
      example: 'Vendor ID đúng kiểu string nhưng sai pattern, hoặc duration nằm nhầm quantity field—schema cơ bản vẫn có thể cho qua.',
      remember: 'Strict không có nghĩa truthful.',
    },
    {
      source: 'D4 · Validation loop', title: 'Retry có feedback và giới hạn',
      explanation: 'Chỉ retry khi lỗi có thể sửa bằng thông tin đang có. Gửi lại lỗi validation cụ thể và output cũ; đặt max retry để tránh loop. Missing external evidence là unresolvable, cần retrieve hoặc review.',
      example: '“quantity expected float, got 2 to 3” có thể sửa sau feedback; tên đồng tác giả ở tài liệu ngoài thì không.',
      remember: 'Resolvable → repair loop. Unresolvable → thêm dữ liệu hoặc human review.',
    },
  ],
  'tool-design': [
    {
      source: 'D2 · Tool definition', title: 'Tên, description và schema cùng quyết định chất lượng',
      explanation: 'Tên giúp nhận diện nhanh, description giải thích boundary, parameter schema định hình input. Tên tốt không cứu được description mơ hồ; type đúng không nói được UUID thuộc user nào.',
      example: '`archive_file`: “Use for backups and retention; prefer over delete_file for old backups” giảm misrouting trực tiếp.',
      remember: 'Tool description dạy chọn tool; parameter description dạy điền đúng giá trị.',
    },
    {
      source: 'D2 · Least privilege', title: '`allowedTools` theo vai trò',
      explanation: 'Mỗi agent chỉ nên thấy tool cần cho nhiệm vụ. Điều này giảm decision complexity và giới hạn blast radius. Quyền của coordinator không tự động đồng nghĩa subagent có mọi tool.',
      example: 'Synthesis agent chỉ đọc shared findings; không cần web search hoặc mutation tools.',
      remember: 'Ít tool liên quan thường chính xác và an toàn hơn nhiều tool “phòng khi cần”.',
    },
    {
      source: 'D2 · MCP architecture', title: 'MCP tools, resources và prompts',
      explanation: 'Tool là hành động callable; resource là nội dung/catalog read-only; prompt là template workflow có thể xuất hiện như slash command. Chọn đúng primitive tránh dùng tool chỉ để dò xem server có gì.',
      example: 'Database schema là resource; `run_query` là tool; quy trình triage ticket có thể là MCP prompt.',
      remember: 'Đọc/catalog → resource. Hành động → tool. Mẫu tương tác tái dùng → prompt.',
    },
    {
      source: 'D2 · MCP discovery', title: 'Secrets và ToolSearch động',
      explanation: 'Secret nên đi qua environment-variable expansion, không hardcode trong `.mcp.json`. Khi có hàng chục connector, ToolSearch tìm và nạp tool theo nhu cầu thay vì preload tất cả vào context.',
      example: 'Connector Jira chỉ xuất hiện sau khi query cần ticket; token lấy từ `${JIRA_TOKEN}`.',
      remember: 'Discovery giảm token và lỗi chọn tool; environment variables tách credential khỏi version control.',
    },
  ],
  errors: [
    {
      source: 'D2/D5 · Result semantics', title: 'Access failure khác valid empty',
      explanation: 'Access failure nghĩa là chưa truy vấn được nguồn, nên không biết dữ liệu có tồn tại không. Valid empty nghĩa là query thành công và kết quả thực sự rỗng. Gộp hai trạng thái tạo kết luận tự tin nhưng sai.',
      example: 'Timeout CRM ≠ “không có khách hàng”. HTTP 200 với mảng rỗng mới là không có match.',
      remember: 'Không kiểm tra được không đồng nghĩa đã kiểm tra và không tìm thấy.',
    },
    {
      source: 'D2 · Tool result design', title: 'Transform output trước khi trả model',
      explanation: 'Raw API response thường quá dài hoặc chứa field nội bộ. Tool nên lọc, normalize và trả metadata ra quyết định. Nhưng không được làm mất trạng thái lỗi, provenance hoặc dữ liệu cần cho bước sau.',
      example: 'Lookup order trả 40 field; return workflow chỉ nhận items, purchase_date, return_window và status.',
      remember: 'Concise là bỏ noise, không phải bỏ evidence.',
    },
    {
      source: 'D5 · Error propagation', title: 'Partial success phải khai báo coverage gap',
      explanation: 'Nếu ba nguồn có một nguồn timeout, pipeline không nên im lặng tổng hợp hai nguồn còn lại như thể đầy đủ. Hãy retry cục bộ, rồi ghi rõ nguồn nào thất bại và tác động tới kết luận.',
      example: 'Source A có dữ liệu, B valid-empty, C timeout → report phân biệt đủ ba trạng thái.',
      remember: 'Reliability bao gồm trung thực về phần chưa biết.',
    },
  ],
  safety: [
    {
      source: 'D3 · Enforcement spectrum', title: 'Advisory, deterministic và hard block',
      explanation: 'CLAUDE.md hướng dẫn preference; hook tự động kiểm tra/chuyển đổi tại lifecycle event; `permissions.deny` chặn tuyệt đối một hành động. Chọn cơ chế theo mức độ bắt buộc.',
      example: '“Ưu tiên ErrorHandler” → CLAUDE.md. “Luôn chạy Prettier” → PostToolUse. “Không bao giờ sửa migrations” → permissions.deny.',
      remember: 'Prefer/should → advice. Automatically/always-run → hook. Never/forbidden → deny/backend.',
    },
    {
      source: 'D1/D3 · Hook lifecycle', title: 'PreToolUse, PostToolUse và matcher',
      explanation: 'PreToolUse chạy trước action để validate hoặc block. PostToolUse chạy sau để format, log hoặc normalize. Matcher như `Edit|Write` giới hạn hook vào đúng tool và giảm tác dụng phụ.',
      example: 'Chặn refund >$500 trước tool; chạy Prettier sau Edit/Write.',
      remember: 'Ngăn hậu quả → Pre. Chuẩn hóa kết quả → Post.',
    },
    {
      source: 'D1 · Prerequisite gate', title: 'Gate biến thứ tự bắt buộc thành trạng thái',
      explanation: 'Nếu bước B chỉ hợp lệ sau bước A, đừng chỉ nhắc model. A trả proof/token/state mà B bắt buộc nhận và xác minh.',
      example: 'verify_identity trả verification_token; reset_password từ chối nếu thiếu token hợp lệ.',
      remember: 'Ràng buộc bằng dữ liệu đầu vào mạnh hơn ràng buộc bằng lời nhắc.',
    },
  ],
  'multi-agent': [
    {
      source: 'D1 · Context isolation', title: 'Hub-and-spoke và explicit handoff',
      explanation: 'Coordinator là hub, subagent là spoke có context riêng. Output không tự lan giữa spokes; hub phải chuyển summary, reference hoặc shared-store access cho bước kế tiếp.',
      example: 'Search agent lưu claim-source records; coordinator truyền reference IDs cho synthesis.',
      remember: 'Isolation giúp tập trung nhưng bắt buộc handoff rõ ràng.',
    },
    {
      source: 'D1 · Scale boundaries', title: 'Observability và giới hạn song song',
      explanation: 'Nhiều agent không luôn nhanh hơn: chúng tăng chi phí, duplicate work và khó debug. Cần task ID, status, structured output, timeout và giới hạn concurrency.',
      example: '12 precedent chia bốn worker có coordinator theo dõi; không spawn 12 agent mù không checkpoint.',
      remember: 'Parallelize phần độc lập, nhưng giữ một nơi quan sát và tổng hợp.',
    },
    {
      source: 'D5 · Provenance', title: 'Source authority và conflict resolution',
      explanation: 'Khi nguồn mâu thuẫn, không chỉ đếm số nguồn. Xét độ gần nguồn gốc, thẩm quyền, ngày thu thập và phạm vi. Synthesis phải giữ cách nguồn gốc mô tả độ chắc chắn.',
      example: 'Số 2022 và 2024 có thể là xu hướng theo thời gian; policy chính thức mới hơn có trọng lượng hơn blog cũ.',
      remember: 'Bảo toàn date + source + claim trước khi phán là contradiction.',
    },
  ],
  conversation: [
    {
      source: 'D5 · Ambiguity', title: 'Clarify theo mức độ đảo ngược',
      explanation: 'Không phải thiếu field nào cũng cần hỏi. Với đề xuất có thể sửa, nêu giả định và tiến hành. Với booking, thanh toán, xóa hoặc lựa chọn làm đổi mục tiêu lớn, xác nhận trước.',
      example: 'Có thể gợi ý ba venue từ budget ước lượng; không được đặt cọc trước khi chốt ngày và số khách.',
      remember: 'Chi phí sửa sai càng cao, nhu cầu clarification càng lớn.',
    },
    {
      source: 'D5 · Escalation reliability', title: 'Đừng dùng sentiment hoặc self-confidence làm gate duy nhất',
      explanation: 'Giọng giận dữ không luôn đồng nghĩa phải escalation ngay, và model nói “tôi tự tin” không phải calibration. Dùng trigger quan sát được: user request, policy exception, authorization boundary, repeated failure.',
      example: 'Khách bực nhưng refund hợp lệ vẫn có thể được giải quyết ngay; offer escalation thay vì tự động bỏ workflow.',
      remember: 'Escalation dựa trên trạng thái và quyền hạn, không chỉ cảm xúc.',
    },
    {
      source: 'D5 · Loop detection', title: 'Repeated failure phải chuyển chiến lược',
      explanation: 'Lặp cùng tool/input sau lỗi permanent không tạo tiến triển. Theo dõi attempt và error category để đổi input, dùng nguồn khác, annotate gap hoặc escalates.',
      example: 'Ba lần order-not-found với cùng ID không nên có lần bốn; hỏi identifier khác hoặc handoff.',
      remember: 'Retry chỉ là tiến triển nếu điều kiện của lần thử mới đã thay đổi.',
    },
  ],
  quality: [
    {
      source: 'D4 · Prompt criteria', title: 'Explicit criteria mạnh hơn tính từ chung chung',
      explanation: '“Review kỹ” hoặc “be conservative” không định nghĩa hành vi. Criteria nên nêu loại issue, evidence cần có, severity và điều kiện không được flag.',
      example: 'Chỉ báo security finding khi có untrusted input → sink path; ghi file/line và tác động.',
      remember: 'Prompt tốt biến chất lượng thành điều có thể quan sát và chấm.',
    },
    {
      source: 'D3/D4 · Finding schema', title: 'Metadata làm review có thể lọc và chống trùng',
      explanation: 'Finding nên có file, line, severity, confidence, category, evidence và `detected_pattern`. Truyền prior findings giúp reviewer không đăng lại cùng issue ở lần chạy sau.',
      example: 'Hai comment khác câu chữ nhưng cùng detected_pattern `unchecked-null-user` được deduplicate.',
      remember: 'Structured finding phục vụ cả con người lẫn orchestration stage sau.',
    },
    {
      source: 'D4/D5 · Independent and stratified review', title: 'Đánh giá theo segment để thấy điểm yếu ẩn',
      explanation: 'Accuracy tổng có thể che field hoặc document type yếu. Review độc lập tránh self-review bias; stratified sample đo từng segment và vẫn audit nhóm high-confidence.',
      example: '97% tổng nhưng appendix tables chỉ 72% phải chặn tự động hóa riêng segment đó.',
      remember: 'Đừng deploy threshold dựa trên một con số aggregate.',
    },
  ],
  cost: [
    {
      source: 'D3/D4 · Batch limitations', title: 'Batch không chạy agent loop nhiều lượt trong một request',
      explanation: 'Batch phù hợp request độc lập có thể chờ. Workflow cần model gọi client tool, nhận result rồi tiếp tục phải dùng synchronous orchestration hoặc tách thành các job rõ ràng.',
      example: 'Trích xuất một lần phù hợp batch; support agent lookup→refund nhiều lượt không phù hợp một batch request.',
      remember: 'Batch tối ưu throughput, không thay thế interactive loop.',
    },
    {
      source: 'D3/D5 · Prompt-cache pre-warming', title: 'Pre-warm chỉ hữu ích khi request đủ gần nhau',
      explanation: 'Batch jobs có thể chạy cách xa nhau khiến cache prefix hết hạn. Pre-warming có thể giúp, nhưng phải cân nhắc TTL và lịch thực thi; caching vẫn không giảm token context.',
      example: 'Review 50 PR cùng system prompt 8K token có lợi nếu các request dùng chung prefix trong thời gian cache còn hiệu lực.',
      remember: 'Tối ưu cache phải xét temporal locality.',
    },
    {
      source: 'D3 · CI/CD', title: 'Guardrail vận hành không phải completion signal',
      explanation: '`--max-turns`, `--max-budget-usd` và permission mode giới hạn một invocation. Chúng không chứng minh task đã xong; job runner vẫn phải đọc outcome và quyết định fail, retry hoặc escalation.',
      example: 'Review dừng ở turn 10 khi mới thu thập xong dữ liệu phải được đánh dấu incomplete thay vì post báo cáo rỗng.',
      remember: 'Cap bảo vệ tài nguyên; terminal-state check bảo vệ nghiệp vụ.',
    },
  ],
}

export const domainAudit = [
  { code: 'D1', title: 'Agentic Architecture & Orchestration', sections: 10, lessons: ['agent-loop', 'multi-agent', 'safety', 'code-exploration', 'workflow'] },
  { code: 'D2', title: 'Tool Design & MCP Integration', sections: 13, lessons: ['tool-design', 'errors', 'extraction', 'code-exploration'] },
  { code: 'D3', title: 'Claude Code Configuration & Workflows', sections: 18, lessons: ['workflow', 'safety', 'quality', 'cost', 'code-exploration'] },
  { code: 'D4', title: 'Prompt Engineering & Structured Output', sections: 11, lessons: ['extraction', 'quality', 'cost'] },
  { code: 'D5', title: 'Context Management & Reliability', sections: 12, lessons: ['context', 'conversation', 'errors', 'multi-agent', 'quality'] },
]

export const quiz = [
  { q: 'API intermittently trả 500 trong codebase 200+ file. Cách phân rã tốt nhất?', options: ['Chia cố định bốn layer', 'Đọc toàn bộ code trước', 'Sinh subtask động theo phát hiện', 'Chỉ Grep error handler'], answer: 2, why: 'Khi đường lỗi chưa biết, investigation phải thích nghi theo bằng chứng mới.', chapter: 'code-exploration' },
  { q: 'Model không nhớ từ vựng đã nói ở lượt trước. Nguyên nhân có khả năng nhất?', options: ['Model quá nhỏ', 'API không nhận lại message history', 'System prompt quá ngắn', 'Cần MCP memory'], answer: 1, why: 'API stateless; ứng dụng phải gửi lại lịch sử trong messages.', chapter: 'agent-loop' },
  { q: 'Hai chiến lược refactor cần phát triển độc lập từ cùng phân tích cũ. Làm gì?', options: ['Làm tuần tự cùng thread', 'Tạo hai session mới hoàn toàn', 'Fork session thành hai nhánh', 'Chỉ lưu transcript'], answer: 2, why: 'Fork giữ cùng context gốc và tránh hai phương án gây neo lẫn nhau.', chapter: 'workflow' },
  { q: 'JSON đúng schema nhưng line items không cộng ra grand total. Cải tiến tốt nhất?', options: ['Đổi model', 'Bỏ total', 'Thêm calculated_total và cờ consistency', 'Retry vô hạn'], answer: 2, why: 'Đây là lỗi semantic; cần kiểm tra chéo giá trị trích xuất và tính toán.', chapter: 'extraction' },
  { q: 'Tool cardio và strength thường nhận sai tổ hợp tham số. Nên làm gì?', options: ['Mô tả dài hơn duy nhất', 'Tách hai tool theo domain', 'Thêm mọi field vào một tool', 'Để model tự sửa'], answer: 1, why: 'Hai intent có bộ tham số bắt buộc khác nhau nên cần schema riêng.', chapter: 'tool-design' },
  { q: 'External API trả 503 tạm thời. Trách nhiệm xử lý tốt nhất?', options: ['Agent retry từng lượt', 'Tool tự retry với exponential backoff', 'Escalate ngay', 'Đổi thành permission error'], answer: 1, why: 'Lỗi transient có thể phục hồi cơ học và nên được ẩn trong tool.', chapter: 'errors' },
  { q: 'Ngưỡng hoàn tiền $500 phải không thể bị bypass. Đặt ở đâu?', options: ['User prompt', 'System prompt', 'Trong backend/tool', 'Ví dụ few-shot'], answer: 2, why: 'Prompt không phải security boundary; policy phải được enforce bằng code.', chapter: 'safety' },
  { q: 'Search và document analysis hoàn toàn độc lập. Cách giảm latency?', options: ['Gọi tuần tự', 'Phát cả hai Task call cùng response', 'Dùng một agent làm tất cả', 'Tóm tắt trước'], answer: 1, why: 'Công việc độc lập nên chạy song song rồi fan-in.', chapter: 'multi-agent' },
  { q: 'Người dùng đổi ngân sách giữa hội thoại nhưng model vẫn dùng giá cũ. Giải pháp chắc nhất?', options: ['Xóa lịch sử', 'Tăng context', 'Duy trì current-preferences object', 'Nhắc model chú ý hơn'], answer: 2, why: 'Structured state loại bỏ mâu thuẫn giữa các phát biểu cũ và mới.', chapter: 'context' },
  { q: 'Khách bực nhưng vấn đề đã rõ và agent xử lý được ngay. Phản hồi?', options: ['Escalate không hỏi', 'Tranh luận với khách', 'Nói có thể xử lý ngay và vẫn cho chọn escalation', 'Yêu cầu kể lại'], answer: 2, why: 'Tối ưu first-contact resolution nhưng vẫn tôn trọng yêu cầu gặp người.', chapter: 'conversation' },
  { q: 'Review prompt “chỉ báo lỗi chắc chắn” có precision cao nhưng bỏ sót bug. Cải tiến?', options: ['Tăng độ dài prompt', 'Discovery rộng rồi threshold riêng', 'Chỉ chạy lint', 'Bỏ confidence'], answer: 1, why: 'Tách mục tiêu recall khỏi bước kiểm soát noise.', chapter: 'quality' },
  { q: 'Điều gì quyết định Batch API phù hợp cho CI review?', options: ['Model lớn hay nhỏ', 'Feedback trễ tới 24 giờ còn actionable không', 'Số file trong repo', 'Có dùng JSON không'], answer: 1, why: 'Batch là quyết định theo latency/SLA trước khi là quyết định chi phí.', chapter: 'cost' },
]

export const examPatterns = [
  ['Thiếu cấu trúc', 'Schema / tool use'], ['Thiếu thông tin thật', 'null / retrieve / review'],
  ['Lỗi tạm thời', 'Retry trong tool'], ['Lỗi vĩnh viễn', 'Metadata rõ cho agent'],
  ['Việc độc lập', 'Chạy song song'], ['Việc phụ thuộc', 'Prompt chaining'],
  ['Quy tắc hướng dẫn', 'Prompt'], ['Yêu cầu bảo đảm', 'Backend / hook / orchestrator'],
]

export const answerKey = `3 1 1 1 3 3 1 3 4 2 2 1 1 2 2 2 2 2 2 3 3 1 1 1 2 2 1 1 1 4 2 4 1 1 4 4 2 1 2 2 4 4 2 1 1 4 1 2 2 2 4 4 3 1 1 3 3 1 2 3 4 1 1 4 2 2 4 1 2 1 4 1 3 2 1 4 3 2 2 1 4 1 1 3 2 3 2 4 4 4 2 1 4 4 1 4 1 2 4 1 2 1 2 2 3 2 4 2 2 3 3 2 3 1 3 1 3 4 2 3 1 1 2 4 2 1 1 3 2 1 4 2 3 3 2 1 2 4 2 1 1 1 4 3 3 2 3 3 2 3 1 1 3 4 3 3 2 1 1 1 2 4`.split(' ').map(Number)

export const stats = [
  { value: '162', label: 'câu hỏi được bao phủ' },
  { value: '12', label: 'chuyên đề cốt lõi' },
  { value: '3', label: 'chế độ học tập' },
]

export const navItems = [
  { id: 'learn', label: 'Học bài', icon: Sparkles },
  { id: 'practice', label: 'Luyện tập', icon: Code2 },
  { id: 'reference', label: 'Tra cứu', icon: Compass },
]
