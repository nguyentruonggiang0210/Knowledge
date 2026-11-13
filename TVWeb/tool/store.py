"""SQLite store shared with the ASP.NET MVC web (upsert + dedupe)."""
import hashlib
import sqlite3
from pathlib import Path


SCHEMA = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")


def connect(db_path: str) -> sqlite3.Connection:
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL;")
    con.executescript(SCHEMA)
    return con


def raw_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", "ignore")).hexdigest()[:32]


def upsert_film(con: sqlite3.Connection, f: dict) -> bool:
    """Returns True if inserted/changed (needs episode refresh)."""
    cur = con.execute("SELECT raw_hash FROM films WHERE slug=?", (f["slug"],))
    row = cur.fetchone()
    if row and row["raw_hash"] == f.get("raw_hash"):
        con.execute("UPDATE films SET updated_at=datetime('now') WHERE slug=?", (f["slug"],))
        return False
    con.execute(
        """INSERT INTO films(slug,title_vi,title_en,poster,backdrop,year,country,quality,lang,
               imdb,description,genres,directors,actors,duration,total_eps,status,source_url,raw_hash,updated_at)
           VALUES(:slug,:title_vi,:title_en,:poster,:backdrop,:year,:country,:quality,:lang,
               :imdb,:description,:genres,:directors,:actors,:duration,:total_eps,:status,:source_url,:raw_hash,datetime('now'))
           ON CONFLICT(slug) DO UPDATE SET
             title_vi=excluded.title_vi, title_en=excluded.title_en, poster=excluded.poster,
             backdrop=excluded.backdrop, year=excluded.year, country=excluded.country,
             quality=excluded.quality, lang=excluded.lang, imdb=excluded.imdb,
             description=excluded.description, genres=excluded.genres, directors=excluded.directors,
             actors=excluded.actors, duration=excluded.duration, total_eps=excluded.total_eps,
             status=excluded.status, source_url=excluded.source_url, raw_hash=excluded.raw_hash,
             updated_at=datetime('now')""",
        f,
    )
    return True


def upsert_episode(con: sqlite3.Connection, e: dict) -> bool:
    cur = con.execute(
        "SELECT embed_url, m3u8_url FROM episodes WHERE film_slug=? AND server_slug=? AND ep_index=?",
        (e["film_slug"], e["server_slug"], e["ep_index"]),
    )
    row = cur.fetchone()
    if (row and row["embed_url"] == e.get("embed_url")
            and row["m3u8_url"] == e.get("m3u8_url")):
        return False
    con.execute(
        """INSERT INTO episodes(film_slug,server_name,server_slug,ep_index,ep_type,watch_url,embed_url,m3u8_url,updated_at)
           VALUES(:film_slug,:server_name,:server_slug,:ep_index,:ep_type,:watch_url,:embed_url,:m3u8_url,datetime('now'))
           ON CONFLICT(film_slug,server_slug,ep_index) DO UPDATE SET
             server_name=excluded.server_name, ep_type=excluded.ep_type, watch_url=excluded.watch_url,
             embed_url=excluded.embed_url, m3u8_url=excluded.m3u8_url, updated_at=datetime('now')""",
        e,
    )
    return True


def set_state(con: sqlite3.Connection, k: str, v: str):
    con.execute(
        "INSERT INTO crawl_state(k,v,updated_at) VALUES(?,?,datetime('now')) "
        "ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=datetime('now')",
        (k, v),
    )
