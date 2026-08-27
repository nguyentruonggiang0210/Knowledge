"""Tổng hợp star theo language theo tháng."""
from __future__ import annotations

from pyspark.sql import DataFrame
from pyspark.sql import functions as F


def transform(df: DataFrame) -> DataFrame:
    """Tổng số star và số repo theo (language, tháng)."""
    return (
        df.withColumn("month", F.date_trunc("month", "recorded_at"))
        .groupBy("language", "month")
        .agg(
            F.sum("stars").alias("total_stars"),
            F.countDistinct("repo_id").alias("repo_count"),
        )
        .orderBy("month", F.col("total_stars").desc())
    )
