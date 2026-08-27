-- Top trending repo theo category trong 1 ngày (window RANK).
SELECT day, category, rnk, repo_id, name, stars
FROM (
    SELECT
        s.recorded_at::date AS day,
        r.category,
        r.id AS repo_id,
        r.name,
        s.stars,
        RANK() OVER (PARTITION BY r.category, s.recorded_at::date ORDER BY s.stars DESC) AS rnk
    FROM repo_daily_stats s
    JOIN repositories r ON r.id = s.repo_id
) ranked
WHERE rnk <= 10
ORDER BY day DESC, category, rnk;
