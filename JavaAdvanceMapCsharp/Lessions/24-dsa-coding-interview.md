# Bài 24 — DSA và coding interview bằng Java

## Bar senior

Trong 35–45 phút: clarify, nêu invariant, đưa brute force, tối ưu, viết Java compile được, tự test và chứng minh complexity. Senior không được miễn coding fundamentals. Amazon/Microsoft hiện công khai đánh giá algorithms, data structures, clean runnable code và testing: [Amazon topics](https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics), [Microsoft technical interview](https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html).

[Sample algorithms + tests](../SourceSamples/24-dsa-interview/src/main/java/course/interview/Algorithms.java) là executable lab đại diện cho hash, sliding window, heap, tree, trie, topo sort, union-find, Dijkstra, backtracking và DP; đây vẫn là template reasoning, không phải danh sách đáp án để thuộc.

## 1. Protocol một round

1. **Clarify:** input size/range/null/duplicates/order/memory/mutation/output; nói assumptions.
2. **Examples:** happy, empty/minimum, duplicate/tie, overflow, impossible, Unicode nếu liên quan.
3. **Brute force:** correctness trước; identify repeated work/bottleneck.
4. **Invariant/pattern:** giải thích tại sao data structure/algorithm giữ correctness.
5. **Code:** tên rõ, method nhỏ vừa đủ, không framework/stream phức tạp che logic.
6. **Dry run:** trace một case thường + edge; sửa bằng reasoning, không random edit.
7. **Complexity:** time/space worst/average khi relevant; tính cả sort/output/recursion.
8. **Follow-up:** scale, concurrency, streaming, API/production constraints.

Nếu kẹt, verbalize known facts và hỏi hint cụ thể. Im lặng 10 phút tệ hơn trade-off rõ.

## 2. Pattern curriculum

| Pattern | Dấu hiệu | Invariant/câu hỏi |
|---|---|---|
| hash map/set | membership/frequency/complement | key immutable? collision/space? |
| two pointers | sorted/pair/partition | pointer move loại được candidate nào? |
| sliding window | contiguous + constraint | khi nào window hợp lệ; shrink/expand? |
| prefix sum | range sum/count balance | prefix index/off-by-one/map earliest? |
| sort + scan/interval | overlap/merge/schedule | comparator/tie/endpoints? |
| binary search | monotonic predicate | lower/upper bound invariant? overflow mid? |
| stack/monotonic stack | nested/next greater/histogram | stack giữ monotonic property nào? |
| deque | window max/BFS | front/back semantics, stale index? |
| heap | top K/k-way/scheduler | size K, comparator, lazy stale entry? |
| linked list | cycle/reverse/merge | ownership, dummy node, fast/slow? |
| tree/BST/trie | hierarchy/prefix | recursion depth, BST duplicate policy? |
| graph BFS/DFS | reachability/shortest unweighted | visited lúc enqueue hay dequeue? |
| topo sort | dependency/DAG | indegree; cycle detection? |
| union-find | connectivity/merge | path compression + union rank complexity? |
| Dijkstra | non-negative weighted shortest | stale heap entries; negative edge? |
| backtracking | enumerate choices | choose/explore/unchoose, pruning, copy state? |
| greedy | local choice | exchange argument/counterexample? |
| dynamic programming | overlapping subproblem | state/transition/base/order/result? |
| bit | flags/subsets/XOR | signed shift/width/overflow? |

## 3. Complexity phải nói chính xác

- Hash operation average O(1), worst/adversarial khác; sorting thường O(n log n).
- Nested loops không luôn O(n²): two pointers mỗi pointer chỉ tiến tổng O(n).
- BFS/DFS adjacency list O(V+E); matrix O(V²).
- Heap push/pop O(log k), peek O(1); top-K O(n log k).
- DP complexity = số state × transition work; memo recursion còn stack.
- Output size là lower bound: chỉ đếm số subset đã là Ω(2ⁿ); nếu materialize toàn bộ phần tử của mọi subset thì tổng output size là Θ(n·2ⁿ).
- Java recursion có thể stack overflow; iterative traversal cho depth không kiểm soát.

## 4. Java-specific traps

- Overflow: `int mid = left + (right-left)/2`; promote `long` **trước** multiplication.
- Comparator tránh `a-b` overflow: `Integer.compare(a,b)`; comparator contract transitive/consistent.
- `PriorityQueue` là min-heap; max heap dùng comparator; không remove arbitrary O(log n) như thường đoán (search O(n)).
- `ArrayDeque` tốt cho stack/queue; tránh legacy `Stack`, và không nhận null.
- Mutable key phá `HashMap`; record/key immutable phù hợp.
- `String` indexing là UTF-16 code unit; hỏi interviewer input ASCII/code point/grapheme.
- `List.subList` là backed view; `Arrays.asList` fixed-size; `List.of` immutable/no null.
- Stream làm code interview khó debug khi state/window/early exit; loop rõ thường tốt hơn.
- `equals/hashCode` cho custom node/state; array key dùng wrapper/content equality.
- Copy list trong backtracking lúc emit; nếu lưu cùng mutable buffer, mọi result đổi.

## 5. Luyện theo progression, không đếm số bài

Mỗi pattern làm ba tầng:

- 1 bài untimed học invariant;
- 1 bài variation không xem lời giải;
- 1 bài unseen timed 35–45 phút, record rubric/error log.

Core set tối thiểu: Two Sum variant; longest substring; minimum window; merge intervals; rotated binary search; top K; LRU cache; tree diameter/LCA/serialize; trie; islands; course schedule; union-find; shortest path; combination sum; word search; coin change/knapsack/LIS; task scheduler. Đổi đề theo weakness, không thuộc solution.

Executable sample cố ý chỉ chọn một đại diện mỗi family. Các prompt còn lại là bài unseen: tạo test trước/đồng thời, không copy method có sẵn rồi đổi tên. `TopologicalResult` trong sample cũng minh họa contract phân biệt graph rỗng hợp lệ với cycle thay vì overload một empty list cho hai nghĩa.

### Low-level design crossover

Các câu LRU/cache/scheduler cần API, invariants, concurrent follow-up và testability. Đừng over-engineer pattern trước correctness; sau code core mới nói lock striping/TTL/persistence.

## C# → Java coding-round refresh

- `Dictionary`/`HashSet` map ý định sang `HashMap`/`HashSet`; Java custom key cần `equals/hashCode`, C# cần `Equals/GetHashCode` hoặc comparer phù hợp.
- Cả `string` C# và `String` Java dùng UTF-16 indexing; rune/code point/grapheme API khác. Hỏi input contract thay vì coi `char` là user character.
- C# `checked` có thể bắt integer overflow theo context; Java dùng promote `long`/`Math.*Exact`. Comparator Java dùng `Integer.compare`, C# dùng `Comparer<T>`/`CompareTo` tránh subtraction overflow tương tự.
- Java `PriorityQueue` min-heap; .NET `PriorityQueue<TElement,TPriority>` cũng lấy priority nhỏ nhất mặc định nhưng API khác. Trong interview hãy nói invariant, không dựa trí nhớ tên method.

## 6. Testing checklist trong interview

- empty/null theo contract, one element;
- duplicate/tie/all same;
- sorted/reverse/skew/deep;
- min/max integer và multiplication overflow;
- disconnected graph/cycle/self-loop;
- no solution/multiple solution;
- mutation/aliasing/input preserved;
- performance worst-shape.

## Rubric 0–4

| Dimension | Weight | 3/4 senior signal |
|---|---:|---|
| clarification/invariant | 10% | chủ động khóa ambiguity/correctness |
| approach progression | 15% | brute force → optimal có lý do |
| correctness | 30% | code compile, không logical gap |
| complexity | 10% | đúng và tính đủ costs |
| Java idiom/quality | 15% | DS/API phù hợp, không trap |
| tests/edge | 15% | tự tìm case phá solution |
| communication | 5% | concise, recover tốt khi hint |

Pass khi tổng ≥3, correctness không dưới 3. “Nhớ ra pattern” nhưng code sai không pass.

## Lab/mocks

1. Chạy tests sample; thêm overflow/duplicate/disconnected case.
2. Mỗi ngày một timed problem với editor trống và `javac`/JUnit sau khi kết thúc.
3. Mỗi tuần một pair mock: interviewer chỉ hỏi clarification/hint theo rubric.
4. Error log theo category: misunderstood, invariant, implementation, complexity, Java API, edge, communication; remediate lỗi lặp.

## Quiz

1. Hai vòng lặp luôn O(n²)?
2. BFS đánh dấu visited lúc nào để tránh enqueue duplicate?
3. Comparator `(a,b) -> a-b` có bug gì?
4. Dijkstra dùng được negative edge?

<details><summary>Đáp án/rubric</summary>

1. Không; xét tổng số lần pointer/state thay đổi.
2. Thường lúc enqueue/discover; nếu đợi dequeue, một node có thể vào queue nhiều lần.
3. Integer overflow phá ordering/transitivity; dùng compare method.
4. Không theo phiên bản chuẩn; cần Bellman-Ford/algorithm phù hợp hoặc constraint khác.
</details>
