# Bài 03 — Generics, variance và Collections

## Đích học

Nắm type erasure, invariant generic, PECS và chọn collection đúng theo semantics/performance.

## Khác biệt cốt lõi

C# generics thường reified ở runtime và có declaration-site variance (`out T`, `in T`). Java generic chủ yếu bị **type erasure**, dùng use-site wildcard:

- Producer: `List<? extends T>` — đọc `T`, không thêm giá trị cụ thể.
- Consumer: `List<? super T>` — thêm `T`, khi đọc chỉ chắc là `Object`.
- Nhớ **PECS: Producer Extends, Consumer Super**.

`List<Integer>` không phải subtype của `List<Number>`. Generic Java không nhận primitive (`List<int>` sai). Tránh raw type vì nó vô hiệu hóa type safety.

## Chọn collection

| Nhu cầu | Java | C# tương ứng |
|---|---|---|
| truy cập tuần tự/ngẫu nhiên phổ biến | `ArrayList` | `List<T>` |
| unique, không cần thứ tự | `HashSet` | `HashSet<T>` |
| key/value | `HashMap` | `Dictionary<TKey,TValue>` |
| giữ insertion order | `LinkedHashMap/Set` | cần collection phù hợp/thứ tự hiện đại |
| sorted | `TreeMap/Set` | `SortedDictionary/SortedSet` |
| concurrent atomic map ops | `ConcurrentHashMap` | `ConcurrentDictionary` |

Độ phức tạp trung bình O(1) không thay thế semantics. `LinkedList` hiếm khi nhanh hơn `ArrayList` trong code thật do cache locality và allocation. API trả collection nên cân nhắc `List.copyOf`; `Collections.unmodifiableList` chỉ là view, underlying list vẫn đổi được.

### Internals senior phải nắm

- Erasure xóa phần lớn type argument runtime; compiler chèn cast và có thể sinh **bridge method** để giữ override. `List<String>` là non-reifiable: không `instanceof List<String>` hay tạo generic array an toàn.
- `HashMap` dùng hash/bucket, resize theo capacity/load factor và có thể treeify collision bucket; average O(1) không phải worst-case guarantee. Mutable key/comparator sai contract phá lookup/set semantics.
- `TreeSet/TreeMap` coi comparator trả 0 là cùng key, kể cả `equals` false. Comparator phải transitive và lý tưởng “consistent with equals”.
- `subList`, `keySet`, `entrySet` là backed view; thay đổi structural không đúng chỗ có thể phản ánh hoặc gây `ConcurrentModificationException`.
- Fail-fast iterator là best-effort bug detector, không phải synchronization. `ConcurrentHashMap` atomic theo operation; sequence `get → decide → put` vẫn race nếu không dùng atomic method/lock.
- `ArrayDeque` thường là stack/queue mặc định; `PriorityQueue` cho top-K/scheduling; `EnumMap/EnumSet` gọn cho enum; `CopyOnWriteArrayList` chỉ hợp read-dominant/listener nhỏ.

Lab nâng cao: forced hash collision, comparator trả 0 cho object không equals, mutate `subList`, và so `computeIfAbsent` với check-then-put concurrent.

### SQL connection

`Map<CustomerId, List<Order>>` giống `GROUP BY`, nhưng đẩy aggregate/filter xuống database khi dataset lớn để giảm I/O và memory. Collection xử lý in-memory sau khi query đã thu hẹp dữ liệu.

## Thực hành

[Java sample](../SourceSamples/03-generics-collections/src/main/java/course/collections/CollectionsDemo.java) · [C# mapping](../SourceSamples/03-generics-collections/csharp/Program.cs)

Viết generic method copy từ list subtype sang list base theo PECS; test với `Integer → Number`.

## Quiz

1. Vì sao không tạo được `new T()` một cách tổng quát trong Java?
2. `? extends T` có add `T` được không?
3. `unmodifiableList` và `copyOf` khác gì?
4. Vì sao `LinkedList` không mặc định tốt cho insert/delete?

<details><summary>Đáp án</summary>

1. Type erasure làm runtime không biết concrete `T`; truyền factory/`Class<T>` khi cần.
2. Không (ngoài null), vì concrete subtype có thể hẹp hơn T.
3. Cái đầu là read-only view; cái sau tạo snapshot bất biến nông.
4. Tìm vị trí vẫn O(n), mỗi node allocation và locality kém.
</details>
