# 08. Linked List và Fast/Slow Pointers

## Mục tiêu

- Hiểu trade-off của singly linked list so với array.
- Thao tác con trỏ an toàn, tránh mất phần còn lại của danh sách.
- Dùng fast/slow pointers để tìm giữa, phát hiện cycle và tìm điểm bắt đầu cycle.
- Trình bày được invariant và lập luận của Floyd's cycle detection.

## Trực giác

Mỗi node của singly linked list chứa giá trị và tham chiếu đến node kế tiếp. Truy cập node thứ `i` là `O(i)`, nhưng chèn/xóa sau một node đã biết là `O(1)`. So với array, linked list có thêm overhead tham chiếu, locality cache kém và không truy cập ngẫu nhiên `O(1)`.

Kỹ thuật fast/slow cho hai con trỏ xuất phát từ head:

- `slow` đi 1 cạnh mỗi bước;
- `fast` đi 2 cạnh mỗi bước.

Nếu không có cycle, `fast` chạm `null`. Nếu có cycle, khoảng cách tương đối trong vòng thay đổi 1 mỗi bước, nên `fast` cuối cùng gặp `slow`.

Kỹ thuật này đạt `O(n)` time, `O(1)` space, không cần `HashSet<Node>`.

## Khi dùng / dấu hiệu nhận diện

- Tìm middle node trong một lần duyệt.
- Phát hiện linked list có cycle và tìm cycle entry.
- Tìm phần tử thứ `k` từ cuối: hai con trỏ cách nhau `k` bước.
- Kiểm tra palindrome linked list: tìm giữa, reverse nửa sau, so sánh.
- Reorder list, split list.
- Bài toán trạng thái lặp `next(x)` như Happy Number cũng dùng Floyd.

Với bài cần biết node đã thăm cụ thể và bộ nhớ không bị hạn chế, hash set có thể dễ hiểu hơn; Floyd nổi bật khi yêu cầu `O(1)` auxiliary space.

## Thuật toán từng bước: tìm middle

1. `slow = head`, `fast = head`.
2. Trong khi `fast != null` và `fast.Next != null`, cho `slow` đi 1, `fast` đi 2.
3. Khi dừng, `slow` ở giữa.
4. Với số node chẵn, phiên bản này trả **middle thứ hai**. Nếu đề muốn middle thứ nhất, điều kiện/khởi tạo phải đổi.

## Thuật toán từng bước: phát hiện và tìm đầu cycle

### Pha 1: tìm điểm gặp

1. Cho slow đi 1, fast đi 2.
2. Nếu fast hoặc `fast.Next` là `null`, không có cycle.
3. Nếu slow và fast là **cùng object node**, đã gặp trong cycle.

### Pha 2: tìm cycle entry

1. Đặt một con trỏ `fromHead` về head; giữ con trỏ kia tại điểm gặp.
2. Mỗi bước, cho cả hai đi 1 cạnh.
3. Node đầu tiên chúng gặp nhau là cycle entry.

### Vì sao pha 2 đúng?

Gọi `a` là khoảng từ head đến entry, `b` từ entry đến điểm gặp, `L` là độ dài cycle. Tại điểm gặp, fast đi gấp đôi slow nên quãng chênh là bội của `L`, suy ra `a` đồng dư với `L - b` theo modulo `L`. Vì vậy đi `a` bước từ head và từ điểm gặp sẽ cùng đến entry.

## Độ phức tạp

| Thao tác | Thời gian | Bộ nhớ phụ |
|---|---:|---:|
| Tìm middle | `O(n)` | `O(1)` |
| Phát hiện cycle (Floyd) | `O(n)` | `O(1)` |
| Tìm cycle entry | `O(n)` | `O(1)` |
| Phát hiện bằng HashSet | trung bình `O(n)` | `O(n)` |

## C# 12 sample hoàn chỉnh

```csharp
using System;

public sealed class ListNode
{
    public int Value { get; }
    public ListNode? Next { get; set; }

    public ListNode(int value)
    {
        Value = value;
    }
}

public static class LinkedListAlgorithms
{
    // Với số node chẵn, trả middle thứ hai.
    public static ListNode? FindMiddle(ListNode? head)
    {
        ListNode? slow = head;
        ListNode? fast = head;

        while (fast is not null && fast.Next is not null)
        {
            slow = slow!.Next;
            fast = fast.Next.Next;
        }

        return slow;
    }

    public static bool HasCycle(ListNode? head)
    {
        return FindMeetingNode(head) is not null;
    }

    public static ListNode? FindCycleStart(ListNode? head)
    {
        ListNode? meeting = FindMeetingNode(head);
        if (meeting is null)
        {
            return null;
        }

        ListNode? fromHead = head;
        while (!ReferenceEquals(fromHead, meeting))
        {
            fromHead = fromHead!.Next;
            meeting = meeting!.Next;
        }

        return fromHead;
    }

    private static ListNode? FindMeetingNode(ListNode? head)
    {
        ListNode? slow = head;
        ListNode? fast = head;

        while (fast is not null && fast.Next is not null)
        {
            slow = slow!.Next;
            fast = fast.Next.Next;

            if (ReferenceEquals(slow, fast))
            {
                return slow;
            }
        }

        return null;
    }
}

public static class Program
{
    public static void Main()
    {
        var one = new ListNode(1);
        var two = new ListNode(2);
        var three = new ListNode(3);
        var four = new ListNode(4);
        var five = new ListNode(5);
        one.Next = two;
        two.Next = three;
        three.Next = four;
        four.Next = five;

        Console.WriteLine(LinkedListAlgorithms.FindMiddle(one)?.Value); // 3
        Console.WriteLine(LinkedListAlgorithms.HasCycle(one));          // False

        five.Next = three; // Tạo cycle: 3 -> 4 -> 5 -> 3.
        Console.WriteLine(LinkedListAlgorithms.HasCycle(one));          // True
        Console.WriteLine(LinkedListAlgorithms.FindCycleStart(one)?.Value); // 3
    }
}
```

## Dry run: cycle `1 -> 2 -> 3 -> 4 -> 5 -> 3`

Sau mỗi iteration của pha 1:

| Bước | Slow | Fast | Ghi chú |
|---:|---:|---:|---|
| 1 | 2 | 3 | Chưa gặp |
| 2 | 3 | 5 | Chưa gặp |
| 3 | 4 | 4 | Gặp trong cycle |

Pha 2: con trỏ A về node 1, con trỏ B ở node 4.

| Bước | A từ head | B từ điểm gặp |
|---:|---:|---:|
| 0 | 1 | 4 |
| 1 | 2 | 5 |
| 2 | 3 | 3 |

Hai con trỏ gặp tại node 3, chính là cycle entry.

## Kỹ thuật con trỏ an toàn

Khi reverse list, luôn lưu `next = current.Next` **trước** khi đổi `current.Next`; nếu không sẽ mất phần chưa duyệt. Khi xóa node sau `previous`, nối `previous.Next = previous.Next?.Next`.

Trong C#, so sánh identity của node bằng `ReferenceEquals` là rõ nghĩa. Nếu class sau này override value equality, dùng `==` có thể không còn thể hiện “cùng node”.

## Lỗi thường gặp

- Điều kiện chỉ kiểm tra `fast != null` rồi truy cập `fast.Next.Next`, gây null dereference.
- So sánh `node.Value` thay vì identity; hai node khác nhau có thể cùng giá trị.
- Không chốt middle thứ nhất hay thứ hai cho độ dài chẵn.
- Sau khi slow/fast gặp, trả luôn điểm gặp như cycle entry; hai node này không nhất thiết trùng.
- Duyệt/print list có cycle mà không giới hạn, gây vòng lặp vô hạn.
- Thay đổi `Next` trước khi lưu node kế tiếp lúc reverse.
- Dùng dummy node nhưng trả sai `dummy` thay vì `dummy.Next`.
- Cho rằng linked list luôn tốt hơn array khi chèn: tìm vị trí vẫn `O(n)` nếu chưa có node reference.

## Ứng dụng thực tế

- Chuỗi node nội bộ của LRU cache khi kết hợp với hash map.
- Free list, intrusive list và một số cấu trúc memory allocator.
- Phát hiện chu kỳ trong quá trình lặp trạng thái không muốn lưu lịch sử.
- Tortoise-and-hare cho sequence sinh bởi hàm deterministic.
- Thao tác splice/reorder khi đã có reference đến node.

Trong code business C#, `List<T>` thường thực dụng hơn linked list vì cache locality và API. Linked list vẫn rất quan trọng trong phỏng vấn để kiểm tra reasoning về reference, invariant và edge case.

## Câu hỏi phỏng vấn tự luyện

1. Reverse Linked List iterative và recursive.
2. Merge Two Sorted Lists.
3. Remove Nth Node From End bằng khoảng cách hai con trỏ.
4. Linked List Cycle II.
5. Palindrome Linked List với `O(1)` extra space; có cần restore list không?
6. Reorder List.
7. Intersection of Two Linked Lists.
8. Copy List with Random Pointer.

## Checklist

- [ ] Tôi xử lý đúng head null, một node và hai node.
- [ ] Tôi kiểm tra cả `fast` lẫn `fast.Next` trước bước nhảy đôi.
- [ ] Tôi so sánh node identity, không so sánh value.
- [ ] Tôi nói rõ quy ước middle cho độ dài chẵn.
- [ ] Tôi giải thích được hai pha của Floyd và ý tưởng chứng minh.
- [ ] Tôi lưu `next` trước khi đổi liên kết.
- [ ] Tôi không vô tình duyệt vô hạn một list có cycle.
- [ ] Tôi biết linked list có locality kém và random access `O(n)`.
