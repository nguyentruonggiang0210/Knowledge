-- 002: bảng repositories
CREATE TABLE IF NOT EXISTS repositories (
    id               BIGINT PRIMARY KEY,
    organization_id  BIGINT REFERENCES organizations(id),
    name             TEXT NOT NULL,
    language         TEXT,
    category         TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
