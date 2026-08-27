-- PostgreSQL teaching example. Rehearse lock/rewrite behavior with production-like
-- volume before applying. Each phase is deployed separately.

-- Phase 1: expand. Nullable avoids forcing every existing row to be rewritten by
-- application logic in the same release.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_v2 text;

-- New application versions dual-write status and status_v2. Backfill in bounded,
-- checkpointed batches from an external migration worker; do not run one unbounded
-- transaction blindly. A conceptual batch:
WITH batch AS (
  SELECT id
  FROM orders
  WHERE status_v2 IS NULL
  ORDER BY id
  LIMIT 1000
  FOR UPDATE SKIP LOCKED
)
UPDATE orders AS target
SET status_v2 = target.status
FROM batch
WHERE target.id = batch.id;

-- Verify before switching reads.
SELECT count(*) AS rows_not_migrated
FROM orders
WHERE status_v2 IS NULL;

-- Phase 2: after every writer and row is migrated, add/validate the required
-- constraint using the safest online procedure supported by your engine/version.
ALTER TABLE orders
  ADD CONSTRAINT orders_status_v2_present
  CHECK (status_v2 IS NOT NULL) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_status_v2_present;

-- Phase 3 (a later release): stop old readers/writers, then contract. The exact
-- rename/drop sequence requires an approved change and rollback/roll-forward plan.
