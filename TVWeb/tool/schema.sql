-- TvWeb SQLite schema (shared by scraper and web)
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS films (
    slug        TEXT PRIMARY KEY,
    title_vi    TEXT NOT NULL,
    title_en    TEXT,
    poster      TEXT,
    backdrop    TEXT,
    year        INTEGER,
    country     TEXT,
    quality     TEXT,
    lang        TEXT,
    imdb        REAL,
    description TEXT,
    genres      TEXT,            -- JSON array string
    directors   TEXT,
    actors      TEXT,
    duration    TEXT,
    total_eps   INTEGER,
    status      TEXT,            -- phim-le / phim-bo
    source_url  TEXT,
    raw_hash    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS episodes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    film_slug   TEXT NOT NULL REFERENCES films(slug) ON DELETE CASCADE,
    server_name TEXT NOT NULL,   -- e.g. Vietsub (SN)
    server_slug TEXT NOT NULL,
    ep_index    TEXT NOT NULL,   -- 1, 12, Trailer, etc.
    ep_type     TEXT,            -- vietsub / thuyetminh
    watch_url   TEXT NOT NULL,
    embed_url   TEXT,
    m3u8_url    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(film_slug, server_slug, ep_index)
);

CREATE TABLE IF NOT EXISTS crawl_state (
    k TEXT PRIMARY KEY,
    v TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_films_updated ON films(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_films_year ON films(year DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_film ON episodes(film_slug);
