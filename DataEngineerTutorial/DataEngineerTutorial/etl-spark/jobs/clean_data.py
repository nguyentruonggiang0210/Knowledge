"""Đọc CSV, dedup, validate, xử lý null."""
from __future__ import annotations

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F

from utils.schema import GITHUB_TRENDING_SCHEMA


def clean(spark: SparkSession, csv_path: str) -> DataFrame:
    """Đọc CSV gốc và trả về DataFrame đã được làm sạch."""
    df = spark.read.csv(csv_path, header=True, schema=GITHUB_TRENDING_SCHEMA)

    return (
        df.dropDuplicates(["repo_id", "recorded_at"])
        .filter(F.col("repo_id").isNotNull() & F.col("recorded_at").isNotNull())
        .fillna({"stars": 0, "forks": 0, "watchers": 0})
        .withColumn("language", F.coalesce(F.col("language"), F.lit("Unknown")))
    )
