"""Scheduler: run incremental crawl every 3 hours. `python scheduler.py --once` for a single run."""
import argparse
import time

from apscheduler.schedulers.blocking import BlockingScheduler

from crawler import crawl_once, load_config
from supplemental import crawl_supplemental, source_name

INTERVAL_HOURS = 3


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true", help="single crawl then exit")
    ap.add_argument("--limit", type=int, default=None, help="cap films this run")
    ap.add_argument("--full", action="store_true", help="exhaustive sweep of the whole catalogue via API (resumable)")
    ap.add_argument("--refresh-links", action="store_true",
                    help="deprecated: player links are no longer collected")
    ap.add_argument("--repair", action="store_true", help="deprecated: episodes are no longer collected")
    ap.add_argument("--source-url", action="append", metavar="HTTPS_URL",
                    help="crawl additional supported catalogue (motchillv.xyz or tophim.top); repeat for both")
    args = ap.parse_args()
    if args.limit is not None and args.limit < 1:
        ap.error("--limit must be positive")
    if args.repair or args.refresh_links:
        ap.error("player links are no longer collected; remove --repair/--refresh-links")
    if args.source_url:
        if not args.once or args.repair or args.refresh_links:
            ap.error("--source-url requires --once and cannot be combined with --repair or --refresh-links")
        for url in args.source_url:
            try:
                source_name(url)
            except ValueError as exc:
                ap.error(str(exc))
    cfg = load_config()
    hours = cfg.get("interval_hours", INTERVAL_HOURS)
    def scheduled_run():
        crawl_once(cfg)
        for url in cfg.get("supplemental_sources", []):
            try:
                print(f"[{source_name(url)}] {crawl_supplemental(cfg, url, limit_films=cfg.get('supplemental_films_per_run', 10))}", flush=True)
            except Exception as exc:
                print(f"[warn] supplemental {url}: {exc}", flush=True)
    if args.once:
        if args.source_url:
            for url in args.source_url:
                cap = None if args.full else (args.limit or cfg.get("supplemental_films_per_run", 10))
                print(f"[{source_name(url)}] {crawl_supplemental(cfg, url, limit_films=cap)}", flush=True)
            return
        if args.full or args.limit is not None:
            crawl_once(cfg, limit_films=args.limit, full=args.full)
        else:
            scheduled_run()
        return
    sched = BlockingScheduler()
    sched.add_job(scheduled_run, "interval", hours=hours,
                  misfire_grace_time=600, coalesce=True, jitter=300,
                  next_run_time=None)
    print(f"[scheduler] every {hours}h — first run now")
    scheduled_run()
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        print("[scheduler] stopped")
        raise SystemExit(0)


if __name__ == "__main__":
    main()
