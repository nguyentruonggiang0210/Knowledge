# Lộ trình thuật toán phỏng vấn Big Tech với C#

> Mục tiêu của bộ tài liệu là giúp bạn **nhận diện pattern, giải thích vì sao đúng, tự code C# và kiểm thử dưới áp lực phỏng vấn**. Không có tài liệu nào có thể bảo đảm tuyệt đối đậu hoặc “full điểm”; tiêu chí sẵn sàng ở cuối file giúp bạn đo năng lực bằng kết quả thực tế.

## Cách dùng repository

- `Lessions/`: 36 bài học theo thứ tự khuyến nghị. Tên folder được giữ theo yêu cầu ban đầu.
- `Quiz/`: bài kiểm tra closed-book, bài code, mock interview, đáp án riêng và progress tracker.
- [Ma trận Lesson → Quiz](Quiz/lesson-coverage-map.md) chỉ đúng câu cần làm sau từng bài và bảo đảm không bỏ sót chủ đề nâng cao.
- Với mỗi bài: đọc mục tiêu → tự dry-run → che sample và code lại → nói invariant/correctness thành tiếng → làm quiz liên quan.
- Sample dùng cú pháp C# hiện đại và ưu tiên API có trong .NET 8+; khi phỏng vấn hãy hỏi phiên bản runtime nếu môi trường bị giới hạn.

## Danh sách 36 chủ đề

Mức ưu tiên:

- **Core:** phải làm chủ trước vòng coding.
- **Important:** thường gặp hoặc là follow-up quan trọng.
- **Advanced:** ưu tiên cho vòng Hard/senior sau khi đã vững Core.

| # | Mức | Bài học | Năng lực chính | Dùng trong thực tế |
|---:|---|---|---|---|
| 01 | Core | [Big-O và Complexity](Lessions/01-big-o-and-complexity.md) | Ước lượng time/space, amortized, constraint | Chọn thiết kế đáp ứng latency/tải |
| 02 | Core | [Array, String và Two Pointers](Lessions/02-array-string-two-pointers.md) | In-place, hai đầu/cùng chiều, invariant | Buffer, xử lý text, merge stream |
| 03 | Core | [Sliding Window](Lessions/03-sliding-window.md) | Window cố định/biến đổi, frequency window | Telemetry window, rate/event analysis |
| 04 | Core | [Prefix Sum và Difference Array](Lessions/04-prefix-sum-difference-array.md) | Range query/update, subarray sum | Analytics theo khoảng, batch updates |
| 05 | Core | [Hash Table và Counting](Lessions/05-hash-table-counting.md) | Lookup, frequency, grouping, deduplicate | Cache/index, phát hiện trùng lặp |
| 06 | Core | [Stack và Monotonic Stack](Lessions/06-stack-monotonic-stack.md) | Parsing, next greater, histogram | Parser, undo, skyline/stream span |
| 07 | Core | [Queue, Deque và Monotonic Queue](Lessions/07-queue-deque-monotonic-queue.md) | FIFO, rolling max/min, simulation | Scheduler, message buffer, stream extrema |
| 08 | Core | [Linked List và Fast/Slow Pointers](Lessions/08-linked-list-fast-slow-pointers.md) | Reverse, cycle, middle, dummy node | LRU chain, free-list, intrusive list |
| 09 | Core | [Binary Search](Lessions/09-binary-search.md) | Bounds, rotated array, search on answer | Index lookup, capacity/threshold selection |
| 10 | Core | [Sorting](Lessions/10-sorting-comparison.md) | Stability, comparator, merge/quick/counting | Ranking, log pipeline, preprocessing |
| 11 | Core | [Intervals và Sweep Line](Lessions/11-intervals-sweep-line.md) | Merge, overlap, concurrent events | Calendar, booking, resource capacity |
| 12 | Core | [Recursion và Divide & Conquer](Lessions/12-recursion-divide-and-conquer.md) | Base case, recurrence, merge pattern | Parallel chunks, tree/spatial processing |
| 13 | Core | [Backtracking](Lessions/13-backtracking.md) | Decision tree, pruning, duplicate handling | Constraint search, configuration, puzzle |
| 14 | Core | [Binary Tree DFS/BFS](Lessions/14-binary-tree-dfs-bfs.md) | Traversals, path/height, level-order | DOM, AST, filesystem hierarchy |
| 15 | Important | [Binary Search Tree](Lessions/15-binary-search-tree.md) | Ordered invariant, validate, kth, delete | Ordered in-memory index/set |
| 16 | Important | [Trie](Lessions/16-trie-prefix-tree.md) | Prefix lookup, wildcard, word search | Autocomplete, spell-check, prefix routing |
| 17 | Core | [Heap, Priority Queue và Top-K](Lessions/17-heap-priority-queue-top-k.md) | Top-k, k-way merge, two heaps | Job scheduler, median stream, external merge |
| 18 | Core | [Graph DFS/BFS và Grid](Lessions/18-graph-dfs-bfs.md) | Reachability, components, multi-source BFS | Network, maps, flood fill, crawl |
| 19 | Core | [Topological Sort](Lessions/19-topological-sort.md) | Dependency order và cycle detection | Build/package/pipeline scheduling |
| 20 | Core | [Union-Find / DSU](Lessions/20-union-find-disjoint-set.md) | Dynamic connectivity, component merge | Account merge, clustering, network links |
| 21 | Core | [Dijkstra và Shortest Path](Lessions/21-shortest-path-dijkstra.md) | Relaxation, non-negative weighted paths | Routing theo distance/latency/cost |
| 22 | Advanced | [Bellman-Ford và Floyd-Warshall](Lessions/22-bellman-ford-floyd-warshall.md) | Cạnh âm, negative cycle, all-pairs | Currency graph, dense routing tables |
| 23 | Important | [Minimum Spanning Tree](Lessions/23-minimum-spanning-tree.md) | Kruskal/Prim, cut property | Thiết kế mạng/cáp chi phí thấp |
| 24 | Core | [Greedy](Lessions/24-greedy.md) | Local choice, exchange argument, counterexample | Scheduling, allocation, compression |
| 25 | Core | [Dynamic Programming 1D](Lessions/25-dynamic-programming-1d.md) | State/transition/base, memo/tabulation | Tối ưu quyết định tuần tự |
| 26 | Core | [Dynamic Programming Grid 2D](Lessions/26-dynamic-programming-grid-2d.md) | Path/count/cost, rolling row | Route planning, bảng chi phí |
| 27 | Core | [Knapsack và Subset Sum](Lessions/27-knapsack-subset-sum.md) | 0/1 vs unbounded, iteration order | Budget/packing, phân bổ giới hạn |
| 28 | Important | [Longest Increasing Subsequence](Lessions/28-longest-increasing-subsequence.md) | DP `O(n²)`, tails `O(n log n)` | Chuỗi xu hướng, chain/scheduling |
| 29 | Core | [Kadane và Maximum Subarray](Lessions/29-kadane-maximum-subarray.md) | Best-ending-here, all-negative, bounds | Giai đoạn contribution tốt nhất |
| 30 | Core | [Bit Manipulation](Lessions/30-bit-manipulation.md) | XOR, mask, subset enumeration | Flags, permissions, compact DP state |
| 31 | Advanced | [String Matching: KMP và Rabin–Karp](Lessions/31-string-matching-kmp-rabin-karp.md) | Prefix function, rolling hash/collision | Text/log scan, signature matching |
| 32 | Advanced | [Fenwick và Segment Tree](Lessions/32-fenwick-segment-tree.md) | Dynamic range update/query | Realtime range analytics/leaderboard |
| 33 | Core | [Dynamic Programming trên String](Lessions/33-dynamic-programming-strings.md) | LCS, edit distance, palindrome/word break | Diff, fuzzy match, segmentation |
| 34 | Advanced | [Graph nâng cao: SCC, Bridge, Bipartite](Lessions/34-advanced-graph-scc-bridges-bipartite.md) | Low-link, SCC, 2-color | Dependency cycles, network failure points |
| 35 | Important | [Math và Number Theory](Lessions/35-math-number-theory.md) | GCD, sieve, modular power, overflow | Chu kỳ, precompute prime, counting/hash |
| 36 | Core | [Thiết kế Data Structure](Lessions/36-data-structure-design.md) | LRU, MinStack, RandomizedSet, stream | Cache, sampling, online statistics |

## Lộ trình học khuyến nghị: 12 tuần

Điều chỉnh theo nền tảng của bạn; **chỉ tăng tốc khi vẫn code lại được mà không nhìn sample**.

| Tuần | Nội dung | Cổng kiểm tra |
|---:|---|---|
| 1 | 01–05 | Phân tích constraint và chọn Big-O; hoàn thành Quiz foundations phần A |
| 2 | 06–10 | Code stack/queue/list/binary search/sort từ trí nhớ |
| 3 | 11–13 | Merge interval, recurrence, backtracking decision tree |
| 4 | 14–17 | 4 tree traversals, validate BST, trie, top-k heap |
| 5 | 18–20 | BFS/DFS disconnected, topo cycle, DSU |
| 6 | 21–23 | Chọn đúng shortest path; MST; làm Quiz trees/graphs |
| 7 | 24–25 | Chứng minh/counterexample greedy; DP state 1D |
| 8 | 26–28 | Grid, knapsack update order, LIS `O(n log n)` |
| 9 | 29–30 và ôn DP | Kadane all-negative, bitmask; Quiz DP/advanced lần 1 |
| 10 | 31–35 | Advanced theo mục tiêu công ty/vị trí; làm Quiz 05 + CG01–CG03 |
| 11 | 36 + mixed practice | Design contract/invariant; 5 bài Medium lạ có bấm giờ |
| 12 | Mock interviews | Hai mock độc lập, review lỗi, thi lại quiz dưới 90% |

## Chu trình cho mỗi bài học

1. **Nhận diện (5 phút):** đọc constraint và nói 2–3 pattern ứng viên.
2. **Hiểu (20–30 phút):** học invariant/recurrence; tự dry-run một case.
3. **Code closed-book (25–40 phút):** không copy sample; compile và test edge cases.
4. **Giải thích (5 phút):** nói correctness và time/space như đang phỏng vấn.
5. **Kiểm tra (15–30 phút):** làm phần tương ứng trong `Quiz/`, ghi lỗi vào tracker.
6. **Spaced repetition:** làm lại vào ngày `+1`, `+3`, `+7`, `+14` nếu còn sai.

## Khung trả lời một bài coding interview

1. Xác nhận input/output, duplicate, empty, range/overflow và mutation có được phép không.
2. Đưa ví dụ nhỏ và edge case.
3. Nói brute force cùng complexity để đặt baseline.
4. Từ bottleneck suy ra data structure/pattern tốt hơn.
5. Phát biểu invariant hoặc DP state trước khi code.
6. Code rõ tên, không tối ưu vi mô quá sớm.
7. Dry-run một case thường và một edge case.
8. Chốt time/space, kể cả output, recursion stack và average/worst case của hash.
9. Trả lời follow-up: stream, memory limit, concurrency, input lớn hoặc cần reconstruct.

## Quy ước C# cần nhớ

- `PriorityQueue<TElement, TPriority>` là min-heap; không mặc định stable khi priority bằng nhau.
- Dùng `long` cho tổng, distance hoặc phép nhân có nguy cơ vượt `int`; vẫn kiểm tra overflow khi nhân hai `long`.
- Không viết comparer kiểu `a - b`; dùng `CompareTo` để tránh overflow.
- Binary search dùng `left + (right - left) / 2` và chốt rõ interval invariant.
- `Dictionary`/`HashSet` là expected `O(1)`, không phải worst-case tuyệt đối.
- `char` là UTF-16 code unit; nêu giả định ASCII/lowercase hoặc xử lý Unicode đúng mức đề bài.
- Recursive DFS trên graph/cây lệch rất sâu có thể stack overflow; biết phương án iterative.

## Tiêu chí “interview-ready” đo được

Bạn nên tiếp tục ôn nếu chưa đạt bất kỳ cổng nào dưới đây:

- [ ] Đạt ít nhất **90%** mỗi quiz ở hai lần làm cách nhau tối thiểu 3 ngày.
- [ ] Đạt `3/3` cổng phủ `CG01–CG03` trong Quiz 05 (prefix sum, grid DP, GCD/fast power).
- [ ] Giải một bài Medium chưa gặp trong **25–30 phút**, compile đúng, không cần hint.
- [ ] Với bài Hard, ít nhất đưa được state/invariant và hướng tối ưu có cơ sở trong 10 phút đầu.
- [ ] Tự code được BFS/DFS, binary search bounds, heap top-k, topo, DSU và 3 mẫu DP mà không nhìn tài liệu.
- [ ] Nói được correctness ngắn gọn, không chỉ nói “chạy thử thấy đúng”.
- [ ] Liệt kê edge cases trước khi interviewer nhắc.
- [ ] Hoàn thành hai mock interview liên tiếp đạt ≥90 theo rubric trong `Quiz/`.
- [ ] Mọi lỗi đều được ghi vào [progress tracker](Quiz/progress-tracker.md) và đã có lần retest đạt.

Để kiểm tra nhanh toàn bộ code sample sau khi chỉnh tài liệu, chạy `powershell -ExecutionPolicy Bypass -File .\tools\validate-code-samples.ps1`; script biên dịch độc lập mọi block C# trên .NET 8 với nullable/warnings-as-errors và smoke-run mọi sample có `Main`.

Điểm số này không thay thế sự khác biệt giữa công ty, interviewer, system design, behavioral và kinh nghiệm dự án; nó là thước đo có thể kiểm soát để tối đa hóa xác suất làm tốt phần thuật toán.
