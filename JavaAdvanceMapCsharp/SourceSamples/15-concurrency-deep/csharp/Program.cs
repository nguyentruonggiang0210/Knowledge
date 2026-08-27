using System.Threading.Channels;

internal static class Program
{
    private static async Task Main()
    {
        // Channel bounded + FullMode.Wait tạo async backpressure cho producer.
        var queue = Channel.CreateBounded<WorkItem>(new BoundedChannelOptions(2)
        {
            SingleWriter = true,
            SingleReader = false,
            FullMode = BoundedChannelFullMode.Wait
        });

        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        long completed = 0;

        var consumers = Enumerable.Range(0, 2).Select(workerId => Task.Run(async () =>
        {
            await foreach (var work in queue.Reader.ReadAllAsync(deadline.Token))
            {
                await Task.Delay(TimeSpan.FromMilliseconds(25), deadline.Token);
                Interlocked.Increment(ref completed);
                Console.WriteLine($"work={work.Id} worker={workerId} thread={Environment.CurrentManagedThreadId}");
            }
        }, deadline.Token)).ToArray();

        for (var id = 0; id < 8; id++)
        {
            await queue.Writer.WriteAsync(new WorkItem(id), deadline.Token);
        }

        queue.Writer.Complete();
        await Task.WhenAll(consumers);

        Console.WriteLine($"completed={Volatile.Read(ref completed)}, endpoint={ConfigurationHolder.Value.Endpoint}");
    }
}

internal sealed record WorkItem(int Id);

internal sealed record Configuration(string Endpoint);

internal static class ConfigurationHolder
{
    // Lazy<T> mặc định dùng ExecutionAndPublication: khởi tạo một lần và safe-publish.
    // Đây là idiom C# phù hợp hơn tự viết double-checked locking.
    private static readonly Lazy<Configuration> Instance = new(
        () => new Configuration("https://example.invalid"),
        LazyThreadSafetyMode.ExecutionAndPublication);

    public static Configuration Value => Instance.Value;
}
