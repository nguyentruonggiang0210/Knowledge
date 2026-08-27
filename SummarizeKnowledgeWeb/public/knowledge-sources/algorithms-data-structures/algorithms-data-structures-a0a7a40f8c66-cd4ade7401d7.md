# Answer Key, Giải thích và Rubric

> **Dừng lại nếu bạn chưa nộp bài.** Tệp này cố ý chứa toàn bộ đáp án và hint. Ghi điểm/thời gian lần đầu vào `progress-tracker.md` trước khi đọc tiếp.

## Rubric chung

### MCQ — 2 điểm/câu

- 2 điểm: chọn đúng và lý do không mâu thuẫn với đáp án.
- 0 điểm: chọn sai hoặc chọn nhiều đáp án. Không có điểm “gần đúng”.

### Trace/giải thích — 4 điểm/câu

- 1 điểm: kết quả cuối đúng.
- 1.5 điểm: trace/state trung gian đúng.
- 1.5 điểm: invariant, proof hoặc lý do kỹ thuật đúng.
- Trừ tối đa 1 điểm nếu không nêu complexity khi câu hỏi yêu cầu.

### Coding Foundations — 9 điểm/câu

- 1 điểm: làm rõ semantics/edge cases.
- 3 điểm: chọn đúng thuật toán và phát biểu invariant.
- 3 điểm: code C# hoàn chỉnh, biên dịch được, không lỗi logic/overflow.
- 1 điểm: time/space complexity đúng.
- 1 điểm: dry-run và test biên có oracle đúng.

### Coding Trees/Graphs/Advanced — 8 điểm/câu

- 1 điểm: làm rõ semantics/edge cases.
- 2 điểm: thuật toán, state/invariant/proof đúng.
- 3 điểm: code C# hoàn chỉnh và đúng.
- 1 điểm: complexity đúng.
- 1 điểm: test đủ để bắt lỗi phổ biến.

Một lời giải coding sai trên input hợp lệ không được quá 5/9 hoặc 4/8. Một lời giải vượt constraints rõ ràng không được điểm thuật toán tối ưu. Dùng gợi ý khi làm module thì đánh dấu câu đó “assisted”, không tính là mastered.

---

# Đáp án Quiz 01 — Foundations

## F01–F16

| ID | Đáp án | Giải thích |
|---|:---:|---|
| F01 | C | Vòng ngoài chạy `Θ(log n)` lần, mỗi lần vòng trong `Θ(n)`: `Θ(n log n)`. |
| F02 | B | Phần lớn append là hằng số; resize/copy `O(n)` thỉnh thoảng, tổng của chuỗi append vẫn tuyến tính. |
| F03 | B | Với hash phân bố tốt, expected lookup là `O(1)`; collision/pathology có thể làm bucket dài tuyến tính. |
| F04 | C | Phải dịch `n` phần tử sang phải dù đã có capacity. |
| F05 | B | Nếu tổng nhỏ thì tăng trái, nếu lớn thì giảm phải; tính sorted bảo đảm không bỏ nghiệm. |
| F06 | A | Với số dương, mở rộng không làm tổng giảm và thu trái không làm tổng tăng; quyết định di chuyển có tính đơn điệu. |
| F07 | A | Hai con trỏ gặp nhau nếu có cycle; không cần set visited. |
| F08 | A | Mỗi index push/pop tối đa một lần; khi gặp giá trị lớn hơn, pop các index đang chờ đáp án. |
| F09 | B | Mỗi phần tử chỉ đi `in -> out` một lần, nên tổng chi phí của chuỗi thao tác là tuyến tính. |
| F10 | B | Đây là định nghĩa lower bound trên khoảng `[0,n)`. |
| F11 | C | Merge chọn phần tử bên trái khi bằng nhau nên giữ thứ tự tương đối; ba cách in-place còn lại thường không stable. |
| F12 | C | Decision tree của `n!` hoán vị có chiều cao `Ω(log(n!)) = Ω(n log n)`. |
| F13 | B | Trừ 1 đảo suffix từ bit 1 thấp nhất; AND làm bit 1 đó biến mất. |
| F14 | A | Sau sort theo start, chỉ cần so interval kế tiếp với interval merged hiện tại. |
| F15 | B | Khởi tạo 0 sẽ trả subarray rỗng thay vì phần tử âm lớn nhất. |
| F16 | C | `char` là UTF-16 code unit; surrogate pair và grapheme có thể gồm nhiều `char`. |

## F17–F24

### F17

| i | value | need | map trước insert | hành động |
|---:|---:|---:|---|---|
| 0 | 2 | 7 | `{}` | insert `2 -> 0` |
| 1 | 7 | 2 | `{2:0}` | thấy `2`, trả `[0,1]` |

Kiểm tra trước insert ngăn dùng cùng một phần tử hai lần; ví dụ `[2]`, target `4` không được ghép index 0 với chính nó.

### F18

| right | char | left sau update | lastSeen sau update | best |
|---:|:---:|---:|---|---:|
| 0 | a | 0 | `a:0` | 1 |
| 1 | b | 0 | `a:0,b:1` | 2 |
| 2 | b | 2 | `a:0,b:2` | 2 |
| 3 | a | 2 | `a:3,b:2` | 2 |

Tại `right=3`, lần xuất hiện cũ của `a` nằm ngoài window hiện tại. Gán thẳng `left=1` sẽ kéo biên trái lùi và tạo window `"bba"` không hợp lệ; `max` giữ biên trái đơn điệu.

### F19

| Sau vòng | prev | current | next đã lưu |
|---:|---|---|---|
| ban đầu | `null` | `1` | — |
| 1 | `1 -> null` | `2` | `2` |
| 2 | `2 -> 1 -> null` | `3` | `3` |
| 3 | `3 -> 2 -> 1 -> null` | `null` | `null` |

Head mới là node `3`. Invariant: `prev` là prefix đã đảo đúng, `current` là head của suffix chưa xử lý; lưu `next` trước khi đổi link để không mất suffix.

### F20

Minimum sau từng thao tác: `3, 3, 2, 2, 2, 3, 3`. `GetMin()` cuối trả `3`. Có thể dùng stack thứ hai push minimum mới khi `value <= currentMin`; khi pop, nếu value bằng top của min-stack thì pop cả min-stack. Dùng `<` thay cho `<=` mà không có count sẽ làm mất duplicate minimum quá sớm.

### F21

| lo | hi | mid | a[mid] | cập nhật |
|---:|---:|---:|---:|---|
| 0 | 5 | 2 | 2 | `hi=2` |
| 0 | 2 | 1 | 2 | `hi=1` |
| 0 | 1 | 0 | 1 | `lo=1` |

Trả `1`. Invariant: mọi index `< lo` có giá trị `< target`; mọi index `>= hi` có giá trị `>= target`. Vùng `[lo,hi)` chưa phân loại; khi rỗng, `lo` là boundary.

### F22

Output sau các lần chọn: `[1]`, `[1,2]`, `[1,2,2]`, `[1,2,2,4]`, `[1,2,2,4,6]`, rồi append `7`. Có 5 phép so sánh giữa hai nửa. Khi bằng nhau, chọn phần tử nửa trái (`left <= right`) để các record có equal key giữ thứ tự ban đầu, nhờ đó stable.

### F23

| i | a[i] | bestEndingHere | bestSoFar |
|---:|---:|---:|---:|
| 0 | -2 | -2 | -2 |
| 1 | 1 | 1 | 1 |
| 2 | -3 | -2 | 1 |
| 3 | 4 | 4 | 4 |
| 4 | -1 | 3 | 4 |
| 5 | 2 | 5 | 5 |
| 6 | 1 | 6 | 6 |
| 7 | -5 | 1 | 6 |
| 8 | 4 | 5 | 6 |

Kết quả `6`, đoạn index `[3..6]` là `[4,-1,2,1]`. Khi bắt đầu mới tại `i`, cập nhật candidate start; khi `bestEndingHere` vượt best, lưu hai endpoint.

### F24

Accumulator: `0 -> 4 -> 5 -> 7 -> 6 -> 4`. XOR có tính kết hợp, giao hoán; `x ^ x = 0`; `x ^ 0 = x`. Vì vậy mọi cặp triệt tiêu, còn `4`.

## F25–F28 — Chuẩn lời giải coding

### F25. Longest substring

- Dùng `Dictionary<char,int>` lưu index cuối. Với mỗi `right`, nếu char đã thấy, đặt `left = Math.Max(left, old + 1)`; cập nhật index và `best`.
- Invariant: `s[left..right]` không có `char` trùng và `left` không bao giờ lùi.
- Complexity: `O(n)` expected time, `O(min(n, alphabet))` space.
- Oracle: `"tmmzuxt" -> 5`, `"abba" -> 2`, `" " -> 1`, rỗng `0`.
- Follow-up Unicode scalar: enumerate `Rune` (`EnumerateRunes`), map `Rune` sang vị trí theo **số rune**; nếu output cần UTF-16 offsets thì giữ thêm offset. Grapheme cluster là yêu cầu khác và cần text-element enumeration.

### F26. LRU Cache

- `Dictionary<int,Node>` + doubly linked list. Sentinel `head` là phía most-recent, `tail` là least-recent.
- `Get`: lookup; nếu có, detach rồi add-after-head. `Put`: cập nhật/move nếu có; nếu mới thì add; khi count vượt capacity, xóa `tail.Prev` khỏi list và dictionary.
- Invariant: mỗi key có đúng một node trong cả map/list; thứ tự list chính là recency order.
- Complexity: `O(1)` expected time mỗi thao tác, `O(capacity)` space.
- Dry-run oracle: `Get(1)=1`; `Put(3,3)` evict key 2; `Get(2)=-1`; update key 1 thành 10; `Get(1)=10`.
- Lỗi trừ điểm: singly linked list dẫn tới xóa `O(n)`, không move khi update, capacity 1 hỏng link, để node bị evict trong map.

### F27. Search Range

- Viết `LowerBound(x)` tìm first `>= x` và `UpperBound(x)` tìm first `> x`; cả hai trên `[0,n)`.
- `first=LowerBound(target)`; nếu `first==n || nums[first]!=target`, trả `[-1,-1]`; ngược lại `last=UpperBound(target)-1`.
- Không cần tính `target+1`, do đó không overflow ở `int.MaxValue`.
- Complexity `O(log n)` time, `O(1)` space.
- Oracle: `[2,2],2 -> [0,1]`; `[1,3],2 -> [-1,-1]`; `[int.MaxValue],int.MaxValue -> [0,0]`.

### F28. Merge Intervals

- Copy `(start,end)` hoặc copy outer/values, sort theo `start`, tie theo `end`. Không sort/mutate các inner array của caller.
- Giữ interval hiện tại. Nếu `next.start <= current.end`, đặt end là `max`; nếu không, emit current và bắt đầu interval mới. Emit lần cuối.
- Invariant: output đã emit là merged, sorted và không overlap; current là union của component overlap cuối.
- Complexity `O(n log n)` time; `O(n)` output/copy space (ngoài sort).
- Oracle: `[] -> []`; `[[1,4],[1,4]] -> [[1,4]]`; `[[1,10],[2,3]] -> [[1,10]]`; `[[1,2],[2,3]] -> [[1,3]]`.

---

# Đáp án Quiz 02 — Trees và Graphs

## TG01–TG16

| ID | Đáp án | Giải thích |
|---|:---:|---|
| TG01 | B | Preorder xử lý root trước hai subtree. |
| TG02 | B | Duplicate phải tuân một policy nhất quán; cân bằng không ảnh hưởng thứ tự inorder. |
| TG03 | B | Chiều cao tree cân bằng là `Θ(log n)`. |
| TG04 | C | Đi một cạnh trie cho mỗi ký tự; không phụ thuộc trực tiếp số từ. |
| TG05 | B | Node mới có thể đi từ leaf lên root qua chiều cao `Θ(log n)`. |
| TG06 | A | Heap giữ `k` phần tử lớn nhất; root là phần tử lớn thứ `k`. |
| TG07 | B | BFS khám phá theo số cạnh tăng dần. |
| TG08 | B | Cạnh tới ancestor còn gray là back edge và tạo directed cycle. |
| TG09 | C | Topological order tồn tại đúng cho DAG. |
| TG10 | A | Bound chuẩn là inverse Ackermann, rất gần hằng số trong thực tế. |
| TG11 | C | Cạnh âm có thể cải thiện node đã finalize, phá greedy invariant của Dijkstra. |
| TG12 | B | Một cải thiện sau `V-1` cạnh chứng tỏ có reachable negative cycle. |
| TG13 | A | Union-find kiểm tra hai đầu cạnh có đang khác component. |
| TG14 | B | Trọng số phân biệt làm lightest crossing edge của mỗi cut là duy nhất, suy ra MST duy nhất. |
| TG15 | C | Mỗi vertex và mỗi adjacency entry được xử lý hằng số lần. |
| TG16 | B | Connected + `V-1` cạnh tương đương connected acyclic đối với undirected graph. |

## TG17–TG24

### TG17

- Preorder: `8, 3, 1, 6, 4, 7, 10, 14, 13`.
- Inorder: `1, 3, 4, 6, 7, 8, 10, 13, 14`.
- Postorder: `1, 4, 7, 6, 3, 13, 14, 10, 8`.
- Level-order: `8, 3, 10, 1, 6, 14, 4, 7, 13`.

Iterative DFS dùng stack (postorder có thể dùng hai stack hoặc `(node,visited)`); level-order dùng queue. Complexity đều `O(n)` time; auxiliary space `O(h)` cho DFS cân đối theo stack, `O(width)` cho BFS.

### TG18

Trace bounds mở:

```text
5: (-∞,+∞)  hợp lệ
1: (-∞,5)   hợp lệ
7: (5,+∞)   hợp lệ
4: (5,7)    vi phạm vì 4 <= 5
8: (7,+∞)   hợp lệ, nhưng tree đã false
```

Kết quả `false`. So với parent chỉ thấy `4 < 7` và sẽ bỏ lỡ constraint từ ancestor `5`. Bounds `long` cho phép dùng giá trị ngoài miền `int`, không phải tính `int.MinValue - 1` hoặc loại nhầm endpoint.

### TG19

Insert `1`:

```text
[2,5,3,9,7,8,1]
[2,5,1,9,7,8,3]
[1,5,2,9,7,8,3]
```

Extract min: lấy `1`, đưa last `3` lên root rồi sift-down:

```text
[3,5,2,9,7,8]
[2,5,3,9,7,8]
```

Với index `i`: `parent=(i-1)/2` khi `i>0`; `left=2*i+1`; `right=2*i+2`. Phải kiểm tra child index còn `< count`.

### TG20

```text
Search("ca")      -> false
StartsWith("ca")  -> true
Search("car")     -> true
StartsWith("")    -> true
```

`ca` có path nhưng node `a` chưa có terminal flag. `car` có path và terminal flag. Prefix rỗng tương ứng root nên luôn tồn tại. Nếu đã `Insert("")`, khi đó `Search("")` mới true.

### TG21

| Dequeue | Queue sau khi thêm node mới | Node mới `(distance,parent)` |
|---|---|---|
| A | `[B,C]` | `B=(1,A), C=(1,A)` |
| B | `[C,D]` | `D=(2,B)` |
| C | `[D,E]` | `E=(2,C)`; D đã discovered |
| D | `[E,F]` | `F=(3,D)` |
| E | `[F]` | — |
| F | `[]` | — |

Thứ tự dequeue `A,B,C,D,E,F`. Shortest path theo tie-break là `A -> B -> D -> F`. Đánh dấu visited lúc **enqueue**, không phải dequeue, để tránh enqueue lặp và parent không ổn định.

### TG22

Một trace hợp lệ:

```text
enter A: gray
  enter B: gray
    enter D: gray
      edge D->B thấy B gray => cycle B->D->B
    exit D: black
  exit B: black
  enter C: gray
    edge C->D thấy D black
  exit C: black
exit A: black
```

Node black đã hoàn tất; cạnh tới nó có thể là forward/cross edge và không nhất thiết quay về ancestor đang active. Chỉ gray đại diện node trên recursion stack hiện tại.

### TG23

Indegree ban đầu: `0:2, 1:2, 2:1, 3:1, 4:0, 5:0`; heap `[4,5]`.

| Pop | Output | Thay đổi indegree | Heap sau bước |
|---:|---|---|---|
| 4 | `[4]` | `0:1, 1:1` | `[5]` |
| 5 | `[4,5]` | `2:0, 0:0` | `[0,2]` |
| 0 | `[4,5,0]` | — | `[2]` |
| 2 | `[4,5,0,2]` | `3:0` | `[3]` |
| 3 | `[4,5,0,2,3]` | `1:0` | `[1]` |
| 1 | `[4,5,0,2,3,1]` | — | `[]` |

Order là `[4,5,0,2,3,1]`. Nếu số node output `< V`, phần còn lại có cycle. Complexity `O((V+E) log V)` với min-heap; queue thường là `O(V+E)` nhưng không bảo đảm tie-break nhỏ nhất.

### TG24

| Cạnh | Quyết định | Component sau bước | Tổng |
|---|---|---|---:|
| AB:1 | chọn | `{AB},{C},{D}` | 1 |
| BC:2 | chọn | `{ABC},{D}` | 3 |
| AC:3 | bỏ, cùng component | `{ABC},{D}` | 3 |
| BD:4 | chọn | `{ABCD}` | 7 |

Có thể dừng sau `V-1=3` cạnh; `CD:5` không cần xét. `AC` đóng cycle với hai cạnh nhẹ hơn, nên theo cycle property nó không cần nằm trong MST. Tổng MST là `7`.

## TG25–TG31 — Chuẩn lời giải coding

### TG25. Validate BST

- DFS `Validate(node, long low, long high)`; null là true; yêu cầu `low < node.val < high`.
- Trái nhận `(low,node.val)`, phải nhận `(node.val,high)`.
- Complexity `O(n)` time, `O(h)` call stack; worst-case skewed là `O(n)` stack.
- Oracle: null `true`; `[2,1,3] true`; `[5,1,7,null,null,4,8] false`; node `int.MinValue` một mình `true`.
- Lỗi phổ biến: chỉ so parent, dùng inclusive bound dù key strict, sentinel `int` loại nhầm boundary.

### TG26. Trie

- Root luôn tồn tại; mỗi node có children và `IsWord`. `Insert` tạo path rồi set flag; `Search` cần path + flag; `StartsWith` chỉ cần path.
- Với quy ước đề: `StartsWith("")` true; `Search("")` true chỉ sau `Insert("")`.
- Array 26: lookup nhanh, bộ nhớ cố định và có thể lãng phí ở trie thưa. Dictionary: bộ nhớ theo cạnh thực tế nhưng overhead/hash lớn hơn.
- Complexity `O(L)` time mỗi thao tác; space `O(tổng số ký tự node mới)`.

### TG27. Top K Frequent

- Đếm bằng dictionary. Ranking tốt hơn là frequency lớn hơn, hoặc bằng thì value nhỏ hơn.
- Duy trì heap size `k` với **ứng viên tệ nhất ở root**: priority có thể là `(frequency, -(long)value)` trên min-heap. Push từng distinct value; nếu count vượt `k`, pop root. Cuối cùng sort `k` phần tử theo `(freq desc,value asc)`.
- Dùng `long` khi phủ định value để không overflow `int.MinValue`, hoặc custom comparer rõ ràng.
- Complexity `O(n + d log k + k log k)` time, `O(d+k)` space với `d` distinct.
- Bucket theo frequency có phần frequency `O(n+d)`, nhưng yêu cầu tie value tăng có thể cần sort trong bucket; không được tuyên bố deterministic output `O(n)` nếu chưa xử lý chi phí tie.

### TG28. Number of Islands

- Quét mọi cell. Khi thấy đất chưa visited, tăng count và flood-fill 4 hướng bằng queue/stack; giữ `bool[,]`/jagged visited vì không sửa input.
- Invariant: một flood-fill đánh dấu chính xác toàn bộ component 4-connected chứa seed; mỗi cell được enqueue tối đa một lần nếu mark khi enqueue.
- Complexity `O(RC)` time, `O(RC)` visited và worst-case frontier/stack.
- Recursive DFS có thể stack overflow với island lớn trong C#; iterative DFS/BFS an toàn hơn.
- Oracle: empty `0`; một cell land `1`; diagonal `[[1,0],[0,1]] -> 2`; toàn land `1`.

### TG29. Course Schedule II

- Chuẩn hóa duplicate edge bằng `HashSet<int>` adjacency mỗi prerequisite (hoặc global set cặp), chỉ tăng indegree khi cạnh mới.
- Kahn: đưa mọi indegree-zero vào min-heap; pop nhỏ nhất, append, giảm neighbor; khi về 0 thì enqueue. Nếu output count khác `numCourses`, trả rỗng.
- Complexity expected `O((V+E) log V)` vì heap, space `O(V+E)`; `E` ở đây là cạnh distinct.
- Oracle: `2, [[1,0]] -> [0,1]`; cycle `[[1,0],[0,1]] -> []`; duplicate `[[1,0],[1,0]]` vẫn `[0,1]`; không cạnh trả `[0..V-1]`.

### TG30. Network Delay Time

- Build adjacency list; `long[] dist` khởi tạo infinity, source 0. Min-priority queue chứa `(node,distance)`.
- Pop entry; nếu priority khác `dist[node]`, bỏ stale. Relax bằng `candidate = distance + (long)weight`; push khi nhỏ hơn.
- Kết quả là max distance nếu mọi node finite, ngược lại `-1`.
- Với `PriorityQueue` lazy duplicate, heap có thể chứa theo số edge nên bound tổng quát là `O((V+E) log E)` time, `O(V+E)` space. Trên simple graph `E <= V²` nên `log E = O(log V)`; indexed heap/decrease-key cũng giữ heap size theo `V`. Parallel edges không cho phép tự giả định bound simple graph nếu chưa collapse/deduplicate chúng.
- Oracle: `n=1,times=[],source=1 -> 0`; unreachable -> `-1`; parallel edge phải chọn cạnh nhẹ hơn; zero edge hợp lệ.

### TG31. Min Cost Connect Points

- Dense Prim không materialize cạnh: `best[v]` là cạnh nhẹ nhất từ tree hiện tại tới `v`; mỗi vòng chọn unused `u` có best nhỏ nhất, cộng cost rồi scan mọi `v` để update Manhattan distance.
- Tính `Math.Abs((long)x1-x2) + Math.Abs((long)y1-y2)` để tránh overflow phép trừ `int`.
- Invariant: theo cut property, node/cạnh nhỏ nhất vượt cut có thể thêm an toàn vào một MST.
- Complexity `O(n²)` time, `O(n)` extra space. `n=0/1` trả `0`.
- Lỗi phổ biến: int overflow; cộng node hai lần; dùng heap nhưng vẫn tạo `n²` edges và tuyên bố `O(n)` memory.

---

# Đáp án Quiz 03 — DP, Greedy và Advanced

## DA01–DA16

| ID | Đáp án | Giải thích |
|---|:---:|---|
| DA01 | B | Mỗi recursive call phải tiến gần base case để recursion dừng. |
| DA02 | B | Nhánh sau phải nhìn thấy state như trước khi nhánh hiện tại choose. |
| DA03 | B | Ở cùng level, bản sao bên phải chỉ được chọn sau khi bản sao trước đã thuộc path. |
| DA04 | B | Exchange argument thay choice đầu của một optimum bằng greedy choice mà không giảm chất lượng. |
| DA05 | C | Finish sớm nhất để lại nhiều không gian nhất cho phần còn lại. |
| DA06 | B | Greedy `4+1+1` dùng 3 coin, còn `3+3` dùng 2. |
| DA07 | A | Memo làm mỗi state duy nhất được giải một lần; mỗi lần trả chi phí transition. |
| DA08 | B | Duyệt giảm để `dp[c-w]` vẫn là state trước item hiện tại. |
| DA09 | A | Duyệt tăng cho phép state vừa cập nhật tái dùng cùng item. |
| DA10 | B | `tails[len-1]` là tail nhỏ nhất biết được; length đúng nhưng chính array này không luôn là path. |
| DA11 | B | Prefix state cho phép transition từ hàng/cột trước. |
| DA12 | B | Levenshtein chuẩn dùng insert/delete/replace, mỗi thao tác cost 1. |
| DA13 | A | Subarray kết thúc tại `i` hoặc bắt đầu mới, hoặc nối best ending tại `i-1`. |
| DA14 | B | LPS nói pattern đã match được bao nhiêu ký tự vẫn có thể giữ lại sau mismatch. |
| DA15 | B | Hash collision có thể tạo false positive; so ký tự xác nhận exact match. |
| DA16 | C | Mỗi phần tử có hai lựa chọn, nên có `2^n` mask/subset. |

## DA17–DA26

### DA17

Theo nhánh không chọn trước, output ở leaf là:

```text
[], [3], [2], [2,3], [1], [1,3], [1,2], [1,2,3]
```

Recursion tree nhị phân đầy đủ depth 3 có `2^3=8` leaf và `1+2+4+8=15` call node. Có `Θ(2^n)` state, nhưng copy mỗi subset vào output làm time/output size `Θ(n*2^n)` worst-case; auxiliary recursion/path `O(n)`, không tính output.

### DA18

Output: `[1,1,2]`, `[1,2,1]`, `[2,1,1]`.

Ở level 0, chọn index 0 (giá trị 1) hoặc index 2 (giá trị 2); index 1 bị skip vì `a[1]==a[0]` và index 0 chưa used ở level đó. Sau khi index 0 đã nằm trong path, index 1 được phép chọn, nhờ vậy `[1,1,2]` không mất. Quy tắc chỉ phá đối xứng giữa các bản sao ở **cùng depth**, không cấm dùng cả hai bản sao.

### DA19

Greedy chọn `4`, rồi `1`, `1`: 3 coin. Nghiệm `3+3`: 2 coin. Counterexample phải là input hợp lệ, chỉ ra output greedy và một nghiệm tốt hơn; không cần chứng minh nghiệm tốt hơn là duy nhất, nhưng ở đây không thể dùng 1 coin vì không có coin 6 nên 2 là tối ưu.

DP: `dp[a]` là số coin ít nhất tạo amount `a`; `dp[0]=0`; `dp[a]=min(dp[a-c]+1)` với `c<=a` và state trước reachable. Kết quả unreachable dùng `-1`.

### DA20

Thứ tự finish đã là: `(1,3),(2,5),(4,7),(6,9),(8,10)`.

```text
chọn (1,3), lastEnd=3
bỏ   (2,5), start 2 < 3
chọn (4,7), lastEnd=7
bỏ   (6,9), start 6 < 7
chọn (8,10), lastEnd=10
```

Kết quả 3. Exchange proof: interval finish sớm nhất có thể thay interval đầu của một optimum mà không làm giảm số slot còn lại.

### DA21

Định nghĩa `dp[i]` là max với `i` house đầu tiên:

| i | 0 | 1 | 2 | 3 | 4 | 5 |
|---:|---:|---:|---:|---:|---:|---:|
| dp | 0 | 2 | 7 | 11 | 11 | 12 |

Transition `dp[i]=max(dp[i-1], dp[i-2]+nums[i-1])`. Reconstruct chọn index `4`, rồi `2`, rồi `0`: `1+9+2=12`. Hai biến giữ `prev2=dp[i-2]`, `prev1=dp[i-1]` trước khi tính state mới.

### DA22

Với bottom-up theo amount:

| amount | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| min coin | 0 | 1 | 2 | 1 | 1 | 2 | 2 |

Nghiệm amount 6 là `3+3`. Có thể dùng sentinel `amount+1` vì không nghiệm tối ưu nào cần hơn `amount` coin khi coin 1 có mặt; tổng quát dùng một finite safe value và chỉ cộng khi predecessor reachable. `int.MaxValue + 1` overflow thành số âm.

### DA23

| Sau item | dp[0..5] |
|---|---|
| ban đầu | `[0,0,0,0,0,0]` |
| `(2,3)` | `[0,0,3,3,3,3]` |
| `(3,4)` | `[0,0,3,4,4,7]` |
| `(4,5)` | `[0,0,3,4,5,7]` |

Nghiệm `7` dùng items weight 2 và 3. Nếu duyệt tăng với item `(2,3)`, sau khi `dp[2]=3`, state `dp[4]` có thể đọc ngay `dp[2]+3=6`, tức dùng cùng item hai lần—sai với 0/1.

### DA24

| x | tails sau update |
|---:|---|
| 10 | `[10]` |
| 9 | `[9]` |
| 2 | `[2]` |
| 5 | `[2,5]` |
| 3 | `[2,3]` |
| 7 | `[2,3,7]` |
| 101 | `[2,3,7,101]` |
| 18 | `[2,3,7,18]` |

Length là 4; một LIS là `[2,3,7,18]` (hoặc `[2,5,7,101]`). Mỗi cell tails có thể được thay bởi một phần tử đến muộn hơn thuộc một predecessor chain khác; không có parent metadata nên không được mặc định toàn array tails luôn là subsequence cần reconstruct.

### DA25

`dp[i,j]` là LCS length của `a[0..i)` và `b[0..j)`. Hàng/cột 0 bằng 0. Nếu `a[i-1]==b[j-1]`, `dp[i,j]=1+dp[i-1,j-1]`; ngược lại lấy `max(dp[i-1,j],dp[i,j-1])`.

|  | ∅ | a | c | e |
|---|---:|---:|---:|---:|
| ∅ | 0 | 0 | 0 | 0 |
| a | 0 | 1 | 1 | 1 |
| b | 0 | 1 | 1 | 1 |
| c | 0 | 1 | 2 | 2 |
| d | 0 | 1 | 2 | 2 |
| e | 0 | 1 | 2 | 3 |

Length 3; backtrack các diagonal match cho LCS `"ace"`. Complexity `O(|a||b|)` time và space; chỉ cần length có thể giảm space xuống một hàng.

### DA26

LPS của `"ababaca"` là `[0,0,1,2,3,0,1]`.

```text
i=1 'b', len=0: mismatch => lps[1]=0
i=2 'a' == p[0]: len=1
i=3 'b' == p[1]: len=2
i=4 'a' == p[2]: len=3
i=5 'c' != p[3]: len=lps[2]=1
             'c' != p[1]: len=lps[0]=0
             'c' != p[0]: lps[5]=0, i++
i=6 'a' == p[0]: len=1
```

Trong search, sau mismatch với `j>0`, đặt `j=lps[j-1]` và giữ nguyên `i`: suffix đã match cũng là prefix nên không cần so lại phần text đó.

## DA27–DA32 — Chuẩn lời giải coding

### DA27. Combination Sum II

- Sort array. DFS `(start, remaining, path)`; loop `i` từ start. Skip khi `i>start && a[i]==a[i-1]`; vì số dương, break khi `a[i]>remaining`. Choose `i`, recurse `i+1`, rồi remove cuối.
- Invariant: path không giảm, chỉ dùng index trước start đúng một lần; tại một depth chỉ đại diện đầu tiên của mỗi equal value được mở nhánh.
- Worst-case `O(n*2^n)` gồm copy output, recursion `O(n)` ngoài output.
- Oracle: `[10,1,2,7,6,1,5],8 -> [1,1,6],[1,2,5],[1,7],[2,6]`; `[2,5,2,1,2],5 -> [1,2,2],[5]`.

### DA28. Jump Game

- `farthest=0`. Với `i` tăng: nếu `i>farthest`, false; cập nhật `farthest=max(farthest, i+(long)nums[i])`; nếu tới `last`, true.
- Invariant: trước mỗi vòng, mọi index `<= farthest` reachable từ prefix đã xét. Dùng `long` cho phép cộng index + jump an toàn.
- Complexity `O(n)` time, `O(1)` space. Quy ước hợp lý: empty false, length 1 true.
- Oracle: `[2,3,1,1,4] true`; `[3,2,1,0,4] false`; `[0] true`; `[0,1] false`.

### DA29. Word Break

- Deduplicate dictionary trong `HashSet<string>`, lấy `maxLen`. `dp[0]=true`; với `end=1..n`, chỉ thử `len<=min(end,maxLen)` và set true nếu `dp[end-len]` cùng token tồn tại.
- State: `dp[i]` đúng khi prefix length `i` tách được; transition xét từ cuối cùng.
- Có `O(n*L)` candidate với max word length `L`. Trong .NET, `Substring` copy/hash `O(len)`, nên implementation trực tiếp có worst-case character work `O(n*L²)`, không phải tự động `O(nL)`. Trie/span/rolling-hash có thể tránh allocation nhưng phải phân tích riêng.
- Space `O(n + tổng dictionary chars)` ngoài substring tạm.
- Oracle: `"leetcode",["leet","code"] true`; `"catsandog"` false; empty string true; duplicate dict không đổi kết quả.

### DA30. 0/1 Knapsack

- `long[] dp = new long[capacity+1]`; với mỗi item, loop `c=capacity` xuống `weight`, `dp[c]=max(dp[c],dp[c-weight]+value)`.
- Mảng 0 hợp lệ vì được phép chọn rỗng; item value âm tự bị bỏ. Cast value lên long trước cộng.
- Complexity `O(n*capacity)` time, `O(capacity)` space.
- Nếu capacity cực lớn, đây là pseudo-polynomial và không khả thi; cân nhắc DP theo tổng value (khi phù hợp), sparse-state map/Pareto frontier, meet-in-the-middle cho `n` nhỏ, hoặc approximation tùy constraints.
- Oracle: items của DA23 trả 7; capacity 0 trả 0; mọi value âm trả 0.

### DA31. LIS

- Duy trì list `tails`. Với mỗi `x`, binary search first index có `tails[idx] >= x`; replace tại idx hoặc append nếu không có.
- Dùng `>=` (lower bound), không dùng `>`, vì LIS strictly increasing.
- Complexity `O(n log n)` time, `O(n)` space.
- Reconstruct: giữ `tailIndex[length]` là index input đại diện và `parent[i]` là predecessor; khi replace/update, set parent từ tail của length trước rồi backtrack.
- Oracle: `[10,9,2,5,3,7,101,18] -> 4`; `[2,2,2] -> 1`; `[5,4,3] -> 1`; empty `0`.

### DA32. KMP search

- Build LPS `O(m)`. Search với `i,j`: match thì tăng cả hai; khi `j==m`, trả `i-m`; mismatch và `j>0` thì `j=lps[j-1]`, nếu `j==0` mới tăng `i`.
- Pattern rỗng phải xử lý trước và trả 0.
- Complexity `O(n+m)` time, `O(m)` space.
- Oracle: `"aaaaa","aaa" -> 0`; `"mississippi","issip" -> 4`; `"abc","abcd" -> -1`; `"abc","" -> 0`.

---

# Đáp án Mock Interviews

## Rubric 100 điểm cho mỗi mock

| Hạng mục | Điểm | Điều kiện đạt trọn |
|---|---:|---|
| Clarify | 10 | Xác nhận semantics, constraints, mutation, overflow và output trước khi code |
| Algorithm | 25 | Baseline hợp lệ (5), optimal pattern + invariant/proof (20) |
| C# code | 30 | API đúng, biên dịch, đúng core (20), robust edge/overflow (5), follow-up chính (5) |
| Complexity | 10 | Time/space theo đúng implementation và giải thích trade-off |
| Test | 15 | Dry-run example (5), ít nhất 3 edge case có oracle (7), tự phát hiện/sửa lỗi (3) |
| Communication | 10 | Suy nghĩ có cấu trúc (5), trả lời follow-up/proof/counterexample (5) |

Hint level 1 trừ 5, level 2 trừ 10, level 3 trừ 20 (chỉ lấy mức cao nhất, không cộng dồn). Nếu core code sai input hợp lệ: tối đa 59. Nếu giải pháp core vượt constraints: tối đa 69. Nếu không có code follow-up vì hết giờ nhưng core hoàn hảo, vẫn có thể đạt 90–95 tùy chất lượng thảo luận.

## M1 — Meeting Rooms

### Hint ladder

1. **Mức 1:** Khi sort theo start, tại mỗi meeting chỉ cần biết phòng nào kết thúc sớm nhất.
2. **Mức 2:** Core dùng min-heap end time. Follow-up cần tách phòng đang bận và room id đã rảnh.
3. **Mức 3:** Sort meeting theo `(start,inputIndex)`; release mọi busy entry có `end <= start` vào min-heap free id; lấy id nhỏ nhất hoặc cấp id mới.

### Lời giải chuẩn

Core có hai cách tốt:

- Sort start/end riêng, dùng hai pointer; khi `start < end` tăng active, còn `start >= end` giảm/reuse. Lưu max active.
- Sort meeting theo start, giữ min-heap end; trước meeting mới pop mọi end `<= start`, push end mới, lưu max heap size.

Follow-up:

1. Tạo bản copy record `(start,end,inputIndex)`, sort theo `(start,inputIndex)`.
2. `busy` là min-heap `(end,roomId)`, ưu tiên end rồi room id; `freeIds` là min-heap room id.
3. Trước mỗi meeting, chuyển **tất cả** busy có `end <= start` sang `freeIds`.
4. Nếu free có id thì pop nhỏ nhất; nếu không, cấp `nextRoomId++`. Gán `answer[inputIndex]`, rồi push vào busy.

Invariant: ngay trước khi gán meeting, `busy` chứa đúng các room có meeting overlap thời điểm start; `freeIds` chứa mọi id đã cấp nhưng đang rảnh. Nếu không có free room, mọi room hiện có đều overlap nên cấp room mới là bắt buộc; nếu có, reuse giữ số phòng tối thiểu.

Complexity `O(n log n)` time, `O(n)` space. Sort outer references trực tiếp mà làm thay đổi thứ tự caller vi phạm semantics; tạo record copy an toàn hơn.

Oracle:

```text
[[0,30],[5,10],[15,20]] -> min 2, assignment [0,1,1]
[[1,5],[5,8]]           -> min 1, assignment [0,0]
[[1,4],[1,3],[1,2]]     -> min 3, assignment [0,1,2]
[]                       -> min 0, assignment []
```

Điểm code follow-up chỉ trọn khi release tất cả room đúng endpoint, chọn smallest free id, trả theo input order và xử lý tie start theo index.

## M2 — Word Ladder

### Hint ladder

1. **Mức 1:** Xem mỗi word là vertex; mọi cạnh có cùng cost.
2. **Mức 2:** BFS và đánh dấu visited ngay lúc enqueue. Sinh neighbor bằng cách thử 26 ký tự tại từng vị trí.
3. **Mức 3:** Deduplicate dictionary; queue `(word,distance)`; remove neighbor khỏi unvisited khi enqueue; follow-up lưu `parent[neighbor]=word` rồi backtrack từ end.

### Lời giải chuẩn

1. Nếu `beginWord == endWord`, trả 1/path `[begin]` trước check dictionary.
2. Tạo `HashSet<string> unvisited` từ input. Nếu không chứa end, trả 0/rỗng.
3. BFS từ begin với distance 1. Với mỗi vị trí, thử `a..z` trừ ký tự gốc; nếu candidate trong `unvisited`, remove **ngay**, lưu parent, enqueue distance+1.
4. Khi discover end có thể trả distance mới. Follow-up backtrack `end -> parent -> begin`, rồi reverse.

Mark lúc enqueue bảo đảm mỗi word chỉ vào queue một lần và parent đầu tiên thuộc shortest layer. BFS invariant: khi dequeue word ở distance `d`, không tồn tại transformation ngắn hơn chưa xử lý.

Với `N` word, độ dài `L`, có tối đa `26L` candidate/word. Trong mô hình coi tạo/hash word `O(L)`, C# immutable-string implementation trực tiếp có worst-case character work `O(N * 26 * L²)` và `O(NL)` storage; vì `L<=10`, cách này phù hợp. Có thể thảo luận wildcard buckets/bidirectional BFS và phân tích chi phí xây key cụ thể, không chỉ nêu slogan `O(NL)`.

Oracle:

```text
hit -> cog với dict mẫu: length 5; một path hit,hot,dot,dog,cog
same -> same với dict rỗng: length 1; path [same]
hit -> cog khi thiếu cog: 0; []
a -> c với [a,b,c]: length 2; [a,c]
```

Bidirectional BFS thường giảm frontier theo branching factor. Reconstruction phải biết hai phía gặp ở đâu, lưu parent theo hướng tương ứng và đảo/ghép đúng; không được dùng một visited global làm mất thông tin trước khi định nghĩa.

## M3 — Cheapest Route With One Discount

### Hint ladder

1. **Mức 1:** Vị trí node chưa đủ mô tả tương lai; cần biết coupon còn hay đã dùng.
2. **Mức 2:** Tạo graph trạng thái hai layer `(node,used)` và chạy shortest path nonnegative.
3. **Mức 3:** Từ `(u,0)` relax `(v,0)` với `w` và `(v,1)` với `w/2`; từ `(u,1)` chỉ relax `(v,1)` với `w`. Dijkstra từ `(source,0)`.

### Lời giải chuẩn

- Build adjacency list, `dist[n,2]` kiểu `long`, infinity; `dist[source,0]=0`.
- Min-priority queue giữ `(node,used,distance)`; bỏ stale entry.
- Mọi cạnh relax transition không coupon. Nếu `used==0`, relax thêm transition sang layer 1 với cost `(long)w/2`.
- Trả `min(dist[target,0],dist[target,1])`, hoặc `-1` nếu cả hai infinity.

Tất cả expanded-edge weights vẫn không âm, nên Dijkstra đúng. State phải gồm `used`, vì hai đường tới cùng node với chi phí khác và trạng thái coupon khác có khả năng tương lai khác nhau.

Với `PriorityQueue` lazy/stale entries và parallel edges, bound tổng quát là `O((V+E) log E)` time (expanded graph có `2V` state và tối đa `3E` transition), space `O(V+E)`. Trên simple graph có thể rút `log E` thành `O(log V)`; indexed heap/decrease-key cũng cho heap theo số state. Cast sang `long` trước phép cộng/chia liên quan distance.

Reconstruction lưu cho mỗi improved state: `(previousNode,previousUsed,edgeIndex,couponApplied)`. Với tối đa `k` coupon, dùng layer `0..k`; lazy heap có time `O(k(V+E) log(kE))` và worst-case working space `O(k(V+E))` (adjacency gốc vẫn được chia sẻ, nhưng queue có thể chứa nhiều improved entry). Nếu dùng indexed heap, có thể biểu diễn bound theo `(k+1)V` state.

Counterexample cho heuristic “shortest thường rồi giảm cạnh lớn nhất”:

```text
s->a:5, a->t:5       // shortest thường = 10, sau giảm còn 7
s->b:1, b->t:10      // thường = 11, sau giảm còn 6 (tối ưu thật)
```

Oracle đề: path `0->1->3`, cost `4+8` hoặc `8+4`, kết quả `12`; path `0->2->3` sau discount là `3+10=13`. Nếu source=target hoặc path tối ưu toàn cạnh 0, không dùng coupon có thể hòa; nếu một path có cạnh dương, dùng coupon trên cạnh đó không làm xấu và thường cải thiện.

Lỗi nghiêm trọng: visited chỉ theo node; finalize node bỏ qua layer; dùng BFS; áp coupon sau khi đã chọn shortest path thường; `int` overflow.

## M4 — Weighted Job Scheduling

### Hint ladder

1. **Mức 1:** Sort để mỗi job có một prefix các job có thể đứng trước nó.
2. **Mức 2:** Sort theo end; với mỗi job `i`, binary search job cuối có `end <= start[i]`.
3. **Mức 3:** `dp[i]` trên `i` job đầu: `max(dp[i-1], profit[i-1] + dp[p(i-1)+1])`; lưu lựa chọn để backtrack.

### Lời giải chuẩn

1. Copy jobs và sort theo `(end,start,id)` để deterministic; không mutate input.
2. Với job ở zero-based index `i`, binary search trong prefix `[0,i)` để lấy `p[i]`, index cuối có `end <= start[i]`, hoặc `-1`.
3. `dp[0]=0`; với `i=1..n`, `take=job[i-1].Profit + dp[p[i-1]+1]`, `skip=dp[i-1]`, `dp[i]=max(skip,take)`.
4. Lưu `takeChosen[i]` hoặc recompute so sánh khi backtrack. Nếu take, append id và nhảy về `p+1`; nếu skip, giảm `i`. Reverse list id cuối.

State definition: `dp[i]` là profit tốt nhất chỉ dùng `i` job đầu theo end-time. Job cuối của nghiệm hoặc bị bỏ, hoặc được lấy và chỉ có thể ghép với optimum prefix kết thúc không muộn hơn start của nó. Đây là optimal substructure; không thể giải chỉ bằng greedy profit/finish.

Complexity `O(n log n)` time (`sort + n binary searches`), `O(n)` space. `long` cho profit/tổng; nếu profit âm, base 0 và `max` tự chọn rỗng.

Oracle:

```text
sample -> profit 120, ids [0,3]
[] -> 0, []
[(0,1,2,-5)] -> 0, []
[(0,1,2,5),(1,2,3,6)] -> 11, [0,1]
[(0,1,10,100),(1,1,5,60),(2,5,10,60)] -> 120, [1,2]
```

Điểm follow-up trọn khi schedule reconstruct thật sự non-overlap, profit khớp DP, id trả đúng record gốc và tie được xử lý nhất quán dù đề cho phép bất kỳ optimum.

## Diễn giải kết quả

- Đạt điểm cao một lần có thể do quen câu; hãy retest với input biến thể sau 7 ngày.
- “Mastered” yêu cầu giải thích proof/invariant, code lại từ trống và tự bắt edge case.
- Điểm mock thấp vì giao tiếp/clarification cần luyện khác với điểm thấp vì thuật toán; ghi đúng nhóm lỗi trong tracker để chọn bài ôn phù hợp.
- Các ngưỡng trong README là thước đo luyện tập nội bộ, không phải cam kết hoặc xác suất đậu một công ty.

---

# Đáp án Quiz 05 — Advanced Coverage Checkpoint

## AC01–AC12

| Câu | Đáp án | Giải thích |
|---|---|---|
| AC01 | B | Ghi `+delta` tại `left`, `-delta` sau `right`, rồi prefix một lần: `O(n+q)`. |
| AC02 | B | Phần tử nhỏ hơn/bằng ở phía sau không thể thắng phần tử mới trong bất kỳ window tương lai nào còn chứa cả hai; stale index được loại ở đầu deque. |
| AC03 | B | Với `[start,end)`, end tại `t` giải phóng tài nguyên trước start cũng tại `t`. |
| AC04 | C | Floyd–Warshall xử lý all-pairs và cạnh âm trong `O(V³)`, miễn không có negative cycle; graph dày `V=350` là quy mô hợp lý. |
| AC05 | B | Edge 0 không tăng distance nên neighbor vào đầu; edge 1 vào cuối deque. |
| AC06 | A | Fenwick chuẩn hỗ trợ point add và prefix sum `O(log n)`; range sum là hiệu hai prefix. |
| AC07 | B | Associativity cho phép ghép aggregate của các đoạn con theo cấu trúc cây mà không đổi kết quả. Commutativity/inverse không luôn cần. |
| AC08 | C | Nếu condensation graph còn directed cycle thì các component trên cycle thực ra mutually reachable và phải thuộc cùng một SCC. |
| AC09 | A | `low[v] > discovery[u]` nghĩa cây con `v` không có back-edge về `u` hay ancestor, nên bỏ `(u,v)` sẽ tách graph. |
| AC10 | C | 2-coloring thất bại đúng khi tồn tại odd cycle; graph không cần liên thông và có thể có even cycle. |
| AC11 | A | Composite `p·k < p²` có `k<p`, nên đã được một prime factor nhỏ hơn xử lý. |
| AC12 | B | Item thứ `i` thay reservoir với xác suất `1/i`; suy nạp cho thấy mỗi item cuối cùng có xác suất `1/n`. |

## AC13–AC20

### AC13

Dùng difference array length `n+1`: sau hai update là `[0,3,-2,0,-3,2]`. Prefix trên năm cell dữ liệu cho mảng cuối `[0,3,1,1,-2]`. Cell thứ sáu là sentinel kết thúc ảnh hưởng sau index cuối. Static prefix của mảng cuối là `[0,0,3,4,5,3]`; range `[1,4)` bằng `prefix[4]-prefix[1]=5`.

### AC14

Deque sau mỗi `right` (sau khi loại stale và dominated):

| right | deque index | maximum nếu window đủ |
|---:|---|---:|
| 0 | `[0]` | — |
| 1 | `[1]` | — |
| 2 | `[1,2]` | 3 |
| 3 | `[1,2,3]` | 3 |
| 4 | `[4]` | 5 |
| 5 | `[4,5]` | 5 |
| 6 | `[6]` | 6 |
| 7 | `[7]` | 7 |

Invariant: index tăng dần, mọi index thuộc window hiện tại, và giá trị giảm nghiêm ngặt nếu loại `<=` ở đuôi. Vì root/front luôn là candidate lớn nhất nên output là `[3,3,5,5,6,7]`. Mỗi index vào/ra nhiều nhất một lần: `O(n)`.

### AC15

`d[0,2] = min(10, 3+4) = 7`. Recurrence tại intermediate `k`:

`d[i,j] = min(d[i,j], d[i,k] + d[k,j])`.

Chỉ cộng nếu cả hai vế khác infinity. Sau đó dùng `checked(d[i,k] + d[k,j])` với miền trọng số đã được chứng minh, hoặc guard hai nhánh: nếu số hạng thứ hai dương thì kiểm tra overflow phía `long.MaxValue`, nếu âm thì kiểm tra underflow phía `long.MinValue`. Không tính `long.MaxValue - b` vô điều kiện vì chính phép trừ đó có thể overflow khi `b < 0`.

### AC16

Index ngoài `2` thành index trong `3`; các cell được cập nhật là `tree[3]`, `tree[4]`, `tree[8]`. Range nửa mở `[2,5)` là `PrefixSum(5) - PrefixSum(2)`.

### AC17

Với values `[10,20]`, caller muốn `[0,1)` nên đáp án là `10`; implementation inclusive đọc `[0,1]` thành `30`. Cách an toàn là dùng `[left,right)` nhất quán từ public API tới recursive/iterative query, hoặc adapter đổi thành `[left,right-1]` sau khi xử lý riêng range rỗng. Tên tham số `leftInclusive/rightExclusive` làm contract khó hiểu sai hơn.

### AC18

Chỉ `(1,3)` là bridge. Theo DFS `0→1→2`, back-edge `2→0` làm `low[2]=discovery[0]` và truyền để `low[1]=discovery[0]`; vì thế cạnh trong triangle không thỏa `low[child] > discovery[parent]`. Node `3` không có back-edge, nên `low[3]=discovery[3] > discovery[1]`.

### AC19

C# cho `-3 % 5 == -3`. Với `modulus > 0`, normalize an toàn bằng `long r = value % modulus; if (r < 0) r += modulus;`. Không dùng `((r + modulus) % modulus)` vô điều kiện vì `r + modulus` có thể overflow khi `r` đã dương và modulus gần `long.MaxValue`. Trong `(a*b)%modulus`, phép nhân diễn ra trước `%` và cũng có thể overflow; dùng `BigInteger`, modular multiplication an toàn, hoặc chứng minh bound của modulus/tích.

### AC20

Ví dụ: insert `A,B,C`, remove `A`; `C` được swap từ index 2 vào index 0 nhưng map vẫn ghi `C→2`. Remove `C` tiếp theo truy cập index ngoài mảng hoặc xóa sai. Invariant: với mọi `value`, `items[indexByValue[value]] == value`, và map/list chứa cùng tập. Trước `RemoveAt(last)`, nếu `i != last`, gán `items[i]=lastValue` và `indexByValue[lastValue]=i`; sau đó xóa key mục tiêu và phần tử cuối. Expected `O(1)`.

## AC21–AC24 — Chuẩn lời giải coding

Mỗi câu 11 điểm: contract/edge semantics 1; approach + invariant 2; C# compile và đúng 4; complexity 1; edge tests có oracle 2; giao tiếp/dry-run 1. Code sai trên một input hợp lệ không được quá 6/11; code không đạt constraint không nhận điểm approach tối ưu. Dùng hint phải đánh dấu `assisted` dù tổng điểm số vẫn được ghi để theo dõi.

### AC21. Range Addition

- Validate `length`, từng `Left/Right`; nếu length 0 thì chỉ chấp nhận updates rỗng.
- Tạo `long[length+1] diff`. Với mỗi update: `diff[left] += delta`; nếu `right+1 < length`, `diff[right+1] -= delta` (hoặc luôn ghi vào sentinel length).
- Prefix `running`, ghi output tại từng index.
- Invariant: trước index `i`, `running` là tổng delta của đúng các update đang phủ `i`.
- `O(length+q)` time, `O(length)` output và `O(length)` diff; có thể dùng output làm diff để giảm một allocation nhưng vẫn `O(length)`.
- Oracle: `length=5`, updates `(1,3,+3),(2,4,-2)` → `[0,3,1,1,-2]`; `length=0` + no updates → `[]`; full range `(0,2,long-compatible delta)` phải phủ đủ ba cell.

### AC22. Zero-One Shortest Paths

- `dist` là `long[]` infinity, source 0. Deque chứa `(node,queuedDistance)`; bỏ entry nếu distance không còn khớp.
- Relax edge như shortest path. Improved edge weight 0 dùng `AddFirst`, weight 1 dùng `AddLast`; reject weight ngoài `{0,1}`.
- Invariant: deque duy trì các candidate theo nondecreasing distance (chỉ có hai mức lân cận); khi xử lý entry hợp lệ nhỏ nhất, mọi đường ngắn hơn đã được xét.
- Standard 0–1 BFS đạt `O(V+E)` time và `O(V+E)` input/state; không dùng heap. Đánh dấu visited cứng lúc enqueue đầu tiên là sai vì node có thể được cải thiện qua edge 0.
- Oracle: `0→1(1), 0→2(0), 2→1(0)` cho `dist=[0,0,0]`; node cô lập giữ `long.MaxValue`.

### AC23. Mutable Range Sum

Với Fenwick:

- Array trong 1-based; `Add(index,delta)` đi `i += i & -i`.
- `Prefix(exclusiveEnd)` bắt đầu tại `i=exclusiveEnd`, đi `i -= i & -i`.
- `Sum(left,right) = Prefix(right)-Prefix(left)`; validate `0 <= left <= right <= length`.
- Invariant: `tree[i]` là tổng block kết thúc tại `i` có kích thước `lowbit(i)`.
- Mỗi operation `O(log n)`, memory `O(n)`. Length 0 cho phép `Sum(0,0)=0` nhưng không cho update.
- Oracle length 4: `Add(0,5)`, `Add(2,-1)` → `Sum(0,4)=4`, `Sum(1,3)=-1`; `Add(0,2)` tiếp → full sum `6`.

Segment Tree được chấm tương đương nếu leaf chứa value, parent là tổng hai con, point set recompute lên root và query nửa mở ghép đúng các node phủ range.

### AC24. Critical Connections

- Build undirected adjacency list. Duyệt DFS từ **mọi** node chưa thăm.
- Khi vào `u`, đặt `discovery[u]=low[u]=timer++`. Với tree edge `u→v`, DFS rồi `low[u]=min(low[u],low[v])`; nếu `low[v] > discovery[u]`, ghi bridge. Với back-edge không phải parent, `low[u]=min(low[u],discovery[v])`.
- Normalize mỗi bridge `(min,max)` và sort output lexicographic.
- Invariant: sau khi xử lý subtree `u`, `low[u]` là discovery nhỏ nhất reachable từ subtree bằng tree edges cộng tối đa một back-edge.
- `O(V+E)` traversal, `O(V+E)` graph/state, cộng `O(B log B)` để sort `B` bridge. Recursive sample cần cảnh báo stack overflow ở graph sâu; iterative DFS phải mô phỏng exit event để update low.
- Oracle: triangle `0-1-2-0` cộng `1-3` → `[(1,3)]`; disconnected với thêm edge `4-5` → `[(1,3),(4,5)]`; graph không edge → `[]`.

Ngưỡng: `<80` quay lại lesson liên quan; `80–89` sửa error log rồi retest trong 48 giờ; `>=90` chỉ được công nhận khi AC21–AC24 đều có code compile đúng và retest sau ít nhất 7 ngày vẫn đạt.

## CG01–CG03 — Cổng phủ bắt buộc

### CG01. Static Prefix Sum

Prefix length 6 là `[0,-2,2,3,0,5]`. Tổng `[1,4)` bằng `prefix[4]-prefix[1]=0-(-2)=2`, tương ứng `4+1-3`. Build `O(n)` time/space, mỗi range query `O(1)`. Dùng `long` khi tổng nhiều `int` có thể vượt biên.

### CG02. Grid DP

`dp[r,c]` là minimum cost từ `(0,0)` tới `(r,c)`, có gồm cost cell hiện tại. Base `dp[0,0]=grid[0,0]`; hàng đầu chỉ đến từ trái, cột đầu chỉ đến từ trên. Với cell còn lại:

`dp[r,c] = grid[r,c] + min(dp[r-1,c], dp[r,c-1])`.

Bảng cost tối ưu là `[[1,4,5],[2,7,6],[6,8,7]]`, nên đáp án `7`. Khi dùng một hàng, duyệt cột **trái sang phải**: `dp[c]` trước update là giá trị từ trên, còn `dp[c-1]` đã update là giá trị từ trái. Time `O(rows·cols)`, memory `O(cols)`.

### CG03. GCD và Fast Power

Euclid: `(84,30)→(30,24)→(24,6)→(6,0)`, nên gcd là `6`. Công thức giảm overflow là `lcm(a,b)=abs(a/gcd(a,b) * b)`, vẫn cần kiểm tra tích/`long.MinValue`. Binary exponentiation cho `13=1101₂`; bình phương base và nhân result tại bit 1 cho `3^13 mod 100 = 23`. Time `O(log exponent)`. `a*b` có thể overflow trước `%`, nên cần bound, `checked`/`BigInteger` hoặc modular multiplication an toàn tùy contract.

Quiz 05 chỉ được đánh dấu đạt khi tổng điểm thỏa ngưỡng **và** CG01–CG03 đúng 3/3.
