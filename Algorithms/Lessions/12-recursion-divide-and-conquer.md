# 12. Recursion và Divide & Conquer

## Mục tiêu

- Thiết kế hàm đệ quy bằng trạng thái, base case và bước thu nhỏ.
- Hiểu call stack và tránh đệ quy vô hạn/stack overflow.
- Áp dụng divide & conquer cho merge sort, quickselect và bài toán cây.

## Mô hình tư duy

Trước khi code, trả lời ba câu:

1. Hàm `Solve(state)` cam kết trả về gì?
2. State nhỏ nhất trả lời trực tiếp được là gì?
3. Mỗi lời gọi có tiến gần base case không?

Divide & conquer có ba pha: **divide** thành bài con độc lập, **conquer** các bài con, **combine** kết quả. Recurrence thường được phân tích bằng recursion tree hoặc Master Theorem.

## C# 12 sample: merge sort

```csharp
using System;

public static class DivideAndConquer
{
    public static void MergeSort(int[] values)
    {
        if (values.Length < 2) return;
        int[] buffer = new int[values.Length];
        Sort(values, buffer, 0, values.Length - 1);
    }

    private static void Sort(int[] a, int[] buffer, int left, int right)
    {
        if (left >= right) return;

        int middle = left + (right - left) / 2;
        Sort(a, buffer, left, middle);
        Sort(a, buffer, middle + 1, right);
        Merge(a, buffer, left, middle, right);
    }

    private static void Merge(int[] a, int[] buffer, int left, int middle, int right)
    {
        int i = left, j = middle + 1, write = left;
        while (i <= middle && j <= right)
            buffer[write++] = a[i] <= a[j] ? a[i++] : a[j++];
        while (i <= middle) buffer[write++] = a[i++];
        while (j <= right) buffer[write++] = a[j++];
        for (int k = left; k <= right; k++) a[k] = buffer[k];
    }
}
```

## Dry run và recurrence

`[4,1,3,2]` được chia thành `[4,1]` và `[3,2]`, rồi thành bốn mảng một phần tử. Khi combine: `[1,4]`, `[2,3]`, cuối cùng `[1,2,3,4]`.

`T(n) = 2T(n/2) + O(n) = O(n log n)`. Buffer dùng `O(n)`; call stack sâu `O(log n)`.

## Khi dùng

- Hai nửa/bài con gần độc lập và combine rẻ.
- Cấu trúc tự nhiên là cây.
- Cần tìm kiếm trên không gian bằng cách loại bỏ một phần lớn (binary search, quickselect).

## Ứng dụng thực tế

- Parallel processing trên các shard dữ liệu.
- Sort tập dữ liệu lớn, render theo cây scene graph.
- Spatial indexes, image processing theo vùng.

## Lỗi thường gặp

- Base case không bao phủ input rỗng.
- State không nhỏ đi.
- Cấp phát mảng con ở mọi call làm tăng GC; dùng buffer chung.
- Dùng đệ quy sâu `O(n)` với input đối nghịch; cân nhắc vòng lặp hoặc explicit stack.

## Câu hỏi phỏng vấn

1. Tính lũy thừa nhanh `x^n` trong `O(log n)`.
2. Count inversions bằng merge sort.
3. Quickselect tìm phần tử lớn thứ `k`.
4. Phân tích `T(n)=3T(n/2)+O(n)`.

## Checklist

- [ ] Viết rõ contract và base case.
- [ ] Vẽ được recursion tree.
- [ ] Tách time complexity khỏi stack space.
- [ ] Biết khi nào chuyển sang iterative.

