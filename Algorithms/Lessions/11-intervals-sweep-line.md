# 11. Intervals và Sweep Line

## Mục tiêu

- Chuẩn hóa và xử lý các đoạn `[start, end]`.
- Nhận ra khi nào cần sort + merge, two pointers hoặc sweep line.
- Phân biệt hai quy ước: đoạn đóng `[a,b]` và nửa mở `[a,b)`.

## Dấu hiệu nhận diện

Đề bài nói về lịch họp, khoảng thời gian, booking, vùng phủ, số sự kiện đồng thời, hoặc thêm/xóa một khoảng. Hãy hỏi ngay: hai khoảng chạm nhau có được xem là giao nhau không?

## Ý tưởng cốt lõi

### Merge intervals

1. Sort theo `Start`, nếu bằng nhau sort theo `End`.
2. Giữ khoảng cuối trong kết quả.
3. Nếu khoảng mới giao khoảng cuối, nới `End`; ngược lại thêm khoảng mới.

### Sweep line

Biến mỗi khoảng thành hai sự kiện: `+1` ở đầu và `-1` ở cuối. Sort sự kiện rồi quét từ trái sang phải. Thứ tự xử lý khi cùng tọa độ phụ thuộc quy ước đoạn:

- `[start,end)`: xử lý kết thúc trước bắt đầu.
- `[start,end]`: thường xử lý bắt đầu trước kết thúc.

## C# 12 sample: merge và số phòng họp tối thiểu

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public static class IntervalAlgorithms
{
    public readonly record struct Interval(int Start, int End);

    public static List<Interval> Merge(IEnumerable<Interval> source)
    {
        ArgumentNullException.ThrowIfNull(source);
        Interval[] items = source.OrderBy(x => x.Start).ThenBy(x => x.End).ToArray();
        var result = new List<Interval>();

        foreach (Interval current in items)
        {
            if (current.Start > current.End)
                throw new ArgumentException("Interval start must not exceed end.", nameof(source));
            if (result.Count == 0 || result[^1].End < current.Start)
            {
                result.Add(current);
                continue;
            }

            Interval last = result[^1];
            result[^1] = new Interval(last.Start, Math.Max(last.End, current.End));
        }

        return result;
    }

    // Dùng quy ước [start, end): cuộc họp kết thúc tại t giải phóng phòng ở t.
    public static int MinMeetingRooms(IEnumerable<Interval> meetings)
    {
        ArgumentNullException.ThrowIfNull(meetings);
        var events = new List<(int Time, int Delta)>();
        foreach (Interval meeting in meetings)
        {
            if (meeting.Start > meeting.End)
                throw new ArgumentException("Meeting start must not exceed end.", nameof(meetings));
            if (meeting.Start == meeting.End) continue; // [t,t) không chiếm thời gian.
            events.Add((meeting.Start, +1));
            events.Add((meeting.End, -1));
        }

        int active = 0, answer = 0;
        foreach (var e in events.OrderBy(e => e.Time).ThenBy(e => e.Delta))
        {
            active += e.Delta; // -1 đứng trước +1 nếu cùng Time.
            answer = Math.Max(answer, active);
        }

        return answer;
    }
}
```

## Dry run

Với `[1,3], [2,6], [8,10], [10,12]`, quy tắc đoạn đóng sẽ merge thành `[1,6], [8,12]`. Với lịch họp nửa mở `[1,3), [3,5)`, chỉ cần một phòng vì sự kiện `-1` tại `3` được xử lý trước `+1`.

## Độ phức tạp

- Sort + merge: `O(n log n)` thời gian, `O(n)` output.
- Sweep line: `O(n log n)` thời gian, `O(n)` bộ nhớ sự kiện.

## Ứng dụng thực tế

- Calendar conflict, cấp phòng họp, booking khách sạn.
- Gom dải IP/thời gian, vùng phủ quảng cáo.
- Đo concurrent requests để lập kế hoạch tài nguyên.

## Lỗi thường gặp

- Không chốt đoạn đóng hay nửa mở.
- Sort sai tie-breaker tại cùng thời điểm.
- Sửa trực tiếp input ngoài ý muốn.
- Dùng `int` cho timestamp/tổng có thể vượt giới hạn; khi đó dùng `long`.

## Câu hỏi phỏng vấn

1. Insert Interval khi danh sách đã sort và không giao nhau.
2. Employee Free Time.
3. Maximum CPU Load / Meeting Rooms II.
4. Nếu tọa độ rất lớn nhưng chỉ có ít endpoint, vì sao sweep line tốt hơn mảng đếm?

## Checklist

- [ ] Nói rõ quy ước endpoint trước khi code.
- [ ] Tự code Merge Intervals trong 15 phút.
- [ ] Giải thích tie-breaker của sweep line.
- [ ] Nêu đúng complexity và test input rỗng/một phần tử.
