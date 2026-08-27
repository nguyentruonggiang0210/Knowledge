# Ma trận Lesson → Quiz

Dùng bảng này để chọn đúng câu kiểm tra sau mỗi lesson. Mã `M1..M4` là mock interview trong `04-big-tech-mock-interview.md`; mã `AC` nằm trong advanced checkpoint. Một số câu cố ý kiểm tra nhiều pattern cùng lúc.

| Lesson | Câu kiểm tra chính | Câu follow-up / mock |
|---|---|---|
| 01. Big-O | F01–F03, F12 | Rubric complexity của mọi bài code |
| 02. Array/String/Two Pointers | F04–F05, F16 | F25 |
| 03. Sliding Window | F06, F18 | F25 |
| 04. Prefix/Difference Array | AC01, AC13, CG01 | AC21 |
| 05. Hash Table/Counting | F03, F17 | F25–F26, TG27 |
| 06. Stack/Monotonic Stack | F08, F20 | F09 để so sánh stack/queue |
| 07. Queue/Deque/Monotonic Queue | F09, AC02, AC14 | TG21, AC22 |
| 08. Linked List/Fast-Slow | F07, F19 | F26 |
| 09. Binary Search | F10, F21 | F27, DA24, DA31 |
| 10. Sorting | F11–F12, F22 | F28, M1 |
| 11. Intervals/Sweep Line | F14, F28, AC03 | M1 |
| 12. Recursion/Divide & Conquer | DA01, F22 | Rubric recursion/correctness của DA27 |
| 13. Backtracking | DA02–DA03, DA17–DA18 | DA27 |
| 14. Binary Tree DFS/BFS | TG01, TG16–TG17 | TG25 |
| 15. BST | TG02–TG03, TG18 | TG25 |
| 16. Trie | TG04, TG20 | TG26 |
| 17. Heap/Priority Queue | TG05–TG06, TG19 | TG27, M1 |
| 18. Graph DFS/BFS/Grid | TG07, TG15, TG21 | TG28, M2 |
| 19. Topological Sort | TG08–TG09, TG22–TG23 | TG29 |
| 20. Union-Find | TG10, TG24 | TG13/Kruskal để thấy DSU làm subroutine |
| 21. Dijkstra/Shortest Path | TG11 | TG30, M3 |
| 22. Bellman-Ford/Floyd-Warshall | TG12, AC04, AC15 | M3 để so sánh thuật toán |
| 23. Minimum Spanning Tree | TG13–TG14, TG24 | TG31 |
| 24. Greedy | DA04–DA05, DA19–DA20 | DA28, M1 |
| 25. DP 1D | DA07, DA21 | DA28–DA29 |
| 26. DP Grid/2D | CG02 | DA11–DA12, DA25 để chuyển state 2D sang string |
| 27. Knapsack/Subset Sum | DA06, DA08–DA09, DA22–DA23 | DA30 |
| 28. LIS | DA10, DA24 | DA31 |
| 29. Kadane | F15, F23, DA13 | Biến thể trong answer key |
| 30. Bit Manipulation | F13, F24, DA16 | Bitmask follow-up của DA17 |
| 31. KMP/Rabin–Karp | DA14–DA15, DA26 | DA32 |
| 32. Fenwick/Segment Tree | AC06–AC07, AC16–AC17 | AC23 |
| 33. DP trên String | DA11–DA12, DA25 | DA29 |
| 34. SCC/Bridge/Bipartite | AC08–AC10, AC18 | AC24 |
| 35. Math/Number Theory | AC11, AC19, CG03 | Overflow/modulo follow-up trong đáp án |
| 36. Data Structure Design | F20, F26, AC12, AC20 | Mock follow-up và rubric invariant |

## Quy tắc retest

- Sai câu nhận diện: đọc lại “Dấu hiệu nhận diện/Khi dùng” rồi làm một đề lạ cùng pattern.
- Sai trace/invariant: tự vẽ state từng bước, không chỉ đọc đáp án.
- Sai code: lưu test làm lộ bug vào `progress-tracker.md`, code lại từ đầu sau 24 giờ và 7 ngày.
- Một lesson chỉ được đánh dấu vững khi câu chính đạt ≥90% và ít nhất một bài code/follow-up được giải closed-book. Riêng `CG01–CG03` là pass/fail bắt buộc, không bị điểm mạnh ở chủ đề khác bù trừ.
