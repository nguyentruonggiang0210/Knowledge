# Batch ETL multithreading sample

Pipeline thực hiện:

1. **Extract** từng dòng CSV theo kiểu streaming.
2. Gom dữ liệu thành các partition có kích thước cố định.
3. Đưa partition vào bounded `Channel<T>` để tạo backpressure.
4. N worker cùng transform, validate và filter record trùng.
5. Bulk upsert từng batch vào repository.
6. Export kết quả ra `BatchEtlSample/Output/orders-output.csv` để dễ kiểm tra.

## Chạy sample

```powershell
dotnet run --project .\BatchEtlSample
```

File mẫu gồm 10.000 dòng nằm tại
`BatchEtlSample/Assets/orders-input.csv`. Nếu file mặc định không tồn tại, chương
trình sẽ tự tạo lại trong thư mục `Assets`. Có thể truyền file nguồn và file đích
riêng:

```powershell
dotnet run --project .\BatchEtlSample -- .\BatchEtlSample\Assets\orders-input.csv .\BatchEtlSample\Output\orders-output.csv
```

Nhấn `Ctrl+C` để kiểm tra graceful cancellation.

## Điều chỉnh concurrency

Sửa `EtlOptions` trong `Program.cs`:

- `BatchSize`: số record trong một partition/bulk write.
- `WorkerCount`: số partition được xử lý đồng thời.
- `ChannelCapacity`: số partition tối đa chờ trong RAM.

Trong production, thay `InMemoryOrderRepository` bằng repository thật. Với SQL
Server có thể dùng `SqlBulkCopy`; với EF Core cần tạo một `DbContext` riêng cho
mỗi worker vì `DbContext` không thread-safe.
