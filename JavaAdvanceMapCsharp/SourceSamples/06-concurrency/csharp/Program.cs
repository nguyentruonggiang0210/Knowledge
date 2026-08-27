await RunBoundedFanOut();
await DemonstrateWrapperTimeoutDoesNotStopWork();
await DemonstrateCooperativeCancellation();

static async Task RunBoundedFanOut()
{
    using var limit = new SemaphoreSlim(3);
    using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(1));

    async Task<string> Call(string name)
    {
        await limit.WaitAsync(deadline.Token);
        try
        {
            await Task.Delay(50, deadline.Token);
            return $"{name}:ok";
        }
        finally
        {
            limit.Release();
        }
    }

    var results = await Task.WhenAll(new[] { "catalog", "price", "stock", "shipping" }.Select(Call));
    Console.WriteLine($"async fan-out={string.Join(", ", results)}");
}

static async Task DemonstrateWrapperTimeoutDoesNotStopWork()
{
    var operation = SlowOperationWithoutCancellation();
    try
    {
        await operation.WaitAsync(TimeSpan.FromMilliseconds(30));
    }
    catch (TimeoutException)
    {
        Console.WriteLine("C# wrapper timed out");
    }

    // WaitAsync timed out, but the Task below still owns running work.
    await operation;

    static async Task SlowOperationWithoutCancellation()
    {
        try
        {
            await Task.Delay(150);
        }
        finally
        {
            Console.WriteLine("C# underlying operation exited");
        }
    }
}

static async Task DemonstrateCooperativeCancellation()
{
    using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(30));
    try
    {
        await Task.Delay(TimeSpan.FromSeconds(5), cancellation.Token);
    }
    catch (OperationCanceledException) when (cancellation.IsCancellationRequested)
    {
        Console.WriteLine("C# operation observed CancellationToken");
    }
}
