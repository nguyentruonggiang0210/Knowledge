"""StructType schema cho CSV gốc (tránh để Spark tự infer sai kiểu)."""
from __future__ import annotations

from pyspark.sql.types import (
    IntegerType,
    LongType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)

GITHUB_TRENDING_SCHEMA = StructType(
    [
        StructField("repo_id", LongType(), nullable=False),
        StructField("repo_name", StringType(), nullable=False),
        StructField("organization", StringType(), nullable=True),
        StructField("language", StringType(), nullable=True),
        StructField("category", StringType(), nullable=True),
        StructField("stars", IntegerType(), nullable=True),
        StructField("forks", IntegerType(), nullable=True),
        StructField("watchers", IntegerType(), nullable=True),
        StructField("recorded_at", TimestampType(), nullable=False),
    ]
)
