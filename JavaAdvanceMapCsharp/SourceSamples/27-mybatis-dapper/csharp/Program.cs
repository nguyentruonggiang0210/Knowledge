using System.Data.Common;
using System.Text;
using Dapper;
using Microsoft.Data.Sqlite;

const string connectionString = "Data Source=mybatis_dapper;Mode=Memory;Cache=Shared;Pooling=True";
using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(2));
await using var anchor = new SqliteConnection(connectionString);
await anchor.OpenAsync(deadline.Token);
await anchor.ExecuteAsync(new CommandDefinition("""
    CREATE TABLE inventory(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT NOT NULL UNIQUE,
        stock INTEGER NOT NULL CHECK(stock >= 0),
        version INTEGER NOT NULL DEFAULT 0
    );
    """, cancellationToken: deadline.Token));

Func<DbConnection> connectionFactory = () => new SqliteConnection(connectionString);
var repository = new InventoryRepository();

await using (var connection = await OpenConnection(connectionFactory, deadline.Token))
{
    var id = await repository.Insert(connection, "JAVA-21", 5, transaction: null, deadline.Token);
    Console.WriteLine($"generated id={id}");
}

await using (var connection = await OpenConnection(connectionFactory, deadline.Token))
await using (var transaction = await connection.BeginTransactionAsync(deadline.Token))
{
    var before = await repository.FindBySku(connection, "JAVA-21", transaction, deadline.Token);
    var affected = await repository.Reserve(
        connection, before.Sku, 2, before.Version, transaction, deadline.Token);
    Console.WriteLine($"reserve before rollback affected={affected}");
    await transaction.RollbackAsync(CancellationToken.None);
}

await using (var connection = await OpenConnection(connectionFactory, deadline.Token))
{
    Console.WriteLine($"after rollback={await repository.FindBySku(connection, "JAVA-21", null, deadline.Token)}");
    var rows = await repository.Search(
        connection, "JAVA", minimumStock: 1, InventorySort.StockDescending, deadline.Token);
    Console.WriteLine($"dynamic search={string.Join(", ", rows)}");
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

internal enum InventorySort
{
    SkuAscending,
    StockDescending
}

// SQLite exposes INTEGER columns as Int64 through its provider; use long in this lab DTO.
internal sealed record InventoryItem(long Id, string Sku, long Stock, long Version);

internal sealed class InventoryRepository
{
    public Task<long> Insert(
        DbConnection connection,
        string sku,
        int stock,
        DbTransaction? transaction,
        CancellationToken cancellationToken) =>
        connection.QuerySingleAsync<long>(new CommandDefinition(
            "INSERT INTO inventory(sku, stock) VALUES (@Sku, @Stock) RETURNING id",
            new { Sku = sku, Stock = stock },
            transaction,
            commandTimeout: 2,
            cancellationToken: cancellationToken));

    public Task<InventoryItem> FindBySku(
        DbConnection connection,
        string sku,
        DbTransaction? transaction,
        CancellationToken cancellationToken) =>
        connection.QuerySingleAsync<InventoryItem>(new CommandDefinition(
            "SELECT id Id, sku Sku, stock Stock, version Version FROM inventory WHERE sku = @Sku",
            new { Sku = sku },
            transaction,
            commandTimeout: 2,
            cancellationToken: cancellationToken));

    public Task<int> Reserve(
        DbConnection connection,
        string sku,
        int quantity,
        long expectedVersion,
        DbTransaction transaction,
        CancellationToken cancellationToken) =>
        connection.ExecuteAsync(new CommandDefinition("""
            UPDATE inventory
            SET stock = stock - @Quantity, version = version + 1
            WHERE sku = @Sku AND version = @ExpectedVersion AND stock >= @Quantity
            """,
            new { Sku = sku, Quantity = quantity, ExpectedVersion = expectedVersion },
            transaction,
            commandTimeout: 2,
            cancellationToken: cancellationToken));

    public async Task<IReadOnlyList<InventoryItem>> Search(
        DbConnection connection,
        string? skuPrefix,
        int? minimumStock,
        InventorySort sort,
        CancellationToken cancellationToken)
    {
        var sql = new StringBuilder("SELECT id Id, sku Sku, stock Stock, version Version FROM inventory WHERE 1=1");
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(skuPrefix))
        {
            sql.Append(" AND sku LIKE @SkuPrefix");
            parameters.Add("SkuPrefix", skuPrefix + "%");
        }
        if (minimumStock is not null)
        {
            sql.Append(" AND stock >= @MinimumStock");
            parameters.Add("MinimumStock", minimumStock);
        }

        // Identifier/direction cannot be a bind parameter: map enum to fixed fragments.
        sql.Append(sort switch
        {
            InventorySort.SkuAscending => " ORDER BY sku ASC",
            InventorySort.StockDescending => " ORDER BY stock DESC, sku ASC",
            _ => throw new ArgumentOutOfRangeException(nameof(sort))
        });

        var rows = await connection.QueryAsync<InventoryItem>(new CommandDefinition(
            sql.ToString(), parameters, commandTimeout: 2, cancellationToken: cancellationToken));
        return rows.AsList();
    }
}
