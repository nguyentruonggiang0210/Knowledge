-- 004: index phục vụ query phân tích
CREATE INDEX IF NOT EXISTS idx_repositories_language ON repositories (language);
CREATE INDEX IF NOT EXISTS idx_repositories_category ON repositories (category);
CREATE INDEX IF NOT EXISTS idx_repo_daily_stats_recorded_at ON repo_daily_stats (recorded_at);
CREATE INDEX IF NOT EXISTS idx_repo_daily_stats_stars ON repo_daily_stats (stars DESC);
