-- Tổng hợp star theo language theo tháng.
SELECT
    r.language,
    date_trunc('month', s.recorded_at) AS month,
    SUM(s.stars) AS total_stars,
    COUNT(DISTINCT r.id) AS repo_count
FROM repo_daily_stats s
JOIN repositories r ON r.id = s.repo_id
GROUP BY r.language, date_trunc('month', s.recorded_at)
ORDER BY month DESC, total_stars DESC;
