# 36. Thiết kế Data Structure trong phỏng vấn

## Mục tiêu

- Ghép nhiều cấu trúc để đạt contract thời gian yêu cầu.
- Thiết kế LRU Cache `O(1)` average cho get/put.
- Rèn invariant cho MinStack, RandomizedSet, MedianFinder và reservoir sampling.

## Phương pháp

1. Liệt kê operations và complexity target.
2. Chọn cấu trúc cho từng operation.
3. Xác định dữ liệu phải đồng bộ giữa chúng.
4. Viết invariant và xử lý capacity/duplicate/missing.
5. Nêu thread-safety chỉ khi được yêu cầu; code phỏng vấn thường single-threaded.

## LRU: vì sao cần hai cấu trúc?

- Dictionary: key → node để lookup `O(1)` average.
- Doubly linked list: most-recent ở đầu, least-recent ở cuối; remove/move node đã biết trong `O(1)`.

## C# 12 sample: LRU Cache

```csharp
using System;
using System.Collections.Generic;

public sealed class LruCache<TKey, TValue> where TKey : notnull
{
    private sealed class Node(TKey key, TValue value)
    {
        public TKey Key { get; } = key;
        public TValue Value { get; set; } = value;
        public Node? Previous { get; set; }
        public Node? Next { get; set; }
    }

    private readonly int _capacity;
    private readonly Dictionary<TKey, Node> _nodes = new();
    private readonly Node _head = new(default!, default!); // Sentinel MRU side.
    private readonly Node _tail = new(default!, default!); // Sentinel LRU side.

    public LruCache(int capacity)
    {
        if (capacity <= 0) throw new ArgumentOutOfRangeException(nameof(capacity));
        _capacity = capacity;
        _head.Next = _tail;
        _tail.Previous = _head;
    }

    public bool TryGet(TKey key, out TValue value)
    {
        if (!_nodes.TryGetValue(key, out Node? node))
        {
            value = default!;
            return false;
        }
        MoveToFront(node);
        value = node.Value;
        return true;
    }

    public void Put(TKey key, TValue value)
    {
        if (_nodes.TryGetValue(key, out Node? existing))
        {
            existing.Value = value;
            MoveToFront(existing);
            return;
        }

        var node = new Node(key, value);
        _nodes[key] = node;
        AddAfterHead(node);

        if (_nodes.Count <= _capacity) return;
        Node victim = _tail.Previous!;
        Remove(victim);
        _nodes.Remove(victim.Key);
    }

    private void MoveToFront(Node node) { Remove(node); AddAfterHead(node); }

    private void AddAfterHead(Node node)
    {
        node.Previous = _head;
        node.Next = _head.Next;
        _head.Next!.Previous = node;
        _head.Next = node;
    }

    private static void Remove(Node node)
    {
        node.Previous!.Next = node.Next;
        node.Next!.Previous = node.Previous;
    }
}
```

## Dry run

Capacity 2: `Put(A,1), Put(B,2), Get(A), Put(C,3)`. Sau `Get(A)`, A là MRU và B là LRU; thêm C loại B. Dictionary và linked list phải luôn chứa đúng cùng tập key.

## Các design pattern khác

- **MinStack:** mỗi entry lưu `(value,minSoFar)` → push/pop/top/min `O(1)`.
- **RandomizedSet:** dictionary value→index + dynamic array; remove bằng swap-with-last → expected `O(1)`.
- **MedianFinder:** max-heap nửa nhỏ + min-heap nửa lớn.
- **Reservoir sampling k=1:** item thứ `i` thay reservoir với xác suất `1/i`, cho uniform sample khi không biết stream length.

## C# 12 sample: MinStack, RandomizedSet và reservoir sampling

Ba class nằm chung một block chạy độc lập. `Random` được inject để test có thể tái lập; production không nên dùng `System.Random` cho mục đích bảo mật.

```csharp
#nullable enable
using System;
using System.Collections.Generic;

public sealed class MinStack
{
    private readonly Stack<(int Value, int Minimum)> _entries = new();

    public int Count => _entries.Count;

    public void Push(int value)
    {
        int minimum = _entries.Count == 0
            ? value
            : Math.Min(value, _entries.Peek().Minimum);
        _entries.Push((value, minimum));
    }

    public int Pop()
    {
        EnsureNotEmpty();
        return _entries.Pop().Value;
    }

    public int Top()
    {
        EnsureNotEmpty();
        return _entries.Peek().Value;
    }

    public int Minimum()
    {
        EnsureNotEmpty();
        return _entries.Peek().Minimum;
    }

    private void EnsureNotEmpty()
    {
        if (_entries.Count == 0)
        {
            throw new InvalidOperationException("Stack đang rỗng.");
        }
    }
}

public sealed class RandomizedSet
{
    private readonly Dictionary<int, int> _indexByValue = new();
    private readonly List<int> _values = new();
    private readonly Random _random;

    public RandomizedSet(Random? random = null)
    {
        _random = random ?? Random.Shared;
    }

    public int Count => _values.Count;

    public bool Insert(int value)
    {
        if (_indexByValue.ContainsKey(value))
        {
            return false;
        }

        _indexByValue[value] = _values.Count;
        _values.Add(value);
        return true;
    }

    public bool Remove(int value)
    {
        if (!_indexByValue.TryGetValue(value, out int index))
        {
            return false;
        }

        int lastIndex = _values.Count - 1;
        int lastValue = _values[lastIndex];

        if (index != lastIndex)
        {
            _values[index] = lastValue;
            _indexByValue[lastValue] = index;
        }

        _values.RemoveAt(lastIndex);
        _indexByValue.Remove(value);
        return true;
    }

    public int GetRandom()
    {
        if (_values.Count == 0)
        {
            throw new InvalidOperationException("Set đang rỗng.");
        }

        return _values[_random.Next(_values.Count)];
    }
}

public sealed class MedianFinder
{
    // _lower là max-heap nhờ priority = -(long)value; _upper là min-heap.
    private readonly PriorityQueue<int, long> _lower = new();
    private readonly PriorityQueue<int, long> _upper = new();

    public void Add(int value)
    {
        if (_lower.Count == 0 || value <= _lower.Peek())
            _lower.Enqueue(value, -(long)value);
        else
            _upper.Enqueue(value, value);

        if (_lower.Count > _upper.Count + 1)
        {
            int moved = _lower.Dequeue();
            _upper.Enqueue(moved, moved);
        }
        else if (_upper.Count > _lower.Count)
        {
            int moved = _upper.Dequeue();
            _lower.Enqueue(moved, -(long)moved);
        }
    }

    public double Median()
    {
        if (_lower.Count == 0)
            throw new InvalidOperationException("No values have been added.");
        if (_lower.Count != _upper.Count) return _lower.Peek();
        return ((long)_lower.Peek() + _upper.Peek()) / 2.0;
    }
}

public static class ReservoirSampling
{
    // Chọn đều một item từ stream một-pass có độ dài chưa biết trước.
    public static T SampleOne<T>(IEnumerable<T> source, Random? random = null)
    {
        ArgumentNullException.ThrowIfNull(source);
        Random generator = random ?? Random.Shared;

        using IEnumerator<T> enumerator = source.GetEnumerator();
        if (!enumerator.MoveNext())
        {
            throw new ArgumentException("Stream phải có ít nhất một item.", nameof(source));
        }

        T selected = enumerator.Current;
        long seen = 1;

        while (enumerator.MoveNext())
        {
            seen = checked(seen + 1);
            if (generator.NextInt64(seen) == 0)
            {
                selected = enumerator.Current;
            }
        }

        return selected;
    }
}

public static class Program
{
    public static void Main()
    {
        var minStack = new MinStack();
        minStack.Push(5);
        minStack.Push(2);
        minStack.Push(2);
        minStack.Push(7);
        Console.WriteLine(minStack.Minimum()); // 2
        minStack.Pop();
        minStack.Pop();
        Console.WriteLine(minStack.Minimum()); // Vẫn là 2

        var set = new RandomizedSet(new Random(42));
        Console.WriteLine(set.Insert(10)); // True
        Console.WriteLine(set.Insert(20)); // True
        Console.WriteLine(set.Remove(10)); // True
        Console.WriteLine(set.GetRandom()); // 20

        var median = new MedianFinder();
        median.Add(1);
        median.Add(5);
        median.Add(2);
        Console.WriteLine(median.Median()); // 2

        int sample = ReservoirSampling.SampleOne(
            new[] { 10, 20, 30, 40 },
            new Random(7));
        Console.WriteLine(sample); // Một item trong stream.
    }
}
```

### Invariant cần nói trong phỏng vấn

- **MinStack:** minimum ở entry trên cùng là min của toàn bộ stack từ đáy đến entry đó. Lưu minimum cho từng entry xử lý đúng cả duplicate min.
- **RandomizedSet:** `_indexByValue[value]` luôn trỏ đúng vị trí của value trong `_values`; swap phần tử cuối vào lỗ trống trước khi `RemoveAt` giữ xóa ở cuối `O(1)`.
- **MedianFinder:** mọi phần tử ở max-heap `_lower` không lớn hơn mọi phần tử ở min-heap `_upper`; `_lower.Count` bằng `_upper.Count` hoặc lớn hơn đúng 1.
- **Reservoir k=1:** khi đã xem `i` item, mỗi item có xác suất `1/i` nằm trong reservoir. Item cũ sống qua bước `i` với xác suất `(i-1)/i`, nên xác suất mới là `1/(i-1) × (i-1)/i = 1/i`.

## Độ phức tạp

| Cấu trúc/thao tác | Thời gian | Bộ nhớ |
|---|---:|---:|
| LRU get/put | Expected `O(1)` | `O(capacity)` |
| MinStack push/pop/top/min | `O(1)` | `O(n)` |
| RandomizedSet insert/remove/getRandom | Expected `O(1)` | `O(n)` |
| MedianFinder add / median | `O(log n)` / `O(1)` | `O(n)` |
| Reservoir sampling k=1 trên `n` item | `O(n)` tổng, `O(1)` mỗi item | `O(1)` |

Expected `O(1)` của LRU/RandomizedSet đến từ hash table, không phải worst-case tuyệt đối. Các sample đều single-threaded.

## Ứng dụng thực tế

- LRU cho cache có giới hạn bộ nhớ (production còn TTL, size-bytes, concurrency, metrics).
- RandomizedSet cho sampling active IDs.
- Reservoir sampling trên stream không thể giữ toàn bộ.
- MedianFinder cho telemetry online.

## Lỗi thường gặp

- Chỉ dùng queue/list khiến lookup/remove `O(n)`.
- Evict list nhưng quên xóa dictionary hoặc ngược lại.
- Update key cũ mà không đưa lên MRU.
- MinStack chỉ lưu một biến min nhưng không phục hồi đúng min cũ sau `Pop`, hoặc xử lý sai duplicate minimum.
- RandomizedSet swap-with-last nhưng quên cập nhật index của `lastValue` trong dictionary.
- `GetRandom` trên set rỗng mà không có contract rõ ràng.
- MedianFinder không cân bằng hai heap, dùng `int` khi cộng hai middle value, hoặc mô phỏng max-heap bằng `-int.MinValue` và bị overflow.
- Reservoir sampling dùng xác suất cố định thay vì `1/i`, hoặc gọi `Count()` khiến stream bị duyệt trước/không còn one-pass.
- Tự nhận thread-safe khi chưa khóa cả invariant liên cấu trúc.

## Câu hỏi phỏng vấn

1. LRU Cache, rồi thêm TTL hoặc capacity theo bytes.
2. LFU Cache.
3. Insert Delete GetRandom O(1).
4. Serialize access nếu nhiều thread cùng dùng cache.

## Checklist

- [ ] Bắt đầu từ operation contract.
- [ ] Nêu invariant giữa các cấu trúc.
- [ ] Test capacity 1, update key cũ, miss và eviction.
- [ ] Phân biệt average-case, worst-case và thread-safety.
