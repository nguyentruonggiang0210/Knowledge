using Dapper;
using Microsoft.Data.Sqlite;
using TvWeb.Models;

namespace TvWeb.Data;

public class AppDb
{
    private readonly string _cs;
    public AppDb(IConfiguration cfg, IWebHostEnvironment env)
    {
        var db = cfg.GetConnectionString("TvDb") ?? "Data Source=data/tvweb.db";
        // resolve relative path against content root
        if (db.Contains("data/tvweb.db") && !Path.IsPathRooted("data"))
        {
            var p = Path.Combine(env.ContentRootPath, "..", "..", "data", "tvweb.db");
            p = Path.GetFullPath(p);
            if (Directory.Exists(Path.GetDirectoryName(p)))
                db = $"Data Source={p}";
        }
        var envDb = Environment.GetEnvironmentVariable("DB_PATH");
        if (!string.IsNullOrEmpty(envDb)) db = $"Data Source={envDb}";
        _cs = db;
    }
    private SqliteConnection Conn() => new(_cs);

    public async Task EnsureSchemaAsync()
    {
        var dir = Environment.GetEnvironmentVariable("DB_PATH");
        string? file = null;
        try { file = new SqliteConnectionStringBuilder(_cs).DataSource; } catch { }
        if (file != null) Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(file)) ?? ".");
        using var c = Conn();
        await c.ExecuteAsync(@"CREATE TABLE IF NOT EXISTS films(
          slug TEXT PRIMARY KEY,title_vi TEXT NOT NULL,title_en TEXT,poster TEXT,backdrop TEXT,
          year INTEGER,country TEXT,quality TEXT,lang TEXT,imdb REAL,description TEXT,genres TEXT,
          directors TEXT,actors TEXT,duration TEXT,total_eps INTEGER,status TEXT,source_url TEXT,raw_hash TEXT,
          created_at TEXT DEFAULT (datetime('now')),updated_at TEXT DEFAULT (datetime('now')));
          CREATE TABLE IF NOT EXISTS episodes(
          id INTEGER PRIMARY KEY AUTOINCREMENT,film_slug TEXT NOT NULL,server_name TEXT NOT NULL,
          server_slug TEXT NOT NULL,ep_index TEXT NOT NULL,ep_type TEXT,watch_url TEXT NOT NULL,
          embed_url TEXT,m3u8_url TEXT,created_at TEXT DEFAULT (datetime('now')),updated_at TEXT DEFAULT (datetime('now')),
          UNIQUE(film_slug,server_slug,ep_index));
          CREATE INDEX IF NOT EXISTS idx_films_updated ON films(updated_at DESC);");
    }

    public async Task<List<Film>> LatestAsync(int take = 24)
    {
        using var c = Conn();
        var r = await c.QueryAsync<Film>("SELECT * FROM films ORDER BY updated_at DESC LIMIT @t", new { t = take });
        return r.ToList();
    }
    public async Task<List<Film>> SearchAsync(string? q, string? genre, string? status, int page, int size)
    {
        using var c = Conn();
        var sql = "SELECT * FROM films WHERE 1=1";
        if (!string.IsNullOrWhiteSpace(q)) sql += " AND (title_vi LIKE @q OR title_en LIKE @q)";
        if (!string.IsNullOrWhiteSpace(status)) sql += " AND status=@s";
        if (!string.IsNullOrWhiteSpace(genre)) sql += " AND genres LIKE @g";
        sql += " ORDER BY updated_at DESC LIMIT @size OFFSET @off";
        var r = await c.QueryAsync<Film>(sql, new { q = $"%{q}%", s = status, g = $"%{genre}%", size, off = (page - 1) * size });
        return r.ToList();
    }
    public async Task<int> CountAsync(string? q, string? genre, string? status)
    {
        using var c = Conn();
        var sql = "SELECT COUNT(*) FROM films WHERE 1=1";
        if (!string.IsNullOrWhiteSpace(q)) sql += " AND (title_vi LIKE @q OR title_en LIKE @q)";
        if (!string.IsNullOrWhiteSpace(status)) sql += " AND status=@s";
        if (!string.IsNullOrWhiteSpace(genre)) sql += " AND genres LIKE @g";
        return await c.ExecuteScalarAsync<int>(sql, new { q = $"%{q}%", s = status, g = $"%{genre}%" });
    }
    public async Task<Film?> GetFilmAsync(string slug)
    {
        using var c = Conn();
        return await c.QueryFirstOrDefaultAsync<Film>("SELECT * FROM films WHERE slug=@s", new { s = slug });
    }
    public async Task<List<Episode>> GetEpisodesAsync(string slug)
    {
        using var c = Conn();
        var r = await c.QueryAsync<Episode>("SELECT * FROM episodes WHERE film_slug=@s ORDER BY server_slug, CAST(ep_index AS INTEGER)", new { s = slug });
        return r.ToList();
    }
    public async Task<List<string>> GenresAsync()
    {
        using var c = Conn();
        var all = await c.QueryAsync<string>("SELECT genres FROM films WHERE genres IS NOT NULL");
        var set = new SortedSet<string>();
        foreach (var g in all) { try { foreach (var x in System.Text.Json.JsonSerializer.Deserialize<List<string>>(g) ?? new()) set.Add(x); } catch { } }
        return set.ToList();
    }
}
