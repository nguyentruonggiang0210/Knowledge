-- Growth rate star ngày-qua-ngày cho từng repo (LAG window).
SELECT
    repo_id,
    recorded_at::date AS day,
    stars,
    stars - LAG(stars) OVER (PARTITION BY repo_id ORDER BY recorded_at) AS star_delta,
    CASE
        WHEN LAG(stars) OVER (PARTITION BY repo_id ORDER BY recorded_at) > 0
        THEN (stars - LAG(stars) OVER (PARTITION BY repo_id ORDER BY recorded_at))::numeric
             / LAG(stars) OVER (PARTITION BY repo_id ORDER BY recorded_at)
    END AS growth_rate
FROM repo_daily_stats
ORDER BY repo_id, day;
