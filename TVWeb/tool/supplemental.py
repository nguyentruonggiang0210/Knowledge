"""Discover film metadata from supported catalogue sitemaps."""
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from crawler import get_with_retry, polite_sleep
from store import connect, raw_hash, set_state, upsert_film

SOURCES = {"motchillv.xyz": "motchill", "tophim.top": "tophim"}


def source_name(url):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in SOURCES or parsed.path not in ("", "/"):
        raise ValueError("--source-url must be the HTTPS homepage of motchillv.xyz or tophim.top")
    return SOURCES[parsed.hostname]


def film_urls(client, base, cfg):
    """Walk same-host XML sitemaps; never follow sitemap links to arbitrary hosts."""
    host = urlparse(base).hostname
    pending = [base + "/sitemap.xml"]
    visited = set()
    while pending:
        url = pending.pop()
        if url in visited or urlparse(url).hostname != host:
            continue
        visited.add(url)
        root = ET.fromstring(get_with_retry(client, url, cfg).content)
        namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        for item in root.findall("s:sitemap/s:loc", namespace):
            child = item.text or ""
            if urlparse(child).hostname == host and child not in visited:
                pending.append(child)
        for item in root.findall("s:url/s:loc", namespace):
            candidate = item.text or ""
            if urlparse(candidate).hostname == host and re.fullmatch(r"/phim/[a-z0-9-]+/?", urlparse(candidate).path):
                yield candidate


def film_metadata(html, url, source):
    soup = BeautifulSoup(html, "lxml")
    heading = next((node for node in soup.select("h1") if node.get_text(" ", strip=True)), None)
    if heading is None:
        return None
    title = heading.get_text(" ", strip=True)
    if source == "motchill":
        original = heading.find_next("h2")
        original_title = original.get_text(" ", strip=True) if original else None
    else:
        original_title = None
    original_title = re.sub(r" \((?:19\d{2}|20[0-3]\d)\)$", "", (original_title or "").strip()) or None
    text = soup.get_text(" ", strip=True)
    year = re.search(r"\b(?:19\d{2}|20[0-3]\d)\b", (soup.title.get_text(" ", strip=True) if soup.title else "") + " " + text[:3000])
    image = soup.select_one('meta[property="og:image"]')
    desc = soup.select_one('meta[property="og:description"]')
    slug = urlparse(url).path.rstrip("/").split("/")[-1]
    return {
        "slug": f"{source}-{slug}", "title_vi": title, "title_en": original_title,
        "poster": image.get("content") if image is not None else None, "backdrop": None,
        "year": int(year.group()) if year else None, "country": None, "quality": None,
        "lang": None, "imdb": None, "description": desc.get("content") if desc is not None else None,
        "genres": "[]", "directors": None, "actors": None, "duration": None,
        "total_eps": None, "status": "phim-le", "source_url": url,
        "raw_hash": raw_hash(str(soup)[:20000]),
    }


def crawl_supplemental(cfg, url, limit_films=None):
    source = source_name(url)
    base = "https://" + urlparse(url).hostname
    stats = {"discovered": 0, "uncertain": 0, "films": 0}
    con = connect(cfg["db_path"])
    from crawler import make_client
    try:
        cursor_key = f"supplemental:{source}:offset"
        cursor = con.execute("SELECT v FROM crawl_state WHERE k=?", (cursor_key,)).fetchone()
        offset = int(cursor["v"]) if cursor else 0
        completed = True
        with make_client(cfg) as client:
            for sitemap_index, detail_url in enumerate(film_urls(client, base, cfg)):
                if sitemap_index < offset:
                    continue
                if limit_films is not None and stats["discovered"] >= limit_films:
                    completed = False
                    break
                stats["discovered"] += 1
                retry_later = False
                try:
                    detail = get_with_retry(client, detail_url, cfg)
                    film = film_metadata(detail.content, detail_url, source)
                    if not film:
                        stats["uncertain"] += 1
                        continue
                    film["status"] = "phim-bo" if source == "motchill" and "phút/tập" in BeautifulSoup(detail.content, "lxml").get_text(" ", strip=True) else "phim-le"
                    upsert_film(con, film)
                    stats["films"] += 1
                    con.commit()
                    polite_sleep(cfg)
                except Exception as exc:
                    print(f"[warn] {source} {detail_url}: {exc}", flush=True)
                    stats["uncertain"] += 1
                    retry_later = True
                finally:
                    set_state(con, cursor_key, str(sitemap_index if retry_later else sitemap_index + 1))
                    con.commit()
                    if stats["discovered"] % 25 == 0:
                        print(f"[{source}] offset={sitemap_index + 1} "
                              f"checked={stats['discovered']} films={stats['films']} "
                              f"uncertain={stats['uncertain']}", flush=True)
                if retry_later:
                    completed = False
                    break
            if completed:
                set_state(con, cursor_key, "0")
                print(f"[{source}] sitemap complete: checked={stats['discovered']}", flush=True)
            set_state(con, f"supplemental:{source}:last_run", str(stats))
            con.commit()
    finally:
        con.close()
    return stats