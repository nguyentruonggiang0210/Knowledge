-- 003: bảng lớn repo_daily_stats, partition theo tháng (RANGE trên recorded_at)
CREATE TABLE IF NOT EXISTS repo_daily_stats (
    repo_id      BIGINT NOT NULL REFERENCES repositories(id),
    recorded_at  TIMESTAMPTZ NOT NULL,
    stars        INTEGER NOT NULL DEFAULT 0,
    forks        INTEGER NOT NULL DEFAULT 0,
    watchers     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (repo_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Ví dụ partition tháng 07/2026 (tạo thêm partition khi dữ liệu mở rộng)
CREATE TABLE IF NOT EXISTS repo_daily_stats_2026_07
    PARTITION OF repo_daily_stats
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
