# Đáp án phỏng vấn Algorithms & Data Structures — Middle/Senior

Đáp án là khung chấm và gợi ý thảo luận, không phải lời thoại duy nhất. Một câu trả lời tốt cần công khai giả định và nối lựa chọn thuật toán với workload thực tế.

## Nền tảng và cấu trúc dữ liệu

### ALG-001 — [Middle] Phân biệt độ phức tạp worst-case, average-case, expected và amortized như thế nào?
**Tình huống:** Một API đôi lúc chậm đột biến nhưng trung bình vẫn đạt SLA; hãy giải thích cách dùng các loại bound để đánh giá thuật toán phía sau.

**Trả lời:** Worst-case chặn trên chi phí của một input xấu nhất; average-case cần một phân phối input được nêu rõ; expected thường lấy kỳ vọng trên randomness của thuật toán; amortized chặn chi phí trung bình của *mọi chuỗi thao tác* dù một thao tác riêng lẻ đắt. Ví dụ dynamic array append amortized O(1), nhưng lần resize vẫn O(n). Với SLA phải xem phân phối đo được, P95/P99, pause GC/I/O và worst-case có thể bị input đối kháng kích hoạt; amortized không đồng nghĩa từng request nhanh. **Tiêu chí:** ứng viên nêu được giả định, không lẫn average với amortized, và có thể dùng aggregate/accounting/potential để chứng minh.

### ALG-002 — [Middle] Vì sao thao tác `append` của dynamic array có amortized O(1) dù có lần phải cấp phát lại O(n)?
**Tình huống:** Thiết kế một collection tăng trưởng thường xuyên và chọn hệ số mở rộng phù hợp giữa CPU, bộ nhớ và số lần copy.

**Trả lời:** Nếu capacity tăng theo cấp số nhân, tổng số phần tử được copy qua n lần append là `1 + g + g² + ... < O(n)` nên tổng chi phí O(n), amortized O(1). Hệ số 2 giảm số lần copy nhưng có thể để dư gần 50% capacity; 1,5 tiết kiệm RAM hơn nhưng copy nhiều hơn. Append có thể fail do cấp phát, làm đổi địa chỉ và vô hiệu iterator/reference; shrink quá tích cực gây thrashing. **Tiêu chí:** giải thích được tổng cấp số nhân và chọn hệ số theo kích thước phần tử, allocator, latency spike chứ không chỉ nhắc Big-O.

### ALG-003 — [Senior] Thiết kế hash table xử lý collision, resize và hash-flooding ra sao?
**Tình huống:** Một endpoint nhận key do người dùng kiểm soát bị tăng CPU bất thường khi lưu hàng triệu phần tử.

**Trả lời:** Collision có thể xử lý bằng chaining hoặc open addressing; cần kiểm soát load factor, deletion/tombstone và resize/rehash. Trung bình lookup O(1), nhưng collision xấu thành O(n); linear probing cache-friendly song dễ primary clustering, còn chaining tốn pointer/allocation. Với key đối kháng dùng hash có seed ngẫu nhiên/SipHash, giới hạn input, tree hóa bucket hoặc watchdog; incremental rehash giúp tránh pause lớn. **Tiêu chí:** phải nói equality sau hash, attack model, memory locality, concurrency và nêu rằng hash tốt không xóa nhu cầu đo tail latency.

### ALG-004 — [Middle] Khi nào array/vector tốt hơn linked list dù chèn giữa có độ phức tạp kém hơn?
**Tình huống:** Một pipeline duyệt tuần tự hàng triệu record và thỉnh thoảng xóa phần tử.

**Trả lời:** Array liên tục trong bộ nhớ nên ít allocation, cache locality và prefetch/SIMD tốt; linked list tốn pointer, cache miss và GC pressure. Xóa giữa array O(n) vì dịch chuyển, nhưng với record nhỏ thao tác copy tuyến tính thường nhanh hơn pointer chasing; có thể swap-with-last nếu không cần thứ tự hoặc batch/mark rồi compact. Linked list chỉ có O(1) delete khi đã có node/iterator, còn tìm vị trí vẫn O(n). **Tiêu chí:** phân biệt complexity lý thuyết với constant/cache, và hỏi về thứ tự, tần suất mutation, ổn định địa chỉ.

### ALG-005 — [Middle] Hãy chọn stack, queue hay deque cho từng kiểu xử lý và giải thích invariant của chúng.
**Tình huống:** Dịch vụ vừa cần undo, vừa cần hàng đợi công việc, vừa cần sliding window.

**Trả lời:** Stack giữ LIFO phù hợp undo/DFS; queue giữ FIFO phù hợp fairness/BFS; deque thêm/xóa O(1) ở hai đầu, phù hợp work stealing hoặc monotonic window. Ring buffer cho queue/deque bounded tránh dịch mảng, với invariant head/tail/size phải phân biệt trạng thái rỗng và đầy. Không cấu trúc nào tự bảo đảm thread-safe hay durability. **Tiêu chí:** ánh xạ đúng semantics trước Big-O, xử lý overflow/backpressure và không dùng list có `remove(0)` O(n) làm queue.

### ALG-006 — [Middle] Heap giải quyết Top-K hiệu quả thế nào và khi nào nên dùng min-heap hoặc max-heap?
**Tình huống:** Tìm 100 giao dịch lớn nhất trong luồng 100 triệu giao dịch không thể giữ toàn bộ trong RAM.

**Trả lời:** Giữ min-heap kích thước k cho Top-K lớn nhất: phần tử nhỏ nhất của tập ứng viên nằm ở root; chỉ thay root khi giá trị mới lớn hơn. Thời gian O(n log k), RAM O(k), cuối cùng sort heap nếu cần thứ tự O(k log k); Top-K nhỏ nhất dùng max-heap. Batch trong RAM có thể dùng quickselect expected O(n), nhưng streaming không thể. **Tiêu chí:** ứng viên chọn đúng hướng heap, nêu xử lý tie/score update và không vô tình tạo heap n phần tử.

### ALG-007 — [Senior] Thiết kế LRU cache với O(1) cho `get` và `put`; các invariant nào dễ bị phá vỡ?
**Tình huống:** Cache trong tiến trình bị memory leak hoặc trả sai eviction order dưới tải đồng thời.

**Trả lời:** Dùng hash map `key -> node` cộng doubly linked list, đầu là MRU và cuối là LRU; get/mutation phải detach rồi đưa node lên đầu, put quá capacity xóa tail khỏi cả list lẫn map. Mọi node phải xuất hiện đúng một lần, liên kết hai chiều nhất quán và `map.Count == list.Count`; xử lý update, capacity 0 và exception. Dưới concurrency, map thread-safe riêng chưa đủ vì thao tác liên cấu trúc phải atomic; dùng lock/segmentation hoặc cache library. **Tiêu chí:** test được eviction/tie, không quên xóa map gây leak, và bàn TTL/size-based capacity chứ không đồng nhất entry count với memory.

### ALG-008 — [Middle] Union-Find hoạt động thế nào và vì sao path compression cùng union-by-rank gần O(1)?
**Tình huống:** Liên tục hợp nhất tài khoản trùng lặp và cần kiểm tra hai tài khoản có cùng nhóm không.

**Trả lời:** Mỗi tập là một cây có root đại diện; `find` theo parent, `union` nối hai root. Union-by-rank/size giữ cây thấp, path compression làm các node trên đường tìm trỏ gần root; chuỗi m thao tác có O(m α(n)), với inverse Ackermann thực tế rất nhỏ. Nó không hỗ trợ tách tập thuận tiện và path compression là mutation nên cần thiết kế đồng bộ nếu concurrent. **Tiêu chí:** union root chứ không union node tùy ý, xử lý duplicate identity và giải thích vì sao không gọi đơn giản là worst-case O(1).

### ALG-009 — [Middle] BST mất cân bằng gây hậu quả gì; AVL và Red-Black Tree khác nhau ở trade-off nào?
**Tình huống:** Dữ liệu được chèn theo thứ tự tăng dần vào một ordered map có latency ngày càng xấu.

**Trả lời:** BST thường với input tăng dần suy biến thành list, search/insert/delete O(n). AVL giữ cân bằng chặt nên lookup thường nhanh hơn nhưng rotation/update metadata nhiều; Red-Black cho bound chiều cao lỏng hơn, mutation thường rẻ và được dùng rộng trong ordered map. Cả hai cho O(log n), hỗ trợ predecessor/range theo thứ tự mà hash map không có. **Tiêu chí:** nêu invariant cân bằng ở mức ý tưởng, không tuyên bố một loại luôn tốt hơn, và cân nhắc B-tree/cache khi dữ liệu lớn.

### ALG-010 — [Senior] Vì sao database/file system thường dùng B-Tree hoặc B+Tree thay vì binary search tree?
**Tình huống:** Cần thiết kế index lưu trên SSD với truy vấn range và số lần I/O thấp.

**Trả lời:** Một node B-tree khớp page và có fan-out lớn, nên chiều cao rất thấp và mỗi tầng chỉ cần khoảng một page I/O; binary tree có fan-out 2 và pointer access rời rạc. B+Tree giữ payload/row pointer ở leaf, internal node chỉ giữ separator nên fan-out cao; leaf liên kết giúp range scan tuần tự. Split/merge, fill factor và write amplification là giá phải trả. **Tiêu chí:** lý giải theo page/cache line và locality, phân biệt B-tree/B+Tree, liên hệ random I/O, concurrency/latching.

### ALG-011 — [Middle] Trie, compressed trie/radix tree và hash map khác nhau thế nào khi tìm kiếm prefix?
**Tình huống:** Xây autocomplete cho hàng triệu từ khóa Unicode với giới hạn bộ nhớ.

**Trả lời:** Trie lookup/prefix O(L) theo độ dài key và chia sẻ prefix, nhưng node với nhiều child gây overhead lớn. Radix tree nén chuỗi node một-child thành edge dài, giảm bộ nhớ/I/O; hash map exact lookup expected O(1) nhưng không tự hỗ trợ enumerate prefix. Unicode cần quyết định byte/code point/normalization và ranking kết quả; có thể dùng top suggestions cache tại node. **Tiêu chí:** tính cả output O(k), không gọi O(L) là miễn phí, và bàn compact child representation, immutable snapshot/update.

### ALG-012 — [Senior] So sánh prefix sum, Fenwick Tree và Segment Tree cho range query/range update.
**Tình huống:** Dashboard nhận cập nhật liên tục và phải trả tổng hoặc min/max trên nhiều khoảng.

**Trả lời:** Prefix sum build O(n), range-sum O(1) nhưng point update O(n); difference array mạnh khi batch range update rồi materialize. Fenwick dùng O(n) RAM, point update/prefix query O(log n), code gọn cho phép toán có inverse như sum. Segment tree dùng O(n), query/update O(log n), hỗ trợ min/max, custom monoid và lazy propagation cho range update nhưng phức tạp hơn. **Tiêu chí:** xác định online/offline, phép kết hợp và loại update trước khi chọn; chú ý indexing, overflow và lazy-tag composition.

## Đồ thị, tìm kiếm và sắp xếp

### ALG-013 — [Middle] BFS và DFS khác nhau về invariant, độ phức tạp, bộ nhớ và loại bài toán phù hợp ra sao?
**Tình huống:** Vừa cần đường đi ít cạnh nhất, vừa cần phát hiện thành phần liên thông trên đồ thị lớn.

**Trả lời:** BFS mở rộng theo từng lớp bằng queue nên lần đầu thăm là số cạnh ít nhất trong đồ thị không trọng số; DFS đi sâu bằng stack/recursion, hợp cycle/SCC/topological/component. Cả hai O(V+E) với adjacency list và O(V) visited; BFS có frontier rất rộng, DFS có depth/stack overflow. Phải đánh dấu visited đúng thời điểm—thường khi enqueue để tránh nhân bản. **Tiêu chí:** phân biệt shortest theo số cạnh với weighted path, xử lý disconnected graph và recursion limit.

### ALG-014 — [Middle] Topological sort được xây dựng thế nào và phát hiện cycle trong directed graph ra sao?
**Tình huống:** Sắp xếp thứ tự build/deploy của các module có dependency.

**Trả lời:** Kahn duy trì indegree, enqueue mọi đỉnh 0 và giảm indegree theo cạnh; nếu output ít hơn V thì có cycle. DFS dùng ba màu/unvisited-visiting-done, cạnh tới `visiting` là back edge, reverse postorder cho topo. Thời gian O(V+E); topo không duy nhất, nên dùng tie-break ổn định nếu reproducible build. **Tiêu chí:** làm rõ hướng dependency, trả cycle/path để chẩn đoán, và không chạy topo trên graph có cycle rồi bỏ sót node.

### ALG-015 — [Senior] Chọn BFS, Dijkstra, 0-1 BFS, Bellman-Ford hay A* cho shortest path dựa trên điều kiện nào?
**Tình huống:** Hệ thống routing có lúc trọng số âm, có lúc chỉ 0/1, và có truy vấn theo tọa độ địa lý.

**Trả lời:** BFS cho unweighted/equal weight; 0-1 BFS dùng deque O(V+E); Dijkstra cần trọng số không âm, thường O((V+E)logV); Bellman-Ford O(VE) cho cạnh âm và phát hiện negative cycle. A* dùng heuristic admissible (và preferably consistent) để giảm vùng tìm kiếm, vẫn cần điều kiện trọng số; heuristic 0 trở thành Dijkstra. **Tiêu chí:** ứng viên kiểm tra precondition trước, dùng stale-entry/visited đúng trong priority queue, và nói rõ negative cycle làm shortest path không xác định.

### ALG-016 — [Middle] Minimum Spanning Tree khác shortest-path tree thế nào; Kruskal và Prim phù hợp khi nào?
**Tình huống:** Nối các data center với tổng chi phí đường truyền nhỏ nhất nhưng không yêu cầu đường từ một nguồn là ngắn nhất.

**Trả lời:** MST tối thiểu tổng trọng số để nối mọi đỉnh; đường giữa hai đỉnh trong MST không nhất thiết ngắn nhất. Kruskal sort cạnh rồi Union-Find, O(E log E), thuận lợi với edge list/sparse graph; Prim phát triển từ một đỉnh bằng priority queue, O(E log V), tự nhiên với adjacency list. Graph rời rạc tạo minimum spanning forest; cạnh bằng nhau có thể cho nhiều MST. **Tiêu chí:** không nhầm mục tiêu với Dijkstra, nêu cut/cycle property để chứng minh.

### ALG-017 — [Senior] Strongly Connected Components giúp giải quyết bài toán thực tế nào và Tarjan/Kosaraju khác nhau ra sao?
**Tình huống:** Gom các service phụ thuộc vòng lẫn nhau trước khi lập kế hoạch migration.

**Trả lời:** SCC là nhóm đỉnh đi tới nhau hai chiều; co mỗi SCC thành một đỉnh tạo condensation DAG, hữu ích để xử lý dependency cycle theo nhóm. Kosaraju dùng hai lượt DFS và transpose graph; Tarjan một lượt với discovery index, low-link và stack, đều O(V+E). Tarjan tiết kiệm transpose nhưng invariant khó cài đúng hơn. **Tiêu chí:** giải thích `low-link`, chỉ pop khi root SCC, xử lý graph lớn bằng iterative DFS nếu stack hạn chế.

### ALG-018 — [Middle] Chọn adjacency list, adjacency matrix hay edge list dựa trên mật độ và thao tác chính như thế nào?
**Tình huống:** Biểu diễn mạng có hàng triệu đỉnh nhưng ít cạnh, đồng thời cần batch xử lý cạnh.

**Trả lời:** Adjacency list dùng O(V+E), duyệt neighbor tốt cho sparse graph; matrix O(V²), kiểm tra cạnh O(1), phù hợp graph dày hoặc bitset acceleration. Edge list O(E), tốt cho sort/stream/Kruskal nhưng tìm neighbor chậm nếu không index. Với ID thưa cần remap/CSR để compact; directed/undirected quyết định lưu một hay hai cung. **Tiêu chí:** tính memory thực tế, mutation so với snapshot, locality và thao tác chủ đạo.

### ALG-019 — [Middle] Viết binary search không lỗi biên bằng invariant nào và xử lý `lower_bound`/`upper_bound` ra sao?
**Tình huống:** Tìm vị trí đầu tiên thỏa predicate đơn điệu trong dữ liệu có phần tử trùng.

**Trả lời:** Dùng miền nửa mở `[lo, hi)` với invariant đáp án nằm trong miền; đặt `mid = lo + (hi-lo)/2`, nếu predicate đúng thì `hi=mid`, ngược lại `lo=mid+1`. Kết thúc `lo==hi`; lower_bound tìm `>=x`, upper_bound tìm `>x`, rồi phải kiểm tra index trước exact match. O(log n), O(1). **Tiêu chí:** predicate thực sự đơn điệu, loop luôn tiến, xử lý empty/duplicate/overflow và test biên 0/1 phần tử.

### ALG-020 — [Middle] Tìm kiếm trong sorted rotated array, kể cả khi có duplicate, thay đổi binary search thế nào?
**Tình huống:** Một mảng tăng dần bị rotate tại vị trí không biết trước và cần tìm key với ít phép so sánh.

**Trả lời:** Không duplicate, mỗi bước ít nhất một nửa `[lo..mid]` hoặc `[mid..hi]` còn sorted; kiểm tra target nằm trong nửa đó để bỏ nửa kia, O(log n). Khi `a[lo]==a[mid]==a[hi]` không xác định phía sorted, phải co biên, nên worst-case O(n) dù thường vẫn log. Có thể tìm pivot rồi binary search, nhưng pivot cũng gặp ambiguity. **Tiêu chí:** điều kiện biên nhất quán và ứng viên chủ động nêu degradation do duplicate.

### ALG-021 — [Middle] Vì sao comparison sort có lower bound Ω(n log n), và stability/in-place ảnh hưởng lựa chọn thuật toán ra sao?
**Tình huống:** Sắp xếp record theo nhiều khóa mà thứ tự từ lần sort trước phải được bảo toàn.

**Trả lời:** Mô hình decision tree phải phân biệt n! permutation, nên chiều cao tối thiểu `log2(n!) = Ω(n log n)`. Stable sort giữ thứ tự tương đối của phần tử bằng khóa, cho phép sort nhiều khóa từ khóa phụ tới chính; in-place nói về extra memory, không đồng nghĩa stable. Merge sort thường stable/O(n) extra, heapsort in-place nhưng không stable. **Tiêu chí:** biết lower bound chỉ áp dụng comparison model; có thể vượt bằng counting/radix khi khai thác miền khóa.

### ALG-022 — [Senior] Quicksort có worst-case O(n²); production implementation giảm rủi ro bằng cách nào?
**Tình huống:** Input có thể được kẻ tấn công chọn để làm chậm dịch vụ sort.

**Trả lời:** Random pivot hoặc median-of-three giảm input pattern thông thường; 3-way partition xử lý duplicate; insertion sort cho partition nhỏ. Introsort theo dõi depth và chuyển sang heapsort khi quá sâu để bảo đảm O(n log n), đồng thời recurse nhánh nhỏ trước để stack O(log n). Randomization cần seed không đoán được nếu attack model quan trọng. **Tiêu chí:** nêu cả CPU worst-case, recursion/stack, stability và không khẳng định median-of-three loại bỏ adversarial input.

### ALG-023 — [Middle] Merge sort và external merge sort phù hợp với dữ liệu vượt RAM như thế nào?
**Tình huống:** Sắp xếp file log 2 TB trên máy chỉ có 16 GB RAM.

**Trả lời:** Đọc từng chunk vừa RAM, sort nội bộ rồi ghi thành sorted run; sau đó k-way merge các run bằng min-heap và buffer I/O. CPU O(n log n), merge heap O(n log r), nhưng mục tiêu chính là ít pass và I/O tuần tự; fan-in bị giới hạn bởi RAM/file descriptor. Có thể multi-pass, compression và checkpoint/cleanup temp file. **Tiêu chí:** không cố load hết, tính disk space gần kích thước input, lựa chọn chunk/buffer và xử lý record/encoding ổn định.

### ALG-024 — [Senior] Khi nào counting sort, radix sort hoặc bucket sort tốt hơn comparison sort?
**Tình huống:** Sắp xếp hàng trăm triệu integer hoặc ID có miền giá trị biết trước.

**Trả lời:** Counting sort O(n+K), phù hợp miền K nhỏ và cần RAM O(K). Radix sort xử lý d digit bằng stable pass, O(d(n+b)), tốt cho fixed-width integer/string nếu chọn base theo cache; phải xử lý signed/endianness. Bucket sort đạt expected linear khi phân phối gần đều nhưng bucket lệch có thể xấu. **Tiêu chí:** tính cả K/d/RAM, stability của pass, distribution assumption và benchmark constant/memory bandwidth.

### ALG-025 — [Senior] Quickselect tìm phần tử thứ k với expected O(n) ra sao và làm thế nào có worst-case bảo đảm?
**Tình huống:** Tính percentile trên một batch lớn mà không cần sắp xếp toàn bộ.

**Trả lời:** Partition quanh pivot như quicksort nhưng chỉ tiếp tục phía chứa rank k; randomized pivot cho recurrence kỳ vọng O(n), in-place, worst O(n²). Median-of-medians chọn pivot bảo đảm phần đủ lớn bị loại mỗi bước, worst O(n) nhưng constant cao; introselect có thể fallback. Duplicate nên dùng 3-way partition. **Tiêu chí:** phân biệt exact percentile convention, mutation input, k zero/one-based và khi streaming phải dùng sketch/hai heap thay thế.

## Mẫu giải bài và tối ưu

### ALG-026 — [Middle] Nhận diện khi nào dùng two pointers hay sliding window; điều kiện nào làm window không còn đơn điệu?
**Tình huống:** Tìm đoạn con ngắn nhất có tổng tối thiểu S khi dữ liệu có thể chứa số âm.

**Trả lời:** Sliding window O(n) cần khi mở rộng/thu hẹp làm điều kiện biến đổi đơn điệu, ví dụ tổng số không âm. Số âm phá invariant: bỏ phần tử trái có thể làm tổng tăng, nên window chuẩn bỏ lỡ đáp án. Với bài tổng ≥ S có số âm, dùng prefix sum và monotonic deque để tìm `P[j]-P[i]≥S` trong O(n). **Tiêu chí:** ứng viên phát hiện precondition, nêu invariant của hai pointer và đưa phản ví dụ nhỏ.

### ALG-027 — [Middle] Prefix sum và difference array chuyển đổi range query/range update như thế nào?
**Tình huống:** Áp dụng hàng triệu cập nhật cộng trên đoạn rồi chỉ cần xuất kết quả cuối cùng.

**Trả lời:** Prefix `P[i+1]=P[i]+a[i]` trả sum `[l,r)` bằng `P[r]-P[l]` O(1) sau build O(n), nhưng update online O(n). Difference array cập nhật cộng x trên `[l,r)` bằng `D[l]+=x; D[r]-=x`, mỗi update O(1), rồi prefix một lần O(n) để materialize. 2D mở rộng bằng inclusion-exclusion. **Tiêu chí:** thống nhất closed/half-open, cấp n+1 sentinel và kiểm soát overflow.

### ALG-028 — [Middle] Monotonic stack/queue duy trì invariant gì để giải next greater element và sliding-window maximum?
**Tình huống:** Tính max của mọi cửa sổ kích thước k trên stream với O(n).

**Trả lời:** Monotonic decreasing deque giữ index có giá trị giảm dần: bỏ tail nhỏ hơn giá trị mới vì không còn cơ hội làm max, bỏ head khi ra khỏi window; head luôn là max. Mỗi index vào/ra tối đa một lần nên O(n), RAM O(k). Stack tương tự giải next greater bằng cách pop phần tử bị phần tử mới “đánh bại”. **Tiêu chí:** lưu index chứ không chỉ value để expire duplicate, quy định `<` hay `<=` theo tie và xử lý k bất hợp lệ.

### ALG-029 — [Senior] Làm sao chứng minh một greedy algorithm đúng thay vì chỉ dựa vào trực giác?
**Tình huống:** Đề xuất chọn quyết định tốt nhất cục bộ cho bài toán scheduling có ràng buộc.

**Trả lời:** Thường dùng exchange argument: từ một nghiệm tối ưu, thay lựa chọn đầu bằng lựa chọn greedy mà không giảm chất lượng, rồi quy nạp; hoặc “stays ahead”, cut property/matroid. Phải chứng minh optimal substructure và feasibility sau trao đổi, không chỉ test ví dụ. Nếu weighted interval scheduling, chọn finish sớm không còn đúng và cần DP—đây là phản ví dụ quan trọng. **Tiêu chí:** phát biểu lemma rõ, chỉ ra tie và điều kiện bài toán; chủ động tìm counterexample khi thêm ràng buộc.

### ALG-030 — [Middle] Interval scheduling và interval merging khác nhau thế nào về mục tiêu và chiến lược sort?
**Tình huống:** Một bài cần chọn nhiều cuộc họp không giao nhau nhất, bài kia cần hợp nhất khung giờ bận.

**Trả lời:** Scheduling tối đa số interval không chồng nhau: sort theo end tăng dần rồi chọn interval bắt đầu sau end đã chọn; exchange argument chứng minh đúng, O(n log n). Merging: sort theo start, mở rộng end hiện tại nếu overlap, nếu không phát output; cũng O(n log n). Quy ước endpoint quyết định `start >= end` là tương thích hay overlap. **Tiêu chí:** không dùng chiến lược “ngắn nhất” cho scheduling, làm rõ weighted variant cần DP.

### ALG-031 — [Middle] Thiết kế dynamic programming bằng state, transition, base case và thứ tự tính như thế nào?
**Tình huống:** Một lời giải đệ quy đúng nhưng exponential và có nhiều subproblem lặp lại.

**Trả lời:** State phải chứa đúng thông tin tối thiểu để phần còn lại độc lập với lịch sử; transition liệt kê mọi lựa chọn, base case chặn biên, thứ tự tính phải bảo đảm dependency đã có. Memoization đi từ nhu cầu và dễ chuyển từ recursion; tabulation kiểm soát iteration/stack và thường cache-friendly hơn. Complexity là số state nhân số transition mỗi state, không chỉ nói “DP O(n)”. **Tiêu chí:** chứng minh recurrence bao phủ/không trùng lựa chọn, xác định impossible sentinel an toàn và có thể giảm dimension khi dependency cho phép.

### ALG-032 — [Senior] Phân biệt 0/1 knapsack, unbounded knapsack và bounded knapsack; vì sao hướng lặp capacity quan trọng?
**Tình huống:** Tối ưu danh mục tính năng theo ngân sách khi mỗi tính năng được chọn một lần hoặc nhiều lần.

**Trả lời:** Với DP một chiều, 0/1 duyệt capacity giảm để trạng thái của item hiện tại không tự được tái sử dụng; unbounded duyệt tăng để cho phép dùng item nhiều lần. Bounded có thể binary-split số lượng thành các item 0/1 hoặc dùng monotonic queue theo residue. Cơ bản O(nW), pseudo-polynomial theo budget W chứ không polynomial theo số bit input. **Tiêu chí:** phân biệt maximize value, feasibility, exact fill; xử lý item weight 0 và nhận ra khi W quá lớn cần approximation/khác state.

### ALG-033 — [Senior] Longest Increasing Subsequence O(n log n) hoạt động ra sao và có khôi phục được dãy không?
**Tình huống:** Dữ liệu có một triệu điểm, O(n²) không đáp ứng thời gian.

**Trả lời:** Mảng `tails[len]` giữ giá trị kết thúc nhỏ nhất của một increasing subsequence độ dài `len+1`; với mỗi x, binary search vị trí đầu `>=x` rồi thay, nên O(n log n). `tails` không tự là subsequence; muốn khôi phục phải lưu index tail và predecessor của từng phần tử rồi backtrack. Strict/non-decreasing quyết định lower_bound hay upper_bound. **Tiêu chí:** giải thích invariant “tail nhỏ mở nhiều cơ hội”, RAM O(n) khi reconstruct và xử lý duplicate đúng.

### ALG-034 — [Middle] Edit distance xây recurrence thế nào và giảm bộ nhớ từ O(mn) xuống O(min(m,n)) ra sao?
**Tình huống:** So sánh hai chuỗi dài khi chỉ cần khoảng cách, sau đó mở rộng để cần cả edit script.

**Trả lời:** `dp[i][j]` là chi phí đổi prefix i thành prefix j; nếu ký tự cuối bằng nhau lấy diagonal, nếu khác lấy 1 + min(delete, insert, replace), với base là độ dài prefix. Mỗi row chỉ phụ thuộc row trước và ô trái/diagonal nên giữ hai row O(min(m,n)); thời gian O(mn). Muốn edit script cần backpointer/full table, Hirschberg-style divide-and-conquer, hoặc recompute. **Tiêu chí:** nêu semantics Unicode/cost tùy biến, early cutoff/banded DP khi chỉ quan tâm threshold.

### ALG-035 — [Middle] Backtracking khác brute force thuần túy ở pruning và state restoration như thế nào?
**Tình huống:** Giải Sudoku/N-Queens mà không tạo toàn bộ tổ hợp trước.

**Trả lời:** Backtracking xây nghiệm từng bước, kiểm tra constraint sớm, bỏ cả nhánh không thể hợp lệ và undo chính xác trước khi thử lựa chọn khác. Worst-case vẫn exponential, nhưng chọn biến ràng buộc nhất trước, ordering tốt và bitset constraint giảm mạnh search. State mutable cần `choose -> recurse -> unchoose` kể cả khi return/exception. **Tiêu chí:** mô tả invariant partial solution luôn hợp lệ, không copy state vô tội vạ và không tuyên bố pruning đổi worst-case thành polynomial.

### ALG-036 — [Senior] Meet-in-the-middle giảm độ phức tạp exponential trong trường hợp nào?
**Tình huống:** Subset-sum có n khoảng 40, quá lớn cho 2^n nhưng nhỏ cho DP theo tổng.

**Trả lời:** Chia n phần tử thành hai nửa, enumerate khoảng `2^(n/2)` tổng mỗi bên; sort/hash một phía rồi với mỗi tổng phía kia tìm complement hoặc best bound. Thời gian thường O(2^(n/2) log 2^(n/2)), RAM O(2^(n/2)), biến 2^40 thành khoảng hai triệu trạng thái. Có thể giữ mask để reconstruct. **Tiêu chí:** nhận ra trade RAM lấy time, duplicate/overflow và trường hợp DP bitset theo tổng vẫn tốt hơn.

### ALG-037 — [Senior] Bitmask DP phù hợp với giới hạn nào và biểu diễn state ra sao?
**Tình huống:** Tìm tour tối ưu qua 20 điểm hoặc gán nhiệm vụ cho một tập nhỏ worker.

**Trả lời:** Với tập n nhỏ, mask biểu diễn phần tử đã dùng; TSP dùng `dp[mask][last]`, chuyển tới node chưa thăm, O(n²2^n) time và O(n2^n) RAM. Assignment có thể dùng `dp[mask]` với worker bằng popcount, O(n2^n). Precompute cost/compatibility và iterate submask khi cần, nhưng đó có thể thành O(3^n). **Tiêu chí:** ước lượng thật số state/RAM trước khi chọn (n≈20 thường sát giới hạn), dùng integer width đúng và sentinel tránh overflow.

## Chuỗi, xác suất và dữ liệu streaming

### ALG-038 — [Middle] KMP tránh quay lui con trỏ text bằng prefix-function như thế nào?
**Tình huống:** Tìm pattern lặp nhiều ký tự trong văn bản dài mà naive search bị chậm.

**Trả lời:** Prefix-function/LPS tại j cho độ dài proper prefix dài nhất cũng là suffix của pattern prefix đó. Khi mismatch sau j ký tự, giữ text index và fallback `j=LPS[j-1]`, vì phần prefix-suffix đã biết khớp; mỗi con trỏ tiến/lùi amortized tuyến tính. Build O(m), search O(n), RAM O(m). **Tiêu chí:** xử lý overlap, empty pattern và giải thích invariant thay vì thuộc code; cân nhắc library search thường được tối ưu tốt hơn.

### ALG-039 — [Middle] Rabin-Karp dùng rolling hash ra sao và phải xác minh collision như thế nào?
**Tình huống:** Tìm nhiều pattern hoặc phát hiện đoạn văn giống nhau trong tài liệu lớn.

**Trả lời:** Hash cửa sổ mới được cập nhật O(1) bằng bỏ ký tự đầu, nhân base và thêm ký tự cuối; khi hash bằng pattern vẫn phải so chuỗi để bảo đảm đúng. Expected O(n+m), nhưng nhiều collision có thể O(nm); double hash giảm xác suất chứ không thành chứng minh equality. Hữu ích cho nhiều pattern/cùng độ dài hoặc fingerprint. **Tiêu chí:** modular arithmetic/overflow đúng, normalization/encoding nhất quán và không dùng non-cryptographic hash làm bằng chứng an ninh.

### ALG-040 — [Senior] Thiết kế rolling hash/double hash an toàn trước collision và input đối kháng ra sao?
**Tình huống:** Dùng hash làm căn cứ deduplicate nhưng false equality có hậu quả nghiêm trọng.

**Trả lời:** Chọn base/mod độc lập, có thể randomize per process và double hash để giảm accidental collision; tính xác suất theo số phép so sánh (birthday bound), không chỉ một cặp. Với correctness tuyệt đối, hash chỉ là prefilter rồi byte-compare; với dữ liệu adversarial hoặc định danh nội dung dùng cryptographic hash và vẫn có policy xác minh theo mức rủi ro. Rolling hash dễ bị forge và không chống sửa đổi. **Tiêu chí:** ứng viên tách performance fingerprint khỏi security digest, quản lý seed/persistence và nêu canonicalization trước hash.

### ALG-041 — [Senior] Suffix array, suffix tree và suffix automaton khác nhau về khả năng, bộ nhớ và độ khó triển khai thế nào?
**Tình huống:** Cần nhiều truy vấn substring và longest repeated substring trên một corpus tương đối tĩnh.

**Trả lời:** Suffix array lưu thứ tự suffix, compact, tìm pattern O(m log n) cơ bản hoặc O(m+log n) với LCP/tối ưu; build có thuật toán O(n log n)/O(n). Suffix tree cho query O(m) nhưng pointer-heavy và implementation khó; suffix automaton có O(n) state, mạnh cho distinct substring/longest common substring và online append. Constants/Unicode/corpus nhiều document quyết định thực tế. **Tiêu chí:** không hứa tree “O(n) memory” là nhỏ, biết LCP dùng cho repeated substring và ưu tiên implementation đã kiểm chứng.

### ALG-042 — [Senior] Tìm palindrome dài nhất bằng center expansion, DP và Manacher có trade-off gì?
**Tình huống:** Chọn lời giải production dễ bảo trì nhưng vẫn đáp ứng giới hạn input lớn.

**Trả lời:** Center expansion O(n²) worst, O(1) RAM, rất đơn giản; DP O(n²) time/RAM và ít lợi cho chỉ một kết quả. Manacher tái sử dụng bán kính đối xứng quanh palindrome phải nhất, đạt O(n) time/RAM nhưng code/index sentinel dễ lỗi. Với input vừa, center expansion thường đáng tin hơn; input rất lớn mới biện minh Manacher. **Tiêu chí:** xử lý tâm chẵn/lẻ, Unicode unit và benchmark/giới hạn thay vì tối ưu phô diễn.

### ALG-043 — [Senior] Bloom filter bảo đảm gì, tính false-positive thế nào và dùng ở đâu trong hệ thống?
**Tình huống:** Tránh phần lớn disk lookup cho key chắc chắn không tồn tại nhưng không được phép false-negative.

**Trả lời:** Bit array m và k hash: add set k bit, lookup âm là chắc chắn không có, dương chỉ là “có thể”; xác suất xấp xỉ `(1-e^(-kn/m))^k`, k tối ưu khoảng `(m/n)ln2`. Không xóa an toàn nếu không counting Bloom; vượt capacity làm FPR tăng và lỗi hash/persistence có thể tạo false-negative thực tế. Dùng trước SSTable/disk/cache miss, nhưng positive vẫn phải kiểm tra nguồn thật. **Tiêu chí:** sizing theo n và FPR, rebuild/version, không dùng Bloom làm authorization hoặc nguồn tồn tại duy nhất.

### ALG-044 — [Senior] Reservoir sampling lấy mẫu đều từ stream không biết trước độ dài như thế nào?
**Tình huống:** Chọn 1.000 sự kiện đại diện từ luồng vô hạn với bộ nhớ giới hạn.

**Trả lời:** Giữ k phần tử đầu; với phần tử thứ i (1-based, i>k), chọn nó với xác suất k/i và nếu chọn thì thay một vị trí uniform trong reservoir. Quy nạp cho thấy mỗi phần tử sau i bước có xác suất k/i nằm trong mẫu; time O(n), RAM O(k). Stream vô hạn chỉ có snapshot tại một thời điểm; weighted/decayed sample cần thuật toán khác. **Tiêu chí:** random range không lệch/modulo bias, reproducible seed khi test và xử lý merge reservoir phân tán đúng trọng số.

### ALG-045 — [Senior] Tìm approximate distinct count hoặc heavy hitters trong stream bằng cấu trúc nào?
**Tình huống:** Telemetry có hàng tỷ event/ngày; exact set hoặc full frequency map vượt ngân sách RAM.

**Trả lời:** HyperLogLog ước lượng cardinality từ phân bố leading-zero trong nhiều register, RAM cố định và merge bằng max register; sai số tương đối khoảng `1.04/sqrt(m)`. Count-Min Sketch cập nhật/query O(d), không undercount nhưng overcount do collision; kết hợp heap/candidate algorithm để tìm heavy hitters. Misra–Gries có bound tần suất với k counter. **Tiêu chí:** nêu error/confidence và mergeability, không dùng CMS một mình để enumerate key chưa lưu, kiểm tra skew/adversarial hash.

## Đồng thời và thuật toán hệ thống

### ALG-046 — [Senior] Producer–consumer queue cần xử lý bounded capacity, backpressure và shutdown ra sao?
**Tình huống:** Producer nhanh hơn consumer gây tăng RAM; hệ thống phải dừng mà không mất job đang xử lý.

**Trả lời:** Bounded queue đặt giới hạn tài nguyên; khi đầy producer block/await, reject, shed hoặc spill theo SLA. Semaphore/condition phải dùng vòng `while` quanh predicate, signal đúng và bảo vệ enqueue/dequeue; abstraction channel thường an toàn hơn tự viết. Shutdown nên ngừng nhận, propagate completion, drain hoặc cancel theo policy và await consumer; poison pill khó với nhiều producer/consumer. **Tiêu chí:** phân biệt graceful với immediate, xử lý exception/cancellation, telemetry queue depth và không hứa “không mất” nếu queue chỉ ở RAM.

### ALG-047 — [Senior] Lock-free CAS loop có thể gặp ABA problem như thế nào và khắc phục bằng cách nào?
**Tình huống:** Xây stack/queue concurrent, một node bị lấy ra rồi tái sử dụng trước khi thread khác CAS.

**Trả lời:** Thread đọc A, bị pause; thread khác đổi A→B→A, CAS đầu tiên thấy A nên thành công dù cấu trúc/lifetime đã đổi. Tagged/versioned pointer khiến A mới khác version; hazard pointers, epoch-based reclamation/RCU ngăn node bị free/reuse khi còn reader. GC giảm reclamation hazard nhưng logical ABA vẫn có thể tồn tại. **Tiêu chí:** nói rõ memory ordering/linearization point, progress guarantee (lock-free không phải wait-free) và khuyên dùng primitive/library đã chứng minh.

### ALG-048 — [Senior] Thiết kế rate limiter bằng fixed window, sliding log/counter, token bucket và leaky bucket như thế nào?
**Tình huống:** API cần cho phép burst có kiểm soát và triển khai trên nhiều instance.

**Trả lời:** Fixed window O(1) nhưng burst gấp đôi ở biên; sliding log chính xác nhưng tốn O(request); sliding counter nội suy hai bucket là xấp xỉ. Token bucket tích token theo rate, capacity quyết định burst; leaky bucket làm phẳng tốc độ/queue. Distributed limiter cần atomic script/transaction tại store, clock policy, partition/fail-open/closed và local quota để giảm latency. **Tiêu chí:** quy đổi business identity/key, trả retry metadata, chống hot key và đánh giá độ chính xác so với availability.

### ALG-049 — [Senior] Consistent hashing và rendezvous hashing giảm remapping khi node thay đổi ra sao?
**Tình huống:** Phân phối cache key trên cluster thường xuyên scale up/down và có node khác năng lực.

**Trả lời:** Consistent-hash ring map cả node/key lên vòng; key thuộc node kế tiếp, thêm/xóa node chỉ đổi vùng lân cận, virtual node cải thiện cân bằng và weighting. Rendezvous hash chấm điểm key với từng node, chọn điểm cao nhất; đơn giản, cân bằng tốt, removal chỉ remap key của node đó nhưng lookup O(N) nếu không tối ưu. Replication chọn nhiều node độc lập và failure domain. **Tiêu chí:** đo distribution/remap, version membership nhất quán và không nhầm hashing với replication/consistency dữ liệu.

### ALG-050 — [Senior] Skip list đạt expected O(log n) bằng ngẫu nhiên như thế nào và vì sao hợp với concurrent ordered map?
**Tình huống:** Cần ordered index hỗ trợ range scan nhưng muốn implementation concurrent đơn giản hơn balanced tree.

**Trả lời:** Mỗi node được nâng level với xác suất p, tạo các “express lane”; expected số node mỗi tầng giảm hình học, search/insert/delete expected O(log n), worst O(n). Range scan đi level 0 có thứ tự. Mutation chủ yếu sửa một số forward pointer, thuận lợi cho CAS/fine-grained lock hơn rotation cây, nhưng reclamation và probabilistic tail vẫn khó. **Tiêu chí:** nêu seed/level cap, duplicate semantics, memory overhead và linearizability của implementation concurrent.

### ALG-051 — [Senior] Cache eviction LRU, LFU, FIFO, Random và TinyLFU phù hợp workload nào?
**Tình huống:** Cache hit-rate thấp vì scan tuần tự đẩy các hot key ra ngoài.

**Trả lời:** LRU ưu tiên recency nhưng scan-pollution; LFU giữ frequency song thích nghi chậm và cần aging; FIFO/Random rẻ metadata/lock. TinyLFU dùng frequency sketch để *admit* item mới, thường kết hợp window LRU + segmented LRU, chặn one-hit scan đẩy hot key. Phải cân object size/cost/TTL chứ không chỉ số entry. **Tiêu chí:** dùng trace/hit-rate và P99 để chọn, bàn concurrency/metadata overhead, không coi cache policy chữa dữ liệu stale.

### ALG-052 — [Senior] Thiết kế idempotency/deduplication bằng exact set, TTL, sequence number hay probabilistic structure thế nào?
**Tình huống:** Message broker giao ít nhất một lần và consumer không được ghi nhận giao dịch hai lần.

**Trả lời:** Với hiệu ứng tài chính, dùng idempotency key/producer sequence lưu bền và unique constraint trong cùng transaction với business write; duplicate đọc lại kết quả. TTL phải dài hơn cửa sổ retry tối đa nhưng dọn dữ liệu; sequence per aggregate phát hiện cũ/lỗ hổng song cần ordering. Bloom chỉ nên prefilter vì false-positive có thể làm bỏ message thật. **Tiêu chí:** xác định scope key/payload mismatch, atomicity/crash window, replay sau retention và hiểu “exactly once” là thuộc tính end-to-end.

### ALG-053 — [Senior] External Top-K hoặc distributed Top-K được hợp nhất đúng và tiết kiệm network ra sao?
**Tình huống:** Mỗi shard có hàng tỷ record; coordinator cần global Top-100.

**Trả lời:** Nếu score của item độc lập và mỗi item thuộc một shard, mọi global Top-k phải nằm trong local Top-k; shard gửi k ứng viên, coordinator k-way merge/min-heap O(Sk log S) thay vì toàn bộ dữ liệu. Có tie thì quy định total ordering và có thể gửi quá k để đáp ứng include-ties. Với aggregate score trải nhiều shard, lập luận trên không còn đúng; cần partial aggregate/threshold algorithm. **Tiêu chí:** chứng minh điều kiện local-k, xử lý shard chậm/failure, pagination và tránh materialize S×k không cần thiết.

### ALG-054 — [Senior] Lập lịch task DAG với giới hạn tài nguyên và critical path như thế nào?
**Tình huống:** Pipeline có dependency, task dùng CPU/RAM khác nhau và cần giảm makespan.

**Trả lời:** Topological order xác định task ready; longest weighted path trên DAG cho critical-path lower bound và priority. Khi resource hữu hạn, resource-constrained scheduling tổng quát là NP-hard, nên dùng list scheduling theo criticality, bin packing heuristic và work-conserving queue; duration estimate cần cập nhật. Không được chạy task khi dependency fail nếu policy không cho phép. **Tiêu chí:** phân biệt correctness dependency với tối ưu makespan, chống starvation, admission/resource reservation và đo utilization/queue delay.

## Bài coding và quyết định thực tế

### ALG-055 — [Middle] Viết thuật toán median của data stream và phân tích cách cân bằng hai heap.
**Tình huống:** Sau mỗi số đến, hệ thống phải trả median trong O(log n) update.

**Trả lời:** Max-heap `low` giữ nửa nhỏ, min-heap `high` giữ nửa lớn; invariant mọi `low <= high` và size chênh tối đa 1. Insert theo root rồi rebalance một phần tử; median là root heap lớn hơn hoặc trung bình hai root. Update O(log n), query O(1), RAM O(n); phép cộng median phải tránh overflow. **Tiêu chí:** test duplicate/negative, quy ước median khi chẵn và biết sliding median cần lazy deletion/order-statistic tree.

### ALG-056 — [Middle] Hợp nhất danh sách interval có biên đóng/mở và dữ liệu không được sort như thế nào?
**Tình huống:** Chuẩn hóa các khoảng hiệu lực, trong đó `[1,2]` và `(2,3]` có thể không được xem là chồng lấn.

**Trả lời:** Chuẩn hóa interval hợp lệ và sort theo start, khi start bằng nhau đặt closed/open theo comparator đã định; quét và merge nếu giao thật theo semantics endpoint. Ở cùng tọa độ, `[1,2]` với `(2,3]` có giao rỗng, còn `[1,2]` với `[2,3]` giao tại 2; yêu cầu có thể muốn merge cả adjacency nên phải tách policy. O(n log n), output O(n). **Tiêu chí:** không chỉ dùng `next.start <= end` mù quáng, xử lý empty/infinite/time zone và giữ cờ endpoint khi mở rộng.

### ALG-057 — [Senior] Giải Word Ladder hoặc shortest transformation path mà không dựng O(N²) cạnh ra sao?
**Tình huống:** Dictionary có hàng trăm nghìn từ cùng độ dài và cần trả đường biến đổi ngắn nhất.

**Trả lời:** Index mỗi từ theo wildcard pattern như `h*t`; các từ chung pattern là neighbor, build O(NL²) nếu tạo string hoặc O(NL) hash hợp lý, tránh so mọi cặp. BFS cho shortest steps; bidirectional BFS từ begin/end thường giảm frontier mạnh, luôn mở rộng phía nhỏ hơn. Đánh dấu visited/parent và clear bucket sau dùng để tránh lặp. **Tiêu chí:** end phải trong dictionary theo spec, Unicode/độ dài, reconstruct path khi hai frontier gặp và không tuyên bố bidirectional thay đổi worst-case.

### ALG-058 — [Senior] Thiết kế LFU cache O(1) trung bình với quy tắc tie-break theo recency như thế nào?
**Tình huống:** Cache phải tăng frequency, evict đúng và tránh giữ metadata rác sau nhiều thao tác.

**Trả lời:** Map key→node; map frequency→doubly linked list theo recency; `minFreq` chỉ bucket nhỏ nhất. Get/update bỏ node khỏi bucket f, thêm MRU bucket f+1, xóa bucket rỗng và tăng `minFreq` nếu cần; insert mới f=1, khi đầy evict LRU của `minFreq`. O(1) trung bình nhưng metadata O(capacity); frequency cần aging/rescale tránh stale/overflow. **Tiêu chí:** xử lý capacity 0, update existing cũng tăng frequency theo contract, atomicity concurrent và invariant node chỉ thuộc một bucket.

### ALG-059 — [Senior] Phát hiện duplicate gần nhau theo cả khoảng cách index k và chênh lệch giá trị t như thế nào?
**Tình huống:** Kiểm tra stream số lớn, không thể so sánh mọi cặp trong cửa sổ.

**Trả lời:** Giữ ordered multiset của k phần tử gần nhất; với x tìm lower_bound `x-t` và kiểm tra `<=x+t`, O(n log k), rồi xóa phần tử ra cửa sổ. Hoặc bucket width `t+1`: cùng bucket chắc đạt điều kiện, chỉ kiểm tra hai bucket kề, expected O(n); phải floor-division đúng cho số âm và dùng integer rộng tránh overflow. t<0 luôn false. **Tiêu chí:** eviction đúng thứ tự, duplicate count trong multiset và nhận ra hash bucket worst-case/adversarial.

### ALG-060 — [Senior] Khi yêu cầu thay đổi liên tục, chọn thuật toán exact, approximation hay precomputation dựa trên tiêu chí nào?
**Tình huống:** P99 latency, RAM, độ chính xác, tần suất update và chi phí vận hành mâu thuẫn nhau; hãy trình bày decision record.

**Trả lời:** Ghi rõ workload (n, skew, QPS, read/write), error budget/cost of wrong answer, latency tail, RAM/disk/network và freshness; lập ít nhất exact baseline và một phương án approximation/precompute. Precompute đổi write/storage/freshness lấy read latency; approximation cần bound/confidence và fallback/audit; exact có thể partition/batch nhưng đắt. Benchmark dữ liệu đại diện, theo dõi degradation và đặt ngưỡng chuyển chế độ/version kết quả. **Tiêu chí:** quyết định có giả định đo được, correctness boundary, failure mode/rollback và tổng chi phí vận hành—không chọn chỉ vì Big-O đẹp.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

### ALG-061 — [Basic] ⭐ Phân tích Big-O của hai vòng lặp có hai kích thước đầu vào độc lập và bước tăng theo cấp số nhân như thế nào?
**Tình huống:** Code có vòng ngoài chạy `n` lần và vòng trong chạy `j = 1, 2, 4, ... < m`; hãy nêu time/space complexity và giải thích vì sao không nên mặc định viết O(n²).

**Trả lời:** Vòng trong chạy `⌈log₂m⌉` lần, nên tổng thời gian là Θ(n log m), không phải O(n²); chỉ khi đề cho `m` liên hệ đặc biệt với `n` mới thay biến, ví dụ `m=n` cho Θ(n log n). Nếu chỉ dùng vài biến đếm thì auxiliary space O(1). Cần tách kích thước input độc lập và nói rõ bound Θ khi đếm chặt, thay vì nhân mọi “hai vòng” thành n². **Pitfall:** `j++` mới là Θ(m), còn `j*=2` là logarithmic; `m<=1` cần tránh loop không tiến. **Follow-up Senior:** phân tích loop có số bước phụ thuộc dữ liệu, overflow của `j*=2`, cache/I/O và bound amortized thay vì chỉ CPU Big-O.

### ALG-062 — [Basic] ⭐ Giải bài Two Sum trả về hai index khác nhau bằng hash map như thế nào?
**Tình huống:** Mảng có số âm, duplicate và có thể không có đáp án; hãy nêu thứ tự kiểm tra/lưu phần tử, complexity và contract khi có nhiều cặp hợp lệ.

**Trả lời:** Duyệt `i` từ trái sang phải, tính `need = target-a[i]`, kiểm tra `need` trong map `value -> index` *trước* khi lưu `a[i]`; như vậy không dùng cùng index hai lần và `[3,3]` vẫn tìm được cặp ở lần thứ hai. Average time O(n), space O(n); worst-case hash phụ thuộc implementation/attack model. Nếu không có đáp án trả `null/Optional` hoặc result type, không dùng cặp sentinel có thể hợp lệ. **Pitfall:** phép trừ có thể overflow nên dùng kiểu rộng/check; map ghi đè duplicate ảnh hưởng tie-break. **Follow-up Senior:** định nghĩa trả cặp đầu tiên, lexicographically nhỏ nhất hay mọi cặp; mọi cặp có output-size tới O(n²), còn input sorted cho phép two pointers O(1) extra space.

### ALG-063 — [Basic] ⭐ Đảo ngược singly linked list bằng iterative và recursive approach ra sao?
**Tình huống:** Cần đảo list tại chỗ, giữ không mất phần đuôi và xử lý list rỗng/một node; hãy chỉ ra invariant con trỏ ở mỗi bước.

**Trả lời:** Iterative giữ `prev=null`, `cur=head`; mỗi vòng lưu `next=cur.next`, đặt `cur.next=prev`, rồi tiến `prev=cur`, `cur=next`. Invariant: `prev` là prefix đã đảo đúng, `cur` là đầu suffix chưa xử lý và mọi node vẫn thuộc đúng một trong hai phần. Time O(n), extra space O(1); kết thúc trả `prev`. Recursive đảo suffix rồi đặt `head.next.next=head; head.next=null`, time O(n), call stack O(n). **Pitfall:** đổi link trước khi lưu `next` làm mất suffix; quên đặt tail mới về null tạo cycle. **Follow-up Senior:** list rất dài nên ưu tiên iterative; nếu concurrent/shared nodes phải định nghĩa ownership vì mutation tại chỗ không thread-safe.

### ALG-064 — [Basic] ⭐ Kiểm tra chuỗi ngoặc `()[]{}` hợp lệ bằng stack như thế nào?
**Tình huống:** Chuỗi có thể rỗng, chứa loại ngoặc lồng nhau và ký tự thường; hãy định nghĩa rõ policy cho ký tự không phải ngoặc.

**Trả lời:** Push opening bracket; gặp closing bracket thì stack phải không rỗng và top đúng loại, sau cùng stack phải rỗng. Có thể dùng map `')'->'('` để tránh nhiều nhánh. Time O(n), space O(n) worst-case; chuỗi rỗng hợp lệ theo contract phổ biến. Ký tự thường phải được quy định là bỏ qua hoặc làm input invalid—không ngầm trộn hai semantics. **Pitfall:** chỉ đếm tổng số mở/đóng không phát hiện `([)]`; pop trước khi kiểm tra rỗng. **Follow-up Senior:** với stream lớn vẫn cần O(depth), có thể đặt maximum nesting depth để chống resource abuse và báo vị trí/token lỗi thay vì chỉ boolean.

### ALG-065 — [Basic] ⭐ Cài queue FIFO bằng hai stack và chứng minh chi phí amortized như thế nào?
**Tình huống:** Queue cần `enqueue`, `dequeue`, `peek` và báo lỗi khi rỗng mà không được chuyển toàn bộ phần tử qua lại ở mọi thao tác.

**Trả lời:** `enqueue` push vào `in`; `dequeue/peek` đọc `out`, và chỉ khi `out` rỗng mới pop toàn bộ `in` sang `out`, đảo thứ tự thành FIFO. Mỗi phần tử được push/pop qua mỗi stack tối đa một lần, nên một thao tác chuyển có thể O(n) nhưng chuỗi thao tác có O(1) amortized; space O(n). Empty khi cả hai stack rỗng, API nên trả `TryDequeue/Optional` hoặc exception được document. **Pitfall:** chuyển ở mỗi dequeue làm O(n) mỗi lần; trộn enqueue trực tiếp vào `out` phá thứ tự. **Follow-up Senior:** worst-case latency vẫn O(n), nên real-time system có thể dùng incremental transfer hoặc ring buffer; concurrent queue cần atomicity khác hoàn toàn.

### ALG-066 — [Basic] ⭐ Tìm ký tự xuất hiện đúng một lần đầu tiên trong chuỗi bằng counting/hash như thế nào?
**Tình huống:** Input có thể chứa Unicode, khác biệt hoa thường và chuỗi rất dài; hãy nêu giả định về “ký tự” và cách giữ đúng thứ tự xuất hiện.

**Trả lời:** Pass một đếm frequency, pass hai theo thứ tự input và trả đơn vị đầu có count 1; time O(n), space O(k) với k số ký hiệu khác nhau. Với alphabet nhỏ cố định có thể dùng array; với Unicode phải nói rõ code unit, code point hay grapheme cluster. Case-sensitive giữ nguyên; case-insensitive cần normalization/case-fold nhất quán nhưng kết quả trả theo vị trí bản gốc. **Pitfall:** iterate UTF-16 `char` có thể tách surrogate pair; duyệt map frequency không bảo đảm thứ tự input. **Follow-up Senior:** stream một pass không biết tương lai có thể giữ linked candidate queue + count, nhưng memory vẫn theo distinct/candidate; normalization Unicode có thể đổi số code point và cần threat model spoofing.

### ALG-067 — [Basic] ⭐ Duyệt preorder, inorder, postorder và level-order của binary tree khác nhau thế nào?
**Tình huống:** Hãy chọn stack/queue hoặc recursion, nêu output order, complexity và rủi ro khi cây lệch có độ sâu rất lớn.

**Trả lời:** Preorder là root-left-right, inorder left-root-right, postorder left-right-root; recursion hoặc explicit stack giữ traversal state. Level-order dùng queue và xử lý theo từng breadth layer. Mọi traversal thăm n node nên O(n); DFS dùng O(h) stack theo chiều cao, BFS dùng O(w) theo maximum width. Inorder chỉ cho sorted output nếu cây là BST theo invariant. **Pitfall:** recursion trên cây lệch h=n có thể stack overflow; postorder iterative cần visited-state/hai stack hoặc kỹ thuật tương đương. **Follow-up Senior:** traversal lazy/iterator phải giữ state và cancellation; cây có parent/shared node/cycle không còn là tree thuần và cần visited/ownership contract.

### ALG-068 — [Middle] ⭐ Hợp nhất hai sorted array khi mảng thứ nhất có đủ buffer ở cuối như thế nào?
**Tình huống:** Không được cấp phát mảng O(m+n); dữ liệu có duplicate và cần giữ toàn bộ phần tử theo thứ tự không giảm.

**Trả lời:** Đặt `i=m-1`, `j=n-1`, `write=m+n-1`; so sánh từ cuối và ghi phần tử lớn hơn vào `a[write--]`, sau đó copy phần còn lại của mảng hai. Đi từ cuối tránh ghi đè phần chưa đọc trong buffer đầu. Time O(m+n), extra space O(1); phần còn lại của mảng một đã đúng vị trí. **Pitfall:** metadata m/n phải là số phần tử thật, không phải capacity; comparator/equality quyết định stability—muốn ưu tiên phần tử mảng nào khi bằng phải nói rõ. **Follow-up Senior:** nếu storage không hỗ trợ random write hoặc dữ liệu vượt RAM, dùng forward/k-way external merge với buffer và I/O tuần tự thay vì in-place.

### ALG-069 — [Middle] ⭐ Tìm độ dài longest substring không lặp ký tự bằng sliding window như thế nào?
**Tình huống:** Chuỗi có duplicate cách xa nhau và Unicode; hãy giải thích vì sao biên trái không được lùi khi gặp lại một ký tự cũ.

**Trả lời:** Lưu `lastSeen[ch]`; tại vị trí `right`, đặt `left=max(left,lastSeen[ch]+1)`, cập nhật last seen rồi `best=max(best,right-left+1)`. `max` là bắt buộc vì lần xuất hiện cũ có thể đã nằm ngoài window; cho `left` lùi sẽ đưa duplicate cũ trở lại. Time O(n), space O(k). **Pitfall:** index theo UTF-16 code unit có thể không đúng yêu cầu code point/grapheme; nếu cần trả substring phải ánh xạ index đúng đơn vị. **Follow-up Senior:** với stream giữ map last position và offset toàn cục; memory theo alphabet, còn normalization/case-fold có thể cần preprocessing làm thay đổi index gốc.

### ALG-070 — [Middle] ⭐ Phát hiện cycle và tìm node bắt đầu cycle trong linked list bằng Floyd tortoise–hare ra sao?
**Tình huống:** Không được sửa node hoặc dùng O(n) bộ nhớ; hãy giải thích hai phase và trường hợp list không có cycle.

**Trả lời:** Phase 1 cho slow đi 1, fast đi 2; nếu fast/null thì không cycle, nếu gặp nhau thì có. Gọi μ là khoảng từ head tới entry và λ là độ dài cycle; tại điểm gặp, quãng đường chênh là bội λ. Phase 2 đặt một pointer về head, cho cả hai đi 1; chúng gặp tại entry sau μ bước. Time O(n), space O(1). **Pitfall:** phải kiểm `fast != null && fast.next != null`; so node identity, không so value. **Follow-up Senior:** có thể tìm λ bằng đi một vòng từ meeting point, rồi xác định tail trước cycle; mutation concurrent khiến proof/invariant không còn hợp lệ.

### ALG-071 — [Middle] ⭐ Tìm phần tử nhỏ thứ k trong BST và tối ưu khi có nhiều truy vấn/update như thế nào?
**Tình huống:** Một lần query có thể dùng traversal, nhưng production cần hàng nghìn query xen kẽ insert/delete; hãy nêu metadata/invariant cần bổ sung.

**Trả lời:** Một query dùng inorder iterative và dừng ở node thứ k, time O(h+k), stack O(h); hoặc full traversal O(n). Nhiều query cần order-statistic tree: mỗi node giữ `subtreeSize` (và duplicate count), so k với size nhánh trái để đi trái/trả node/đi phải, query O(h). Insert/delete/rotation phải cập nhật size trên mọi node bị ảnh hưởng, update O(h); chỉ thành O(log n) nếu cây cân bằng. **Pitfall:** k ngoài `[1,n]`, duplicate semantics và metadata stale sau rotation/delete. **Follow-up Senior:** concurrent reads/updates cần snapshot/lock/version; B-tree với count theo child phù hợp storage page, còn workload read-heavy có thể dùng immutable rebuild.

### ALG-072 — [Middle] ⭐ Tìm Lowest Common Ancestor trong binary tree và BST khác nhau ra sao?
**Tình huống:** Hai node đầu vào có thể không cùng tồn tại trong cây; hãy làm rõ contract và tránh trả một node chỉ vì mới tìm thấy một target.

**Trả lời:** BST dùng ordering: nếu cả hai key nhỏ/lớn hơn root thì đi cùng phía, nếu tách phía hoặc root là target thì root là LCA, O(h). Binary tree tổng quát recursion lấy kết quả trái/phải; hai phía có target thì root là LCA. Tuy nhiên thuật toán cổ điển thường giả định cả hai tồn tại; contract này yêu cầu trả kèm `foundCount` hoặc xác minh presence, chỉ trả LCA khi tìm đủ hai identity. Time O(n), stack O(h). **Pitfall:** key duplicate, so value thay identity, và trường hợp `p==q` cần định nghĩa count. **Follow-up Senior:** nhiều query trên tree tĩnh có Euler tour + RMQ hoặc binary lifting; tree động cần cấu trúc/link-cut phức tạp hơn.

### ALG-073 — [Middle] ⭐ Clone một graph có cycle, self-loop và label không duy nhất bằng BFS/DFS như thế nào?
**Tình huống:** Cần deep copy từ một node gốc, giữ đúng topology và không dùng label làm identity.

**Trả lời:** Map `original node reference -> clone`; tạo clone ngay khi phát hiện/enqueue, rồi với mỗi cạnh lấy/tạo clone neighbor và nối vào adjacency clone. Việc đăng ký trước khi đệ quy ngăn loop vô hạn với cycle/self-loop. BFS hoặc DFS đều O(V+E) time, O(V) map/frontier cho component reachable từ root. **Pitfall:** map theo label làm gộp node khác nhau; tạo clone mỗi lần thấy cạnh làm duplicate topology; cần xác định giữ parallel-edge/order hay không. **Follow-up Senior:** graph quá sâu nên dùng BFS/iterative DFS; clone concurrent/mutable graph cần snapshot/version hoặc lock, còn serialization giữa process cần stable ID thay object identity.

### ALG-074 — [Middle] ⭐ Sắp xếp mảng chỉ gồm 0, 1, 2 trong một pass bằng Dutch National Flag như thế nào?
**Tình huống:** Yêu cầu in-place O(1) extra space; hãy nêu invariant của ba vùng và xử lý phần tử vừa swap từ cuối về.

**Trả lời:** Duy trì `[0,low)` toàn 0, `[low,mid)` toàn 1, `[mid,high]` chưa biết, `(high,n)` toàn 2. Nếu `a[mid]=0`, swap low/mid rồi tăng cả hai; bằng 1 chỉ tăng mid; bằng 2 swap mid/high, giảm high nhưng *không* tăng mid vì phần tử mới từ cuối chưa được phân loại. Time O(n), space O(1). **Pitfall:** input ngoài 0/1/2 phải reject hoặc định nghĩa; tăng mid sau swap với high bỏ sót phần tử. **Follow-up Senior:** đây không stable; nếu cần stable partition phải trả thêm memory/time, và tổng quát k màu có counting sort O(n+k) hoặc multiway partition.

### ALG-075 — [Middle] ⭐ Tìm một target trong ma trận sorted theo hai contract phổ biến như thế nào?
**Tình huống:** So sánh trường hợp mỗi row nối tiếp row trước thành một dãy tăng toàn cục với trường hợp chỉ tăng theo từng row và từng column.

**Trả lời:** Nếu `row[i][last] < row[i+1][0]`, coi ma trận R×C như array length RC và binary search index `mid/C, mid%C`, O(log(RC)). Nếu chỉ mỗi row và column tăng, bắt đầu góc trên-phải: target nhỏ hơn thì đi trái, lớn hơn thì đi xuống, O(R+C). Hai contract khác nhau nên không dùng flattened binary search cho trường hợp thứ hai. **Pitfall:** ma trận rỗng/jagged, overflow `R*C` và duplicate/boundary. **Follow-up Senior:** storage row-major khiến locality khác; có thể binary search từng row O(R log C), chọn theo shape/cache và batch query.

### ALG-076 — [Senior] ⭐ Longest Common Subsequence dùng DP và khôi phục một nghiệm như thế nào?
**Tình huống:** Hai chuỗi dài có nhiều LCS hợp lệ; hãy nêu recurrence, memory trade-off và policy tie-break nếu output phải deterministic.

**Trả lời:** `dp[i][j]` là LCS của prefix; nếu ký tự cuối bằng nhau, `dp[i][j]=dp[i-1][j-1]+1`, ngược lại lấy max trên bỏ một ký tự từ một trong hai chuỗi. Time O(mn), table O(mn); backtrack diagonal khi match, còn khi hai hướng bằng nhau dùng policy cố định để deterministic. Chỉ cần length thì giữ hai row O(min(m,n)); muốn sequence với ít RAM có Hirschberg O(mn) time và O(min(m,n)) auxiliary space. **Pitfall:** LCS là subsequence không phải substring; Unicode unit và tie-break lexicographically nhỏ nhất khó hơn chọn hướng cố định. **Follow-up Senior:** input gần giống có thuật toán theo số match/edit distance; diff production cần cost model, line normalization và giới hạn quadratic.

### ALG-077 — [Senior] ⭐ Coin Change tìm số đồng xu ít nhất khác greedy ở điểm nào?
**Tình huống:** Hệ mệnh giá tùy ý có thể làm chiến lược lấy đồng lớn nhất trước sai; hãy đưa phản ví dụ, thiết kế DP và xử lý amount không thể tạo.

**Trả lời:** Với coins `[1,3,4]`, amount 6, greedy cho `4+1+1` (3 đồng) nhưng optimum `3+3` (2). Đặt `dp[0]=0`, các amount khác là INF; với mỗi `a`, thử mọi coin dương `c<=a`: `dp[a]=min(dp[a],dp[a-c]+1)`. Time O(amount×coins), space O(amount), trả impossible nếu còn INF; lưu chosen coin để reconstruct. **Pitfall:** đây là pseudo-polynomial theo giá trị amount, coin 0/âm và overflow `INF+1`; vòng lặp khác nhau nếu đếm số cách. **Follow-up Senior:** hệ canonical mới cho greedy đúng và cần chứng minh; amount rất lớn có thể cần number theory/graph shortest path theo residue hoặc approximation.

### ALG-078 — [Senior] ⭐ Serialize/deserialize binary tree thành format bền vững và kiểm tra input lỗi như thế nào?
**Tình huống:** Dữ liệu phải round-trip được với duplicate/null, có thể rất sâu và format sẽ được lưu lâu hoặc truyền giữa nhiều version service.

**Trả lời:** Preorder kèm explicit null marker (hoặc level-order có quy tắc trim) giữ topology dù value trùng; value nên length-prefix/escape hoặc dùng schema binary chuẩn. Serialize/deserialize O(n) time, O(h) stack nếu recursive; dùng iterative stack/queue cho cây cực sâu. Decoder phải giới hạn node/depth/bytes, validate token/type, không đọc thiếu/dư và chỉ publish tree sau parse thành công. **Pitfall:** chỉ lưu preorder value không khôi phục được cây tổng quát; delimiter có thể xuất hiện trong value, input ác ý gây stack/memory exhaustion. **Follow-up Senior:** thêm magic/version/schema/checksum, backward compatibility và fuzz/property round-trip test; không dùng native object deserialization cho dữ liệu không tin cậy.

### ALG-079 — [Senior] ⭐ Tìm Minimum Window Substring chứa đủ multiplicity của pattern như thế nào?
**Tình huống:** Pattern có ký tự lặp, text Unicode và có nhiều cửa sổ ngắn bằng nhau; hãy nêu invariant `need/have`, tie-break và complexity.

**Trả lời:** Đếm `need[ch]` của pattern và số loại `required`; mở right, tăng window count và chỉ tăng `formed` khi count vừa bằng need. Khi `formed==required`, co left để cập nhật cửa sổ ngắn nhất; nếu bỏ ký tự làm count thấp hơn need thì giảm formed. Mỗi đầu đi tối đa n bước nên O(n+m), space O(k); multiplicity được giữ đúng, không chỉ distinct set. Tie-break nên giữ cửa sổ xuất hiện sớm nhất bằng chỉ cập nhật khi ngắn hơn. **Pitfall:** tăng formed cho mọi duplicate thừa, pattern rỗng, index UTF-16 thay code point. **Follow-up Senior:** stream cần giữ các vị trí relevant và output policy vì không giữ toàn text; normalization/case-fold và grapheme làm mapping index phức tạp.

### ALG-080 — [Senior] ⭐ Tìm median của hai sorted array trong O(log(min(m,n))) như thế nào?
**Tình huống:** Hai mảng có kích thước rất lệch, chứa duplicate, một mảng có thể rỗng và phép tính median phải tránh integer overflow.

**Trả lời:** Binary search partition `i` trên mảng ngắn A, đặt `j=(m+n+1)/2-i`. Dùng sentinel ±∞ ở biên; partition đúng khi `Aleft<=Bright` và `Bleft<=Aright`. Nếu Aleft>Bright giảm i, nếu Bleft>Aright tăng i. Tổng lẻ lấy `max(left)`, tổng chẵn trung bình `max(left)` và `min(right)`. Time O(log min(m,n)), space O(1). **Pitfall:** cả hai rỗng là invalid; mid/average integer overflow nên dùng kiểu rộng hoặc công thức an toàn; sentinel phải ngoài miền hoặc xử lý branch. **Follow-up Senior:** chứng minh partition chứa đúng nửa phần tử và tính đơn điệu; dữ liệu trên disk/distributed không random-access rẻ thì thuật toán tối ưu comparison có thể không tối ưu I/O/network.
