"""API-first crawler for onflix.lat — exhaustive, no missing films.

Source of truth: https://k8s.onflixcdn.com/api/movies (59k+ items, newest first,
stable pagination, filters type/country). Film metadata comes straight from the
API; /phim/{slug} HTML is only used for server/episode links; /xem-phim/...
pages give the embed/m3u8 player URLs. Ad URLs are filtered via blocklist.

Modes:
  --once [--limit N]     incremental: first pages (newest films)
  --once --full          exhaustive sweep of every API page (resume via crawl_state)
  scheduler (no --once)  every 3h incremental
"""
import json
import os
import random
import re
import time
from urllib.parse import urljoin

import httpx
import yaml
from bs4 import BeautifulSoup

from store import connect, raw_hash, upsert_film, upsert_episode, set_state

ROOT = os.path.dirname(os.path.abspath(__file__))

API_BASE = "https://k8s.onflixcdn.com/api"


def load_config():
    with open(os.path.join(ROOT, "config.yaml"), encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    db = os.environ.get("DB_PATH") or os.path.join(
        os.path.dirname(ROOT), "data", "tvweb.db")
    if os.path.exists("/app/data") and "DB_PATH" not in os.environ:
        db = "/app/data/tvweb.db"
    cfg["db_path"] = db
    return cfg


def make_client(cfg):
    return httpx.Client(
        timeout=cfg.get("timeout", 30),
        follow_redirects=True,
        headers={
            "User-Agent": cfg["user_agent"],
            "Referer": cfg["base_url"] + "/",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        },
    )


def polite_sleep(cfg, fast=False):
    lo, hi = cfg.get("request_delay_min", 1), cfg.get("request_delay_max", 3)
    if fast:
        lo, hi = min(lo, 0.3), min(hi, 0.8)
    time.sleep(random.uniform(lo, hi))


def get_with_retry(client, url, cfg, params=None):
    last = None
    for i in range(cfg.get("max_retries", 3)):
        try:
            r = client.get(url, params=params)
            if r.status_code in (403, 429):
                time.sleep(5 * (i + 1) + random.random() * 3)
                continue
            r.raise_for_status()
            return r
        except Exception as ex:  # noqa: BLE001
            last = ex
            time.sleep(2 * (i + 1))
    raise last or RuntimeError(f"GET failed: {url}")


def is_ad_url(url: str, blocklist) -> bool:
    u = (url or "").lower()
    return any(b.lower() in u for b in blocklist)


def api_movies_page(client, cfg, page: int, limit: int = 50, extra=None):
    params = {"page": page, "limit": limit}
    if extra:
        params.update(extra)
    r = get_with_retry(client, f"{API_BASE}/movies", cfg, params=params)
    j = r.json()
    return j.get("data", []), j.get("pagination", {})


def film_from_api(item: dict, base: str) -> dict:
    slug = item.get("slug") or ""
    cats = [c.strip() for c in (item.get("categories") or "").split(",") if c.strip()]
    ep_cur = item.get("episode_current") or ""
    m = re.search(r"(\d+)", str(ep_cur))
    total_eps = int(m.group(1)) if m else (1 if (item.get("type") == "phim-le") else None)
    imdb = item.get("tmdb_vote_average") or None
    try:
        imdb = float(imdb) if imdb else None
    except (TypeError, ValueError):
        imdb = None
    return {
        "slug": slug,
        "title_vi": item.get("title") or slug.replace("-", " ").title(),
        "title_en": item.get("original_title"),
        "poster": item.get("poster_url"),
        "backdrop": item.get("thumb_url"),
        "year": item.get("year"),
        "country": None,
        "quality": item.get("quality"),
        "lang": item.get("lang"),
        "imdb": imdb,
        "description": None,
        "genres": json.dumps(cats, ensure_ascii=False),
        "directors": None,
        "actors": None,
        "duration": None,
        "total_eps": total_eps,
        "status": item.get("type") or "phim-le",
        "source_url": f"{base}/phim/{slug}",
        "raw_hash": raw_hash(json.dumps(item, sort_keys=True, ensure_ascii=False)),
    }


def parse_card_slugs(list_html: str, base: str) -> list[str]:
    slugs: list[str] = []
    soup = BeautifulSoup(list_html, "lxml")
    for a in soup.select('a[href*="/phim/"]'):
        href = a.get("href", "")
        m = re.search(r"/phim/([\w\-]+)", href)
        if m and m.group(1) not in slugs and m.group(1) not in ("le", "bo", "han", "trung", "au-my"):
            slugs.append(m.group(1))
    for m in re.finditer(r'\\/phim\\/([\w\-]+)', list_html):
        s = m.group(1)
        if s not in slugs and s not in ("le", "bo", "han", "trung", "au-my"):
            slugs.append(s)
    for m in re.finditer(r'/phim/([\w\-]+)', list_html):
        s = m.group(1)
        if s not in slugs and s not in ("le", "bo", "han", "trung", "au-my"):
            slugs.append(s)
    return slugs


def parse_film_detail(html: str, slug: str, base: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(" ", strip=True)

    def find_label(*labels):
        for lb in labels:
            el = soup.find(string=re.compile(lb, re.I))
            if el and el.parent:
                nxt = el.parent.find_next_sibling()
                if nxt:
                    return nxt.get_text(" ", strip=True)[:300]
                return el.parent.get_text(" ", strip=True)[:300]
        return None

    h1 = soup.find("h1")
    title_vi = h1.get_text(" ", strip=True) if h1 else slug.replace("-", " ").title()
    title_en = None
    og = soup.find("meta", attrs={"property": "og:title"})
    if og and og.get("content"):
        title_en = og["content"].strip()
    poster = None
    ogimg = soup.find("meta", attrs={"property": "og:image"})
    if ogimg and ogimg.get("content"):
        poster = ogimg["content"].strip()
    if not poster:
        img = soup.select_one('img[src*="onflixcdn"], img[src*="poster"]')
        if img:
            poster = urljoin(base, img.get("src", ""))
    desc = None
    ogd = soup.find("meta", attrs={"property": "og:description"})
    if ogd and ogd.get("content"):
        desc = ogd["content"].strip()
    m_imdb = re.search(r"IMDb\s*([\d.]+)", text)
    m_year = re.search(r"(19\d{2}|20[0-3]\d)", text)
    m_eps = re.search(r"Danh s\xe1ch t\u1eadp\s*\((\d+)/(\d+)\)|T\u1eadp\s*(\d+)", text)
    total_eps = None
    if m_eps:
        nums = [g for g in m_eps.groups() if g]
        total_eps = int(nums[-1]) if nums else None
    genres = []
    for a in soup.select('a[href*="/the-loai/"]'):
        g = a.get_text(strip=True)
        if g and g not in genres:
            genres.append(g)
    status = "phim-bo" if (total_eps and total_eps > 1) else "phim-le"
    return {
        "slug": slug,
        "title_vi": title_vi,
        "title_en": title_en,
        "poster": poster,
        "backdrop": None,
        "year": int(m_year.group(1)) if m_year else None,
        "country": find_label("Qu\u1ed1c gia", "Country"),
        "quality": find_label("Ch\u1ea5t l\u01b0\u1ee3ng", "Quality"),
        "lang": find_label("Ng\xf4n ng\u1eef", "Language"),
        "imdb": float(m_imdb.group(1)) if m_imdb else None,
        "description": desc,
        "genres": json.dumps(genres, ensure_ascii=False),
        "directors": find_label("\u0110\u1ea1o di\u1ec5n", "Dao dien"),
        "actors": None,
        "duration": None,
        "total_eps": total_eps,
        "status": status,
        "source_url": f"{base}/phim/{slug}",
        "raw_hash": raw_hash(html[:20000]),
    }


def parse_watch_servers(detail_html: str) -> list[dict]:
    out = []
    soup = BeautifulSoup(detail_html, "lxml")
    for a in soup.select('a[href*="/xem-phim/"], a[href*="xem-phim/"]'):
        href = a.get("href", "")
        m = re.search(r"xem-phim/([\w\-]+)/([\w\-]+)/([\w\-]+)/([\w\-]+)", href)
        if not m:
            continue
        slug, server_slug, ep_type, ep = m.groups()
        out.append({"film_slug": slug, "server_slug": server_slug,
                    "server_name": server_slug.replace("-", " ").upper(), "ep_type": ep_type,
                    "ep_index": ep, "watch_url": href})
    for m in re.finditer(r"xem-phim\\/([\w\-]+)\\/([\w\-]+)\\/([\w\-]+)\\/([\w\-]+)", detail_html):
        slug, server_slug, ep_type, ep = m.groups()
        out.append({"film_slug": slug, "server_slug": server_slug,
                    "server_name": server_slug.replace("-", " ").upper(), "ep_type": ep_type,
                    "ep_index": ep, "watch_url": f"/xem-phim/{slug}/{server_slug}/{ep_type}/{ep}"})
    for m in re.finditer(r"xem-phim/([\w\-]+)/([\w\-]+)/([\w\-]+)/([\w\-]+)", detail_html):
        slug, server_slug, ep_type, ep = m.groups()
        out.append({"film_slug": slug, "server_slug": server_slug,
                    "server_name": server_slug.replace("-", " ").upper(), "ep_type": ep_type,
                    "ep_index": ep, "watch_url": f"/xem-phim/{slug}/{server_slug}/{ep_type}/{ep}"})
    seen, uniq = set(), []
    for e in out:
        key = (e["server_slug"], e["ep_index"])
        if key not in seen:
            seen.add(key)
            uniq.append(e)
    return uniq


def _clean_url(u: str, base: str) -> str:
    u = (u or "").strip().rstrip("\\").strip("\"' \t\r\n")
    u = re.sub(r"[\\'\"]+$", "", u)
    return urljoin(base, u)


def extract_embed(watch_html: str, base: str, blocklist):
    soup = BeautifulSoup(watch_html, "lxml")
    for ifr in soup.find_all("iframe"):
        src = ifr.get("src", "") or ifr.get("data-src", "")
        if not src:
            continue
        full = _clean_url(src, base)
        if is_ad_url(full, blocklist):
            continue
        if any(k in full for k in ("player", "embed", "stream", "video", "play", "cdn")):
            return full, None
    for sc in soup.find_all("script"):
        t = sc.string or sc.get_text() or ""
        t = t.replace("\\/", "/")
        for m in re.finditer(r"https?://[^\s\"'\\]+?\.m3u8[^\s\"'\\]*", t):
            url = _clean_url(m.group(0), base)
            if not is_ad_url(url, blocklist):
                return None, url
    v = soup.find("video")
    if v:
        src = v.get("src") or ((v.find("source") or {}).get("src") if v.find("source") else None)
        if src and not is_ad_url(_clean_url(src, base), blocklist):
            return None, _clean_url(src, base)
    for ifr in soup.find_all("iframe"):
        src = ifr.get("src", "")
        if src and not is_ad_url(_clean_url(src, base), blocklist):
            return _clean_url(src, base), None
    return None, None


def parse_embedded_episodes(html, slug, base, blocklist):
    decoder = json.JSONDecoder()
    episodes = {}
    for script in BeautifulSoup(html, "lxml").find_all("script"):
        text = (script.string or "").strip()
        prefix = "self.__next_f.push("
        if not text.startswith(prefix):
            continue
        try:
            payload, _ = decoder.raw_decode(text[len(prefix):])
        except ValueError:
            continue
        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], str):
            continue
        for match in re.finditer(r'"episodes"\s*:\s*', payload[1]):
            try:
                items, _ = decoder.raw_decode(payload[1][match.end():])
            except ValueError:
                continue
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict) or not all(item.get(key) for key in ("slug", "src", "type")):
                    continue
                server = f"{item['type']}-{item['src']}"
                index = str(item["slug"])
                embed = item.get("link_embed")
                m3u8 = item.get("link_m3u8")
                episodes[(server, index)] = {
                    "film_slug": slug, "server_slug": server,
                    "server_name": item.get("server_name") or server,
                    "ep_index": index, "ep_type": item["type"],
                    "watch_url": f"{base}/xem-phim/{slug}/{server}/{item['type']}/{index}",
                    "embed_url": embed if embed and not is_ad_url(embed, blocklist) else None,
                    "m3u8_url": m3u8 if m3u8 and not is_ad_url(m3u8, blocklist) else None,
                }
    return list(episodes.values())


def _process_film(client, con, cfg, base, slug, api_item=None, fetch_eps=True,
                  refresh_links=False, preserve_metadata=False):
    state_key = f"episodes_v2:{slug}"
    if fetch_eps:
        set_state(con, state_key, "pending")
        con.commit()
    failures = []
    detail_html = ""
    if fetch_eps or not api_item:
        try:
            d = get_with_retry(client, f"{base}/phim/{slug}", cfg)
            detail_html = d.text
        except Exception as ex:  # noqa: BLE001
            print(f"[warn] detail {slug}: {ex}")
            failures.append(str(ex))
            if fetch_eps:
                set_state(con, state_key, str(ex))
                con.commit()
    if preserve_metadata:
        film = None
    elif api_item:
        film = film_from_api(api_item, base)
        if detail_html:
            extra = parse_film_detail(detail_html, slug, base)
            for k in ("country", "directors", "description"):
                if not film.get(k) and extra.get(k):
                    film[k] = extra[k]
            if not film.get("poster") and extra.get("poster"):
                film["poster"] = extra["poster"]
    elif detail_html:
        film = parse_film_detail(detail_html, slug, base)
    else:
        return False, 0
    changed = upsert_film(con, film) if film else False
    con.commit()
    new_eps = 0
    if fetch_eps and detail_html:
        embedded = parse_embedded_episodes(detail_html, slug, base, cfg.get("ad_blocklist", []))
        resolved = set()
        for episode in embedded:
            if episode["embed_url"] or episode["m3u8_url"]:
                new_eps += upsert_episode(con, episode)
                resolved.add((episode["server_slug"], episode["ep_index"]))
        con.commit()
        eps = [episode for episode in parse_watch_servers(detail_html)
               if episode["film_slug"] == slug]
        eps.extend(episode for episode in embedded
                   if (episode["server_slug"], episode["ep_index"]) not in resolved)
        queued = {(episode["server_slug"], episode["ep_index"]) for episode in eps}
        expanded_servers = set()
        for e in eps:
            if (e["server_slug"], e["ep_index"]) in resolved:
                continue
            if e["watch_url"].startswith("/"):
                e["watch_url"] = base + e["watch_url"]
            cur = con.execute(
                "SELECT id FROM episodes WHERE film_slug=? AND server_slug=? AND ep_index=?",
                (slug, e["server_slug"], e["ep_index"]))
            existing = cur.fetchone()
            if existing and not refresh_links and e["server_slug"] in expanded_servers:
                continue
            try:
                w = get_with_retry(client, e["watch_url"], cfg)
                for episode in parse_embedded_episodes(w.text, slug, base, cfg.get("ad_blocklist", [])):
                    if episode["embed_url"] or episode["m3u8_url"]:
                        new_eps += upsert_episode(con, episode)
                        resolved.add((episode["server_slug"], episode["ep_index"]))
                con.commit()
                if e["server_slug"] not in expanded_servers:
                    for episode in parse_watch_servers(w.text):
                        key = (episode["server_slug"], episode["ep_index"])
                        if episode["film_slug"] == slug and key not in queued:
                            queued.add(key)
                            eps.append(episode)
                    expanded_servers.add(e["server_slug"])
                if (e["server_slug"], e["ep_index"]) in resolved:
                    continue
                embed, m3u8 = extract_embed(w.text, base, cfg.get("ad_blocklist", []))
                if not embed and not m3u8:
                    failures.append(f"No player: {e['watch_url']}")
                    continue
                e["embed_url"] = embed
                e["m3u8_url"] = m3u8
                if upsert_episode(con, e):
                    new_eps += 1
                con.commit()
            except Exception as ex:  # noqa: BLE001
                print(f"[warn] watch {e['watch_url']}: {ex}")
                failures.append(str(ex))
            polite_sleep(cfg)
        if not eps and not embedded:
            failures.append("No episode list found; source may be unreleased or parser unsupported")
    if fetch_eps:
        set_state(con, state_key, "; ".join(failures)[:2000] if failures else "ok")
        con.commit()
    return changed, new_eps


def repair_episodes(cfg=None, limit_films=None):
    cfg = cfg or load_config()
    con = connect(cfg["db_path"])
    rows = con.execute(
        "SELECT slug FROM films WHERE NOT EXISTS (SELECT 1 FROM crawl_state "
        "WHERE k='episodes_v2:' || films.slug AND v='ok') ORDER BY slug LIMIT ?",
        (limit_films if limit_films is not None else -1,)).fetchall()
    stats = {"films": 0, "episodes": 0, "failed": 0}
    try:
        with make_client(cfg) as client:
            for row in rows:
                slug = row["slug"]
                _, updated = _process_film(
                    client, con, cfg, cfg["base_url"].rstrip("/"), slug,
                    refresh_links=True, preserve_metadata=True)
                state = con.execute("SELECT v FROM crawl_state WHERE k=?", (f"episodes_v2:{slug}",)).fetchone()
                stats["films"] += 1
                stats["episodes"] += updated
                stats["failed"] += state["v"] != "ok"
                print(f"[repair] {stats['films']}/{len(rows)} {slug}: updated={updated} status={state['v']}", flush=True)
                polite_sleep(cfg)
    finally:
        con.close()
    return stats


def crawl_once(cfg=None, limit_films=None, full=False, refresh_links=False) -> dict:
    cfg = cfg or load_config()
    base = cfg["base_url"].rstrip("/")
    api_limit = cfg.get("api_limit", 50)
    con = connect(cfg["db_path"])
    stats = {"films": 0, "films_changed": 0, "episodes": 0, "pages": 0}
    with make_client(cfg) as client:
        if full:
            state = con.execute("SELECT v FROM crawl_state WHERE k='full_page'").fetchone()
            start_page = int(state["v"]) if state else 1
            state = con.execute("SELECT v FROM crawl_state WHERE k='full_offset'").fetchone()
            start_offset = int(state["v"]) if state else 0
            page = start_page
            stopped_early = False
            completed = False
            while True:
                try:
                    items, pag = api_movies_page(client, cfg, page, api_limit)
                except Exception as ex:  # noqa: BLE001
                    print(f"[warn] api page {page}: {ex}")
                    break
                if not items:
                    completed = True
                    break
                total_pages = (pag or {}).get("total_pages", "?")
                print(f"[full] page {page}/{total_pages} ({len(items)} items)")
                offset = start_offset if page == start_page else 0
                for item_index, it in enumerate(items[offset:], start=offset):
                    if limit_films and stats["films"] >= limit_films:
                        set_state(con, "full_page", str(page))
                        set_state(con, "full_offset", str(item_index))
                        con.commit()
                        stopped_early = True
                        break
                    slug = it.get("slug")
                    if not slug:
                        continue
                    ch, ne = _process_film(
                        client, con, cfg, base, slug, api_item=it,
                        fetch_eps=False)
                    stats["films"] += 1
                    stats["films_changed"] += ch
                    stats["episodes"] += ne
                    set_state(con, "full_page", str(page))
                    set_state(con, "full_offset", str(item_index + 1))
                    con.commit()
                    polite_sleep(cfg)
                if stopped_early:
                    break
                stats["pages"] += 1
                set_state(con, "full_page", str(page + 1))
                set_state(con, "full_offset", "0")
                con.commit()
                page += 1
                polite_sleep(cfg, fast=True)
            if completed:
                set_state(con, "full_page", "1")
                set_state(con, "full_offset", "0")
                con.commit()
        else:
            cap = limit_films or cfg.get("max_films_per_run", 60)
            pages_needed = max(1, (cap + api_limit - 1) // api_limit)
            seen = 0
            for page in range(1, pages_needed + 1):
                try:
                    items, pag = api_movies_page(client, cfg, page, api_limit)
                except Exception as ex:  # noqa: BLE001
                    print(f"[warn] api page {page}: {ex}")
                    break
                if not items:
                    break
                stats["pages"] += 1
                for it in items:
                    if seen >= cap:
                        break
                    slug = it.get("slug")
                    if not slug:
                        continue
                    ch, ne = _process_film(
                        client, con, cfg, base, slug, api_item=it,
                        fetch_eps=False)
                    stats["films"] += 1
                    stats["films_changed"] += ch
                    stats["episodes"] += ne
                    seen += 1
                    polite_sleep(cfg)
                if seen >= cap:
                    break
                polite_sleep(cfg, fast=True)
            extra_slugs: list[str] = []
            for url in [f"{base}/", f"{base}/phim-han", f"{base}/phim-trung"]:
                try:
                    r = get_with_retry(client, url, cfg)
                    for s in parse_card_slugs(r.text, base):
                        if s not in extra_slugs:
                            extra_slugs.append(s)
                except Exception as ex:  # noqa: BLE001
                    print(f"[warn] list {url}: {ex}")
            for slug in extra_slugs:
                if stats["films"] >= cap:
                    break
                row = con.execute("SELECT slug FROM films WHERE slug=?", (slug,)).fetchone()
                if row:
                    continue
                ch, ne = _process_film(
                    client, con, cfg, base, slug, fetch_eps=False)
                stats["films"] += 1
                stats["films_changed"] += ch
                stats["episodes"] += ne
                polite_sleep(cfg)
        set_state(con, "last_run", time.strftime("%Y-%m-%dT%H:%M:%S"))
        con.commit()
    con.close()
    print(f"[done] films={stats['films']} changed={stats['films_changed']} "
          f"new_eps={stats['episodes']} pages={stats['pages']}")
    return stats
