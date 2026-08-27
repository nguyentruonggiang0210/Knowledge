-- Data mẫu nhỏ để dev/test không cần chạy full Spark job.
INSERT INTO organizations (id, login, name) VALUES
    (1, 'acme', 'Acme Inc'),
    (2, 'globex', 'Globex')
ON CONFLICT (id) DO NOTHING;

INSERT INTO repositories (id, organization_id, name, language, category) VALUES
    (101, 1, 'awesome-lib', 'Python', 'library'),
    (102, 1, 'fast-api-demo', 'Python', 'framework'),
    (103, 2, 'ng-dashboard', 'TypeScript', 'frontend')
ON CONFLICT (id) DO NOTHING;

INSERT INTO repo_daily_stats (repo_id, recorded_at, stars, forks, watchers) VALUES
    (101, '2026-07-01', 1200, 100, 80),
    (101, '2026-07-02', 1300, 110, 85),
    (102, '2026-07-01', 500, 40, 30),
    (103, '2026-07-01', 900, 60, 50)
ON CONFLICT (repo_id, recorded_at) DO NOTHING;
