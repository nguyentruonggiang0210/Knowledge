using System.Data.Common;
using Microsoft.Data.Sqlite;

const string connectionString = "Data Source=course;Mode=Memory;Cache=Shared;Pooling=True";
using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(2));

// SQLite shared-memory DB còn tồn tại khi anchor connection mở. Production sẽ inject
// provider DbDataSource hoặc factory/pool sống suốt application lifetime.
await using var anchor = new SqliteConnection(connectionString);
await anchor.OpenAsync(deadline.Token);
await CreateSchema(anchor, deadline.Token);

Func<DbConnection> connectionFactory = () => new SqliteConnection(connectionString);
await InsertInventory(connectionFactory, "JAVA-21", 2, deadline.Token);
await Reserve(connectionFactory, "JAVA-21", 1, deadline.Token);
Console.WriteLine($"stock={await StockOf(connectionFactory, "JAVA-21", deadline.Token)}");

try
{
    await InsertOrderThenFail(connectionFactory, deadline.Token);
}
catch (InvalidOperationException expected)
{
    Console.WriteLine($"transaction rolled back: {expected.Message}");
}
if (await OrderCount(connectionFactory, deadline.Token) != 0)
{
    throw new InvalidOperationException("rollback leaked an order");
}

static async Task CreateSchema(DbConnection connection, CancellationToken cancellationToken)
{
    await using var command = connection.CreateCommand();
    command.CommandText = """
        CREATE TABLE inventory(
            sku TEXT PRIMARY KEY,
            stock INTEGER NOT NULL,
            version INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE orders(
            request_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            total NUMERIC NOT NULL
        );
        """;
    await command.ExecuteNonQueryAsync(cancellationToken);
}

static async Task InsertInventory(
    Func<DbConnection> connectionFactory,
    string sku,
    int stock,
    CancellationToken cancellationToken)
{
    await using var connection = await OpenConnection(connectionFactory, cancellationToken);
    await using var command = connection.CreateCommand();
    command.CommandText = "INSERT INTO inventory(sku, stock) VALUES (@sku, @stock)";
    AddParameter(command, "@sku", sku);
    AddParameter(command, "@stock", stock);
    await command.ExecuteNonQueryAsync(cancellationToken);
}

static async Task<bool> Reserve(
    Func<DbConnection> connectionFactory,
    string sku,
    int quantity,
    CancellationToken cancellationToken)
{
    await using var connection = await OpenConnection(connectionFactory, cancellationToken);
    await using var command = connection.CreateCommand();
    command.CommandText = """
        UPDATE inventory
        SET stock = stock - @quantity, version = version + 1
        WHERE sku = @sku AND stock >= @quantity
        """;
    command.CommandTimeout = 2;
    AddParameter(command, "@quantity", quantity);
    AddParameter(command, "@sku", sku);
    return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
}

static async Task<int> StockOf(
    Func<DbConnection> connectionFactory,
    string sku,
    CancellationToken cancellationToken)
{
    await using var connection = await OpenConnection(connectionFactory, cancellationToken);
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT stock FROM inventory WHERE sku = @sku";
    command.CommandTimeout = 2;
    AddParameter(command, "@sku", sku);

    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    if (!await reader.ReadAsync(cancellationToken)) throw new ArgumentException("unknown sku", nameof(sku));
    return reader.GetInt32(0);
}

static async Task<long> OrderCount(
    Func<DbConnection> connectionFactory,
    CancellationToken cancellationToken)
{
    await using var connection = await OpenConnection(connectionFactory, cancellationToken);
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT COUNT(*) FROM orders";
    return (long)(await command.ExecuteScalarAsync(cancellationToken)
        ?? throw new InvalidOperationException("COUNT returned null"));
}

static async Task InsertOrderThenFail(
    Func<DbConnection> connectionFactory,
    CancellationToken cancellationToken)
{
    await using var connection = await OpenConnection(connectionFactory, cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

    try
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction; // Dapper/ADO.NET command must enlist explicitly.
        command.CommandText = """
            INSERT INTO orders(request_id, customer_id, total)
            VALUES (@requestId, @customerId, @total)
            """;
        AddParameter(command, "@requestId", "REQ-1");
        AddParameter(command, "@customerId", "CUS-1");
        AddParameter(command, "@total", 10.00m);
        await command.ExecuteNonQueryAsync(cancellationToken);
        throw new InvalidOperationException("simulated failure after first command");
    }
    catch (Exception failure)
    {
        try
        {
            // Cleanup không phụ thuộc request token vốn có thể đã bị cancel.
            await transaction.RollbackAsync(CancellationToken.None);
        }
        catch (Exception rollbackFailure)
        {
            throw new AggregateException("operation and rollback both failed", failure, rollbackFailure);
        }

        throw;
    }
}

static async Task<DbConnection> OpenConnection(
    Func<DbConnection> connectionFactory,
    CancellationToken cancellationToken)
{
    var connection = connectionFactory();
    try
    {
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
    catch
    {
        await connection.DisposeAsync();
        throw;
    }
}

static void AddParameter(DbCommand command, string name, object value)
{
    var parameter = command.CreateParameter();
    parameter.ParameterName = name;
    parameter.Value = value;
    command.Parameters.Add(parameter);
}
