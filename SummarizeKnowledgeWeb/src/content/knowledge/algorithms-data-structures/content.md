## Bản đồ 36 chủ đề và cách học

Thuật toán không nên được học như một danh sách lời giải. Mục tiêu là đi từ **ràng buộc → pattern → invariant → implementation → kiểm chứng**. Bộ nguồn chia kiến thức thành 36 bài, đi từ độ phức tạp đến thiết kế cấu trúc dữ liệu:

| Cụm | Bài học | Trọng tâm |
|---|---|---|
| Nền tảng tuyến tính | 01–05 | Big-O; array/string và two pointers; sliding window; prefix sum/difference array; hash table/frequency |
| Cấu trúc và tìm kiếm | 06–13 | Stack/monotonic stack; queue/deque; linked list; binary search; sorting; intervals/sweep line; recursion; backtracking |
| Tree, heap và graph | 14–20 | Binary tree; BST; trie; heap/top-K; graph DFS/BFS; topological sort; union-find |
| Đường đi và tối ưu | 21–24 | BFS/0-1 BFS/Dijkstra; Bellman-Ford/Floyd-Warshall; MST; greedy |
| Dynamic programming | 25–29, 33 | DP 1D; grid 2D; knapsack/subset sum; LIS; Kadane; DP trên chuỗi |
| Nâng cao | 30–32, 34–36 | Bit; KMP/Rabin-Karp; Fenwick/segment tree; SCC/bridge/bipartite; number theory; thiết kế data structure |

Mỗi bài nên được học theo vòng lặp: tự nêu dấu hiệu nhận diện, dry-run một input nhỏ, che sample để code lại, nói correctness thành tiếng, rồi làm quiz tương ứng. Tracker dùng spaced repetition ở các mốc `+1`, `+3`, `+7`, `+14` ngày thay vì chỉ đánh dấu “đã đọc”.

## Độ phức tạp và cấu trúc dữ liệu nền tảng

Big-O mô tả tốc độ tăng của chi phí theo kích thước input; cần phân biệt worst-case, average/expected và amortized. Khi phân tích, đếm số lần mỗi phần tử/cạnh/state thực sự được xử lý, kể cả recursion stack, output và bộ nhớ phụ. `Dictionary` có lookup expected `O(1)`, không phải bảo đảm worst-case; dynamic array append là amortized `O(1)` vì các lần resize hiếm được phân bổ trên nhiều lần append.

| Nhu cầu | Cấu trúc phù hợp | Chi phí/điểm cần giữ |
|---|---|---|
| Lookup, đếm, deduplicate | Hash table/set | Thiết kế key và equality đúng; dự phòng collision |
| LIFO, parser, next-greater | Stack/monotonic stack | Mỗi phần tử thường push/pop tối đa một lần |
| FIFO, level-order | Queue | Không dùng thao tác xóa đầu của array động |
| Max/min trong cửa sổ | Monotonic deque | Loại index hết hạn ở đầu, phần tử bị thống trị ở cuối |
| Top-K, scheduler, median stream | Heap/priority queue | Chọn min-heap cỡ `k` hoặc hai heap; heap không ổn định mặc định |
| Prefix lookup | Trie/radix tree | Chi phí theo độ dài key; cân nhắc memory/cardinality alphabet |
| Connectivity động | Union-Find | Path compression + union-by-rank/size gần `O(1)` amortized |

Với C#, dùng `long` cho tổng, distance và phép nhân có nguy cơ vượt `int`; comparer nên gọi `CompareTo` thay vì trừ hai số. `char` là UTF-16 code unit, vì vậy phải nói rõ giả định ASCII/lowercase hoặc xử lý Unicode đúng contract.

## Array, chuỗi và các pattern quét tuyến tính

Hai con trỏ phù hợp khi có thứ tự, cần thu hẹp hai đầu, merge hai stream hoặc duy trì một quan hệ giữa hai vị trí. Sliding window dùng khi một khoảng liên tiếp có thể mở rộng và co lại theo một điều kiện đơn điệu; nếu số âm hoặc điều kiện không đơn điệu phá tính chất đó, prefix sum kết hợp hash map thường phù hợp hơn.

- **Prefix sum** biến range sum tĩnh thành `O(1)` sau `O(n)` tiền xử lý.
- **Difference array** gom nhiều range update offline rồi khôi phục bằng prefix sum.
- **Kadane** giữ “tổng tốt nhất kết thúc tại vị trí hiện tại”; phải xử lý đúng mảng toàn số âm.
- **Intervals** cần chốt biên đóng/mở và tie-break. Merge interval khác interval scheduling: một bài hợp nhất vùng phủ, bài kia tối đa số khoảng không giao nhau.
- **Sweep line** chuyển sự kiện start/end thành thứ tự xử lý; tie-break sai có thể làm sai số lượng tài nguyên đồng thời.
- **Sorting** được chọn theo stability, memory, dữ liệu gần sorted, miền key và việc dữ liệu có vượt RAM hay không. Comparison sort có lower bound `Ω(n log n)`; counting/radix chỉ thắng khi miền dữ liệu phù hợp.

Binary search phải bắt đầu bằng interval invariant, ví dụ `[left, right)` cho lower bound. “Binary search on answer” chỉ hợp lệ khi predicate chuyển từ false sang true hoặc ngược lại đúng một lần; nếu không chứng minh được tính đơn điệu, việc chia đôi không có cơ sở.

## Linked list, recursion và backtracking

Linked list hữu ích khi cần thao tác node `O(1)` sau khi đã có reference, nhưng locality kém và việc tìm vị trí vẫn `O(n)`. Dummy node làm đơn giản hóa xóa/chèn ở đầu. Fast/slow pointers tìm middle, phát hiện cycle và cycle entry; luôn kiểm tra null theo đúng thứ tự trước khi dereference.

Recursion cần ba thứ rõ ràng: base case, bài toán con nhỏ hơn và cách ghép kết quả. Divide-and-conquer thường cho recurrence như `T(n)=2T(n/2)+O(n)` của merge sort. Với cây/graph sâu, recursive DFS có thể stack overflow; iterative stack là phương án production an toàn hơn.

Backtracking là duyệt cây quyết định có **state restoration** và **pruning**, không chỉ brute force được viết bằng recursion:

```text
choose candidate
  -> mutate state
  -> recurse
  -> undo exactly what was changed
```

Để tránh đáp án trùng, sort input và bỏ qua duplicate ở cùng decision level; không bỏ qua mù quáng giữa các level. Complexity thường là exponential theo số lựa chọn, cộng chi phí copy output, nên phải mô tả bound thực tế thay vì ghi `O(n)` vì mỗi node làm ít việc.

## Tree, BST, trie và heap

DFS preorder/inorder/postorder khác nhau ở thời điểm xử lý node; BFS xử lý theo level và cần queue. Với binary tree, bài toán path/height thường được giải bằng giá trị trả lên từ child kết hợp với một đáp án global. Tree có `n` node luôn có `n-1` cạnh, nên traversal là `O(n)`.

BST dựa trên invariant toàn bộ subtree, không chỉ so sánh node với cha. Validate BST bằng lower/upper bounds; inorder cho thứ tự tăng và hỗ trợ kth-smallest. Cây mất cân bằng có thể suy biến thành linked list, nên production ordered map thường dùng balanced tree/B-tree thay vì BST thuần.

Trie phù hợp autocomplete, dictionary và prefix routing; hash map phù hợp exact lookup. Heap cho phép lấy min/max `O(log n)` và peek `O(1)`. Pattern Top-K giữ một heap cỡ `k`, còn median stream duy trì max-heap nửa nhỏ và min-heap nửa lớn với chênh lệch size không quá một.

LRU cache kết hợp hash map và doubly linked list: map tìm node `O(1)`, list cập nhật recency `O(1)`. Invariant quan trọng là mỗi key xuất hiện đúng một lần, head/tail luôn nhất quán và eviction đồng thời xóa khỏi cả hai cấu trúc.

## Graph và bài toán đường đi

Trước tiên chọn representation: adjacency list cho graph thưa, matrix cho graph dày hoặc lookup cạnh nhanh, edge list cho thuật toán xử lý cạnh như Kruskal/Bellman-Ford. Với graph disconnected, traversal phải bắt đầu lại từ mọi đỉnh chưa thăm.

| Điều kiện cạnh/bài toán | Thuật toán |
|---|---|
| Không trọng số | BFS |
| Trọng số chỉ `0/1` | 0-1 BFS với deque |
| Trọng số không âm | Dijkstra; bỏ qua heap entry stale |
| Có cạnh âm | Bellman-Ford; phát hiện negative cycle bằng vòng relax thêm |
| All-pairs, graph vừa/đặc | Floyd-Warshall |
| Dependency DAG | Kahn hoặc DFS colors; số node xử lý thiếu nghĩa là có cycle |
| Minimum spanning tree | Kruskal + DSU hoặc Prim; MST không phải shortest-path tree |

Multi-source BFS đưa mọi nguồn vào queue ở distance `0`. Dijkstra đúng vì đỉnh có distance nhỏ nhất được chốt khi mọi cạnh không âm; một cạnh âm phá lập luận này. Kruskal dựa trên cut property, sort cạnh rồi chỉ chọn cạnh nối hai component khác nhau.

Graph nâng cao gồm kiểm tra bipartite bằng 2-color, SCC bằng Kosaraju/Tarjan, bridge và articulation point bằng discovery time/low-link. Low-link phải phân biệt cạnh về parent với back edge; graph có parallel edge cần contract biểu diễn rõ để không báo bridge sai.

## Greedy và dynamic programming

Greedy chỉ đáng tin khi có exchange argument, cut property hoặc invariant chứng minh lựa chọn cục bộ có thể nằm trong một nghiệm tối ưu. Nếu tìm được counterexample, chuyển sang DP, graph hoặc search. Interval scheduling là mẫu kinh điển: chọn khoảng kết thúc sớm nhất để chừa nhiều không gian nhất cho phần còn lại.

Thiết kế DP theo thứ tự:

1. Định nghĩa state bằng một câu đầy đủ.
2. Viết transition từ các state nhỏ hơn.
3. Chốt base case và thứ tự tính để dependency đã sẵn sàng.
4. Xác định đáp án nằm ở state nào và có cần reconstruct không.
5. Chỉ nén memory sau khi đã chứng minh transition không cần dữ liệu bị ghi đè.

Các họ quan trọng gồm House Robber/DP 1D, minimum path/count trên grid, 0/1 và unbounded knapsack, subset sum, LIS, LCS/edit distance/word break. Với 0/1 knapsack, capacity phải lặp giảm để một item không bị dùng nhiều lần; unbounded lặp tăng. LIS `O(n log n)` duy trì `tails`, nhưng `tails` không tự nó là dãy kết quả nếu không lưu predecessor. Grid có trọng số không âm và chuyển động tùy ý có thể là Dijkstra chứ không phải grid DP.

## Chuỗi, range query, bit và toán

KMP dùng prefix-function để biết phần prefix nào vẫn khớp sau mismatch, đạt `O(n+m)` mà không lùi con trỏ text. Rabin-Karp dùng rolling hash, nhưng hash match phải được xác minh để tránh collision; input đối kháng có thể cần double hash hoặc thuật toán deterministic.

Fenwick tree gọn và hiệu quả cho prefix/range sum với point update; segment tree linh hoạt hơn cho nhiều phép kết hợp, range query/update và lazy propagation. Cả hai thường `O(log n)`, đổi lại cần kỷ luật index và identity element. Prefix sum vẫn là lựa chọn đơn giản hơn khi dữ liệu bất biến.

Bit manipulation gồm set/clear/test bit, XOR cancellation, bitmask enumeration và kiểm tra power-of-two. Tránh shift ngoài độ rộng kiểu và lưu ý signed shift trong C#. Number theory nền tảng gồm Euclid GCD, sieve, fast power và modular arithmetic; phép nhân trước modulo vẫn có thể overflow.

Các cấu trúc/phương pháp streaming thường gặp trong câu hỏi senior gồm Bloom filter (có false positive, không false negative nếu dùng đúng), reservoir sampling, heavy hitters/approximate distinct, consistent hoặc rendezvous hashing, rate limiter và external/distributed Top-K. Luôn nêu rõ accuracy, memory, adversarial input và consistency trade-off.

## Quy trình coding interview và kiểm thử

Một câu trả lời tốt đi theo chuỗi: làm rõ input/output, duplicate, empty, overflow và quyền mutation; nêu brute-force làm baseline; tìm bottleneck; phát biểu invariant/state; code; dry-run; chốt complexity và follow-up. Đừng tối ưu vi mô trước khi correctness rõ ràng.

Checklist trước khi nộp:

- [ ] Empty, một phần tử, duplicate, all-equal, already sorted và reverse sorted.
- [ ] Integer overflow, index boundary, recursion depth và Unicode assumption.
- [ ] Graph disconnected, self-loop, parallel edge, cycle và stale heap entry.
- [ ] DP base case, iteration direction và việc output có được tính vào space hay không.
- [ ] Comparator deterministic; không dùng `a - b`.
- [ ] Nói được vì sao thuật toán đúng, không chỉ “chạy thử thấy đúng”.

Mốc sẵn sàng: tự code được BFS/DFS, binary-search bounds, heap Top-K, topo, DSU và nhiều họ DP; giải bài Medium lạ trong khoảng 25–30 phút; đạt quiz lặp lại thay vì chỉ một lần; hoàn thành mock interview theo rubric.

## Nguồn đã gom và đường ôn tập

`sourceFolders` giữ course `Algorithms` cùng đúng file câu hỏi/đáp án Algorithms trong `Interview`, nên thư mục con không bị đếm lại như nguồn độc lập. Nguồn canonical gồm roadmap 36 bài, toàn bộ lesson, ma trận phủ/quiz/answer/tracker, cùng ngân hàng 80 câu phỏng vấn và đáp án.

Để tránh học trùng, lesson là lớp **giải thích và sample**, Interview là lớp **câu hỏi/trade-off**, còn Quiz là lớp **closed-book assessment**. Khi một chủ đề xuất hiện ở nhiều nguồn—ví dụ binary search, LRU, graph hoặc DP—hãy giữ một ghi chú khái niệm duy nhất rồi liên kết tới câu hỏi, đáp án và bài kiểm tra tương ứng.
