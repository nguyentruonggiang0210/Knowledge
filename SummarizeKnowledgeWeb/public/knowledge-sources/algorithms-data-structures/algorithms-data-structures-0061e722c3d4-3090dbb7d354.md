# Câu hỏi phỏng vấn Algorithms & Data Structures — Middle/Senior

Mỗi câu có một mã ổn định để đối chiếu với `Anwsers/algorithms_data_structures.md`. Hãy trình bày giả định, chứng minh tính đúng đắn, độ phức tạp và trade-off thay vì chỉ nêu tên thuật toán.

## Nền tảng và cấu trúc dữ liệu

### ALG-001 — [Middle] Phân biệt độ phức tạp worst-case, average-case, expected và amortized như thế nào?
**Tình huống:** Một API đôi lúc chậm đột biến nhưng trung bình vẫn đạt SLA; hãy giải thích cách dùng các loại bound để đánh giá thuật toán phía sau.

### ALG-002 — [Middle] Vì sao thao tác `append` của dynamic array có amortized O(1) dù có lần phải cấp phát lại O(n)?
**Tình huống:** Thiết kế một collection tăng trưởng thường xuyên và chọn hệ số mở rộng phù hợp giữa CPU, bộ nhớ và số lần copy.

### ALG-003 — [Senior] Thiết kế hash table xử lý collision, resize và hash-flooding ra sao?
**Tình huống:** Một endpoint nhận key do người dùng kiểm soát bị tăng CPU bất thường khi lưu hàng triệu phần tử.

### ALG-004 — [Middle] Khi nào array/vector tốt hơn linked list dù chèn giữa có độ phức tạp kém hơn?
**Tình huống:** Một pipeline duyệt tuần tự hàng triệu record và thỉnh thoảng xóa phần tử.

### ALG-005 — [Middle] Hãy chọn stack, queue hay deque cho từng kiểu xử lý và giải thích invariant của chúng.
**Tình huống:** Dịch vụ vừa cần undo, vừa cần hàng đợi công việc, vừa cần sliding window.

### ALG-006 — [Middle] Heap giải quyết Top-K hiệu quả thế nào và khi nào nên dùng min-heap hoặc max-heap?
**Tình huống:** Tìm 100 giao dịch lớn nhất trong luồng 100 triệu giao dịch không thể giữ toàn bộ trong RAM.

### ALG-007 — [Senior] Thiết kế LRU cache với O(1) cho `get` và `put`; các invariant nào dễ bị phá vỡ?
**Tình huống:** Cache trong tiến trình bị memory leak hoặc trả sai eviction order dưới tải đồng thời.

### ALG-008 — [Middle] Union-Find hoạt động thế nào và vì sao path compression cùng union-by-rank gần O(1)?
**Tình huống:** Liên tục hợp nhất tài khoản trùng lặp và cần kiểm tra hai tài khoản có cùng nhóm không.

### ALG-009 — [Middle] BST mất cân bằng gây hậu quả gì; AVL và Red-Black Tree khác nhau ở trade-off nào?
**Tình huống:** Dữ liệu được chèn theo thứ tự tăng dần vào một ordered map có latency ngày càng xấu.

### ALG-010 — [Senior] Vì sao database/file system thường dùng B-Tree hoặc B+Tree thay vì binary search tree?
**Tình huống:** Cần thiết kế index lưu trên SSD với truy vấn range và số lần I/O thấp.

### ALG-011 — [Middle] Trie, compressed trie/radix tree và hash map khác nhau thế nào khi tìm kiếm prefix?
**Tình huống:** Xây autocomplete cho hàng triệu từ khóa Unicode với giới hạn bộ nhớ.

### ALG-012 — [Senior] So sánh prefix sum, Fenwick Tree và Segment Tree cho range query/range update.
**Tình huống:** Dashboard nhận cập nhật liên tục và phải trả tổng hoặc min/max trên nhiều khoảng.

## Đồ thị, tìm kiếm và sắp xếp

### ALG-013 — [Middle] BFS và DFS khác nhau về invariant, độ phức tạp, bộ nhớ và loại bài toán phù hợp ra sao?
**Tình huống:** Vừa cần đường đi ít cạnh nhất, vừa cần phát hiện thành phần liên thông trên đồ thị lớn.

### ALG-014 — [Middle] Topological sort được xây dựng thế nào và phát hiện cycle trong directed graph ra sao?
**Tình huống:** Sắp xếp thứ tự build/deploy của các module có dependency.

### ALG-015 — [Senior] Chọn BFS, Dijkstra, 0-1 BFS, Bellman-Ford hay A* cho shortest path dựa trên điều kiện nào?
**Tình huống:** Hệ thống routing có lúc trọng số âm, có lúc chỉ 0/1, và có truy vấn theo tọa độ địa lý.

### ALG-016 — [Middle] Minimum Spanning Tree khác shortest-path tree thế nào; Kruskal và Prim phù hợp khi nào?
**Tình huống:** Nối các data center với tổng chi phí đường truyền nhỏ nhất nhưng không yêu cầu đường từ một nguồn là ngắn nhất.

### ALG-017 — [Senior] Strongly Connected Components giúp giải quyết bài toán thực tế nào và Tarjan/Kosaraju khác nhau ra sao?
**Tình huống:** Gom các service phụ thuộc vòng lẫn nhau trước khi lập kế hoạch migration.

### ALG-018 — [Middle] Chọn adjacency list, adjacency matrix hay edge list dựa trên mật độ và thao tác chính như thế nào?
**Tình huống:** Biểu diễn mạng có hàng triệu đỉnh nhưng ít cạnh, đồng thời cần batch xử lý cạnh.

### ALG-019 — [Middle] Viết binary search không lỗi biên bằng invariant nào và xử lý `lower_bound`/`upper_bound` ra sao?
**Tình huống:** Tìm vị trí đầu tiên thỏa predicate đơn điệu trong dữ liệu có phần tử trùng.

### ALG-020 — [Middle] Tìm kiếm trong sorted rotated array, kể cả khi có duplicate, thay đổi binary search thế nào?
**Tình huống:** Một mảng tăng dần bị rotate tại vị trí không biết trước và cần tìm key với ít phép so sánh.

### ALG-021 — [Middle] Vì sao comparison sort có lower bound Ω(n log n), và stability/in-place ảnh hưởng lựa chọn thuật toán ra sao?
**Tình huống:** Sắp xếp record theo nhiều khóa mà thứ tự từ lần sort trước phải được bảo toàn.

### ALG-022 — [Senior] Quicksort có worst-case O(n²); production implementation giảm rủi ro bằng cách nào?
**Tình huống:** Input có thể được kẻ tấn công chọn để làm chậm dịch vụ sort.

### ALG-023 — [Middle] Merge sort và external merge sort phù hợp với dữ liệu vượt RAM như thế nào?
**Tình huống:** Sắp xếp file log 2 TB trên máy chỉ có 16 GB RAM.

### ALG-024 — [Senior] Khi nào counting sort, radix sort hoặc bucket sort tốt hơn comparison sort?
**Tình huống:** Sắp xếp hàng trăm triệu integer hoặc ID có miền giá trị biết trước.

### ALG-025 — [Senior] Quickselect tìm phần tử thứ k với expected O(n) ra sao và làm thế nào có worst-case bảo đảm?
**Tình huống:** Tính percentile trên một batch lớn mà không cần sắp xếp toàn bộ.

## Mẫu giải bài và tối ưu

### ALG-026 — [Middle] Nhận diện khi nào dùng two pointers hay sliding window; điều kiện nào làm window không còn đơn điệu?
**Tình huống:** Tìm đoạn con ngắn nhất có tổng tối thiểu S khi dữ liệu có thể chứa số âm.

### ALG-027 — [Middle] Prefix sum và difference array chuyển đổi range query/range update như thế nào?
**Tình huống:** Áp dụng hàng triệu cập nhật cộng trên đoạn rồi chỉ cần xuất kết quả cuối cùng.

### ALG-028 — [Middle] Monotonic stack/queue duy trì invariant gì để giải next greater element và sliding-window maximum?
**Tình huống:** Tính max của mọi cửa sổ kích thước k trên stream với O(n).

### ALG-029 — [Senior] Làm sao chứng minh một greedy algorithm đúng thay vì chỉ dựa vào trực giác?
**Tình huống:** Đề xuất chọn quyết định tốt nhất cục bộ cho bài toán scheduling có ràng buộc.

### ALG-030 — [Middle] Interval scheduling và interval merging khác nhau thế nào về mục tiêu và chiến lược sort?
**Tình huống:** Một bài cần chọn nhiều cuộc họp không giao nhau nhất, bài kia cần hợp nhất khung giờ bận.

### ALG-031 — [Middle] Thiết kế dynamic programming bằng state, transition, base case và thứ tự tính như thế nào?
**Tình huống:** Một lời giải đệ quy đúng nhưng exponential và có nhiều subproblem lặp lại.

### ALG-032 — [Senior] Phân biệt 0/1 knapsack, unbounded knapsack và bounded knapsack; vì sao hướng lặp capacity quan trọng?
**Tình huống:** Tối ưu danh mục tính năng theo ngân sách khi mỗi tính năng được chọn một lần hoặc nhiều lần.

### ALG-033 — [Senior] Longest Increasing Subsequence O(n log n) hoạt động ra sao và có khôi phục được dãy không?
**Tình huống:** Dữ liệu có một triệu điểm, O(n²) không đáp ứng thời gian.

### ALG-034 — [Middle] Edit distance xây recurrence thế nào và giảm bộ nhớ từ O(mn) xuống O(min(m,n)) ra sao?
**Tình huống:** So sánh hai chuỗi dài khi chỉ cần khoảng cách, sau đó mở rộng để cần cả edit script.

### ALG-035 — [Middle] Backtracking khác brute force thuần túy ở pruning và state restoration như thế nào?
**Tình huống:** Giải Sudoku/N-Queens mà không tạo toàn bộ tổ hợp trước.

### ALG-036 — [Senior] Meet-in-the-middle giảm độ phức tạp exponential trong trường hợp nào?
**Tình huống:** Subset-sum có n khoảng 40, quá lớn cho 2^n nhưng nhỏ cho DP theo tổng.

### ALG-037 — [Senior] Bitmask DP phù hợp với giới hạn nào và biểu diễn state ra sao?
**Tình huống:** Tìm tour tối ưu qua 20 điểm hoặc gán nhiệm vụ cho một tập nhỏ worker.

## Chuỗi, xác suất và dữ liệu streaming

### ALG-038 — [Middle] KMP tránh quay lui con trỏ text bằng prefix-function như thế nào?
**Tình huống:** Tìm pattern lặp nhiều ký tự trong văn bản dài mà naive search bị chậm.

### ALG-039 — [Middle] Rabin-Karp dùng rolling hash ra sao và phải xác minh collision như thế nào?
**Tình huống:** Tìm nhiều pattern hoặc phát hiện đoạn văn giống nhau trong tài liệu lớn.

### ALG-040 — [Senior] Thiết kế rolling hash/double hash an toàn trước collision và input đối kháng ra sao?
**Tình huống:** Dùng hash làm căn cứ deduplicate nhưng false equality có hậu quả nghiêm trọng.

### ALG-041 — [Senior] Suffix array, suffix tree và suffix automaton khác nhau về khả năng, bộ nhớ và độ khó triển khai thế nào?
**Tình huống:** Cần nhiều truy vấn substring và longest repeated substring trên một corpus tương đối tĩnh.

### ALG-042 — [Senior] Tìm palindrome dài nhất bằng center expansion, DP và Manacher có trade-off gì?
**Tình huống:** Chọn lời giải production dễ bảo trì nhưng vẫn đáp ứng giới hạn input lớn.

### ALG-043 — [Senior] Bloom filter bảo đảm gì, tính false-positive thế nào và dùng ở đâu trong hệ thống?
**Tình huống:** Tránh phần lớn disk lookup cho key chắc chắn không tồn tại nhưng không được phép false-negative.

### ALG-044 — [Senior] Reservoir sampling lấy mẫu đều từ stream không biết trước độ dài như thế nào?
**Tình huống:** Chọn 1.000 sự kiện đại diện từ luồng vô hạn với bộ nhớ giới hạn.

### ALG-045 — [Senior] Tìm approximate distinct count hoặc heavy hitters trong stream bằng cấu trúc nào?
**Tình huống:** Telemetry có hàng tỷ event/ngày; exact set hoặc full frequency map vượt ngân sách RAM.

## Đồng thời và thuật toán hệ thống

### ALG-046 — [Senior] Producer–consumer queue cần xử lý bounded capacity, backpressure và shutdown ra sao?
**Tình huống:** Producer nhanh hơn consumer gây tăng RAM; hệ thống phải dừng mà không mất job đang xử lý.

### ALG-047 — [Senior] Lock-free CAS loop có thể gặp ABA problem như thế nào và khắc phục bằng cách nào?
**Tình huống:** Xây stack/queue concurrent, một node bị lấy ra rồi tái sử dụng trước khi thread khác CAS.

### ALG-048 — [Senior] Thiết kế rate limiter bằng fixed window, sliding log/counter, token bucket và leaky bucket như thế nào?
**Tình huống:** API cần cho phép burst có kiểm soát và triển khai trên nhiều instance.

### ALG-049 — [Senior] Consistent hashing và rendezvous hashing giảm remapping khi node thay đổi ra sao?
**Tình huống:** Phân phối cache key trên cluster thường xuyên scale up/down và có node khác năng lực.

### ALG-050 — [Senior] Skip list đạt expected O(log n) bằng ngẫu nhiên như thế nào và vì sao hợp với concurrent ordered map?
**Tình huống:** Cần ordered index hỗ trợ range scan nhưng muốn implementation concurrent đơn giản hơn balanced tree.

### ALG-051 — [Senior] Cache eviction LRU, LFU, FIFO, Random và TinyLFU phù hợp workload nào?
**Tình huống:** Cache hit-rate thấp vì scan tuần tự đẩy các hot key ra ngoài.

### ALG-052 — [Senior] Thiết kế idempotency/deduplication bằng exact set, TTL, sequence number hay probabilistic structure thế nào?
**Tình huống:** Message broker giao ít nhất một lần và consumer không được ghi nhận giao dịch hai lần.

### ALG-053 — [Senior] External Top-K hoặc distributed Top-K được hợp nhất đúng và tiết kiệm network ra sao?
**Tình huống:** Mỗi shard có hàng tỷ record; coordinator cần global Top-100.

### ALG-054 — [Senior] Lập lịch task DAG với giới hạn tài nguyên và critical path như thế nào?
**Tình huống:** Pipeline có dependency, task dùng CPU/RAM khác nhau và cần giảm makespan.

## Bài coding và quyết định thực tế

### ALG-055 — [Middle] Viết thuật toán median của data stream và phân tích cách cân bằng hai heap.
**Tình huống:** Sau mỗi số đến, hệ thống phải trả median trong O(log n) update.

### ALG-056 — [Middle] Hợp nhất danh sách interval có biên đóng/mở và dữ liệu không được sort như thế nào?
**Tình huống:** Chuẩn hóa các khoảng hiệu lực, trong đó `[1,2]` và `(2,3]` có thể không được xem là chồng lấn.

### ALG-057 — [Senior] Giải Word Ladder hoặc shortest transformation path mà không dựng O(N²) cạnh ra sao?
**Tình huống:** Dictionary có hàng trăm nghìn từ cùng độ dài và cần trả đường biến đổi ngắn nhất.

### ALG-058 — [Senior] Thiết kế LFU cache O(1) trung bình với quy tắc tie-break theo recency như thế nào?
**Tình huống:** Cache phải tăng frequency, evict đúng và tránh giữ metadata rác sau nhiều thao tác.

### ALG-059 — [Senior] Phát hiện duplicate gần nhau theo cả khoảng cách index k và chênh lệch giá trị t như thế nào?
**Tình huống:** Kiểm tra stream số lớn, không thể so sánh mọi cặp trong cửa sổ.

### ALG-060 — [Senior] Khi yêu cầu thay đổi liên tục, chọn thuật toán exact, approximation hay precomputation dựa trên tiêu chí nào?
**Tình huống:** P99 latency, RAM, độ chính xác, tần suất update và chi phí vận hành mâu thuẫn nhau; hãy trình bày decision record.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

### ALG-061 — [Basic] ⭐ Phân tích Big-O của hai vòng lặp có hai kích thước đầu vào độc lập và bước tăng theo cấp số nhân như thế nào?
**Tình huống:** Code có vòng ngoài chạy `n` lần và vòng trong chạy `j = 1, 2, 4, ... < m`; hãy nêu time/space complexity và giải thích vì sao không nên mặc định viết O(n²).

### ALG-062 — [Basic] ⭐ Giải bài Two Sum trả về hai index khác nhau bằng hash map như thế nào?
**Tình huống:** Mảng có số âm, duplicate và có thể không có đáp án; hãy nêu thứ tự kiểm tra/lưu phần tử, complexity và contract khi có nhiều cặp hợp lệ.

### ALG-063 — [Basic] ⭐ Đảo ngược singly linked list bằng iterative và recursive approach ra sao?
**Tình huống:** Cần đảo list tại chỗ, giữ không mất phần đuôi và xử lý list rỗng/một node; hãy chỉ ra invariant con trỏ ở mỗi bước.

### ALG-064 — [Basic] ⭐ Kiểm tra chuỗi ngoặc `()[]{}` hợp lệ bằng stack như thế nào?
**Tình huống:** Chuỗi có thể rỗng, chứa loại ngoặc lồng nhau và ký tự thường; hãy định nghĩa rõ policy cho ký tự không phải ngoặc.

### ALG-065 — [Basic] ⭐ Cài queue FIFO bằng hai stack và chứng minh chi phí amortized như thế nào?
**Tình huống:** Queue cần `enqueue`, `dequeue`, `peek` và báo lỗi khi rỗng mà không được chuyển toàn bộ phần tử qua lại ở mọi thao tác.

### ALG-066 — [Basic] ⭐ Tìm ký tự xuất hiện đúng một lần đầu tiên trong chuỗi bằng counting/hash như thế nào?
**Tình huống:** Input có thể chứa Unicode, khác biệt hoa thường và chuỗi rất dài; hãy nêu giả định về “ký tự” và cách giữ đúng thứ tự xuất hiện.

### ALG-067 — [Basic] ⭐ Duyệt preorder, inorder, postorder và level-order của binary tree khác nhau thế nào?
**Tình huống:** Hãy chọn stack/queue hoặc recursion, nêu output order, complexity và rủi ro khi cây lệch có độ sâu rất lớn.

### ALG-068 — [Middle] ⭐ Hợp nhất hai sorted array khi mảng thứ nhất có đủ buffer ở cuối như thế nào?
**Tình huống:** Không được cấp phát mảng O(m+n); dữ liệu có duplicate và cần giữ toàn bộ phần tử theo thứ tự không giảm.

### ALG-069 — [Middle] ⭐ Tìm độ dài longest substring không lặp ký tự bằng sliding window như thế nào?
**Tình huống:** Chuỗi có duplicate cách xa nhau và Unicode; hãy giải thích vì sao biên trái không được lùi khi gặp lại một ký tự cũ.

### ALG-070 — [Middle] ⭐ Phát hiện cycle và tìm node bắt đầu cycle trong linked list bằng Floyd tortoise–hare ra sao?
**Tình huống:** Không được sửa node hoặc dùng O(n) bộ nhớ; hãy giải thích hai phase và trường hợp list không có cycle.

### ALG-071 — [Middle] ⭐ Tìm phần tử nhỏ thứ k trong BST và tối ưu khi có nhiều truy vấn/update như thế nào?
**Tình huống:** Một lần query có thể dùng traversal, nhưng production cần hàng nghìn query xen kẽ insert/delete; hãy nêu metadata/invariant cần bổ sung.

### ALG-072 — [Middle] ⭐ Tìm Lowest Common Ancestor trong binary tree và BST khác nhau ra sao?
**Tình huống:** Hai node đầu vào có thể không cùng tồn tại trong cây; hãy làm rõ contract và tránh trả một node chỉ vì mới tìm thấy một target.

### ALG-073 — [Middle] ⭐ Clone một graph có cycle, self-loop và label không duy nhất bằng BFS/DFS như thế nào?
**Tình huống:** Cần deep copy từ một node gốc, giữ đúng topology và không dùng label làm identity.

### ALG-074 — [Middle] ⭐ Sắp xếp mảng chỉ gồm 0, 1, 2 trong một pass bằng Dutch National Flag như thế nào?
**Tình huống:** Yêu cầu in-place O(1) extra space; hãy nêu invariant của ba vùng và xử lý phần tử vừa swap từ cuối về.

### ALG-075 — [Middle] ⭐ Tìm một target trong ma trận sorted theo hai contract phổ biến như thế nào?
**Tình huống:** So sánh trường hợp mỗi row nối tiếp row trước thành một dãy tăng toàn cục với trường hợp chỉ tăng theo từng row và từng column.

### ALG-076 — [Senior] ⭐ Longest Common Subsequence dùng DP và khôi phục một nghiệm như thế nào?
**Tình huống:** Hai chuỗi dài có nhiều LCS hợp lệ; hãy nêu recurrence, memory trade-off và policy tie-break nếu output phải deterministic.

### ALG-077 — [Senior] ⭐ Coin Change tìm số đồng xu ít nhất khác greedy ở điểm nào?
**Tình huống:** Hệ mệnh giá tùy ý có thể làm chiến lược lấy đồng lớn nhất trước sai; hãy đưa phản ví dụ, thiết kế DP và xử lý amount không thể tạo.

### ALG-078 — [Senior] ⭐ Serialize/deserialize binary tree thành format bền vững và kiểm tra input lỗi như thế nào?
**Tình huống:** Dữ liệu phải round-trip được với duplicate/null, có thể rất sâu và format sẽ được lưu lâu hoặc truyền giữa nhiều version service.

### ALG-079 — [Senior] ⭐ Tìm Minimum Window Substring chứa đủ multiplicity của pattern như thế nào?
**Tình huống:** Pattern có ký tự lặp, text Unicode và có nhiều cửa sổ ngắn bằng nhau; hãy nêu invariant `need/have`, tie-break và complexity.

### ALG-080 — [Senior] ⭐ Tìm median của hai sorted array trong O(log(min(m,n))) như thế nào?
**Tình huống:** Hai mảng có kích thước rất lệch, chứa duplicate, một mảng có thể rỗng và phép tính median phải tránh integer overflow.
