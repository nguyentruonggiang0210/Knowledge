-- 001: bảng organizations
CREATE TABLE IF NOT EXISTS organizations (
    id          BIGSERIAL PRIMARY KEY,
    login       TEXT NOT NULL UNIQUE,
    name        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
