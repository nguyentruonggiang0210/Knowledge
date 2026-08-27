CREATE DATABASE IF NOT EXISTS ecommerce;

CREATE TABLE IF NOT EXISTS ecommerce.events
(
    event_id UUID,
    event_time DateTime64(3, 'UTC'),
    event_date Date MATERIALIZED toDate(event_time),
    user_id UInt64,
    session_id UUID,
    event_type LowCardinality(String),
    product_id UInt64,
    category LowCardinality(String),
    price Decimal(12, 2),
    quantity UInt16,
    country FixedString(2),
    device LowCardinality(String),
    properties Map(String, String),
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event_type, user_id, event_time, event_id)
TTL event_date + INTERVAL 2 YEAR DELETE
SETTINGS index_granularity = 8192;

CREATE TABLE IF NOT EXISTS ecommerce.orders
(
    order_id UInt64,
    user_id UInt64,
    status LowCardinality(String),
    total_amount Decimal(14, 2),
    created_at DateTime64(3, 'UTC'),
    updated_at DateTime64(3, 'UTC'),
    version UInt64,
    is_deleted UInt8 DEFAULT 0
)
ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(created_at)
ORDER BY order_id;

CREATE TABLE IF NOT EXISTS ecommerce.order_items
(
    order_id UInt64,
    product_id UInt64,
    category LowCardinality(String),
    quantity UInt16,
    unit_price Decimal(12, 2),
    created_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (category, product_id, created_at, order_id);

INSERT INTO ecommerce.events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
VALUES
    ('00000000-0000-0000-0000-000000000001', '2025-01-05 08:00:00.000', 101, '10000000-0000-0000-0000-000000000001', 'view',     1001, 'books',       15.90, 1, 'VN', 'mobile',  map('campaign', 'new-year')),
    ('00000000-0000-0000-0000-000000000002', '2025-01-05 08:03:00.000', 101, '10000000-0000-0000-0000-000000000001', 'add_cart', 1001, 'books',       15.90, 1, 'VN', 'mobile',  map('campaign', 'new-year')),
    ('00000000-0000-0000-0000-000000000003', '2025-01-05 08:10:00.000', 101, '10000000-0000-0000-0000-000000000001', 'purchase', 1001, 'books',       15.90, 1, 'VN', 'mobile',  map('payment', 'card')),
    ('00000000-0000-0000-0000-000000000004', '2025-01-05 09:00:00.000', 102, '10000000-0000-0000-0000-000000000002', 'view',     2001, 'electronics', 799.00, 1, 'TH', 'desktop', map('campaign', 'organic')),
    ('00000000-0000-0000-0000-000000000005', '2025-01-05 09:20:00.000', 102, '10000000-0000-0000-0000-000000000002', 'add_cart', 2001, 'electronics', 799.00, 1, 'TH', 'desktop', map('campaign', 'organic')),
    ('00000000-0000-0000-0000-000000000006', '2025-01-06 03:00:00.000', 103, '10000000-0000-0000-0000-000000000003', 'view',     3001, 'fashion',      42.50, 1, 'VN', 'tablet',  map('campaign', 'social')),
    ('00000000-0000-0000-0000-000000000007', '2025-01-06 03:06:00.000', 103, '10000000-0000-0000-0000-000000000003', 'purchase', 3001, 'fashion',      42.50, 2, 'VN', 'tablet',  map('payment', 'wallet')),
    ('00000000-0000-0000-0000-000000000008', '2025-02-01 12:00:00.000', 104, '10000000-0000-0000-0000-000000000004', 'view',     1002, 'books',       21.00, 1, 'SG', 'mobile',  map('campaign', 'email')),
    ('00000000-0000-0000-0000-000000000009', '2025-02-01 12:05:00.000', 104, '10000000-0000-0000-0000-000000000004', 'purchase', 1002, 'books',       21.00, 3, 'SG', 'mobile',  map('payment', 'card')),
    ('00000000-0000-0000-0000-000000000010', '2025-02-02 14:00:00.000', 101, '10000000-0000-0000-0000-000000000005', 'view',     2002, 'electronics', 119.99, 1, 'VN', 'desktop', map('campaign', 'retarget'));

INSERT INTO ecommerce.orders
    (order_id, user_id, status, total_amount, created_at, updated_at, version, is_deleted)
VALUES
    (5001, 101, 'created',   15.90, '2025-01-05 08:10:00.000', '2025-01-05 08:10:00.000', 1, 0),
    (5001, 101, 'paid',      15.90, '2025-01-05 08:10:00.000', '2025-01-05 08:11:00.000', 2, 0),
    (5002, 103, 'paid',      85.00, '2025-01-06 03:06:00.000', '2025-01-06 03:07:00.000', 1, 0),
    (5003, 104, 'paid',      63.00, '2025-02-01 12:05:00.000', '2025-02-01 12:06:00.000', 1, 0),
    (5004, 105, 'cancelled', 30.00, '2025-02-03 10:00:00.000', '2025-02-03 10:20:00.000', 1, 0);

INSERT INTO ecommerce.order_items VALUES
    (5001, 1001, 'books',       1, 15.90, '2025-01-05 08:10:00.000'),
    (5002, 3001, 'fashion',     2, 42.50, '2025-01-06 03:06:00.000'),
    (5003, 1002, 'books',       3, 21.00, '2025-02-01 12:05:00.000'),
    (5004, 4001, 'home',        1, 30.00, '2025-02-03 10:00:00.000');
