-- Business state and event intent are committed atomically.
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_outbox (
  event_id uuid PRIMARY KEY,
  aggregate_id uuid NOT NULL REFERENCES orders(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS order_outbox_unpublished_idx
  ON order_outbox (created_at)
  WHERE published_at IS NULL;

-- A relay claims bounded rows, publishes, then marks them. A crash between publish
-- and mark can duplicate delivery, so consumers still require idempotency/dedup.
