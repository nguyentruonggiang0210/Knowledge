"""Tính growth rate theo repo (LAG/LEAD window function)."""
from __future__ import annotations

from pyspark.sql import DataFrame
from pyspark.sql import functions as F
from pyspark.sql.window import Window


def transform(df: DataFrame) -> DataFrame:
    """Tính tăng trưởng star ngày-qua-ngày cho từng repo."""
    window = Window.partitionBy("repo_id").orderBy("recorded_at")
    prev_stars = F.lag("stars").over(window)

    return (
        df.withColumn("prev_stars", prev_stars)
        .withColumn("star_delta", F.col("stars") - F.col("prev_stars"))
        .withColumn(
            "growth_rate",
            F.when(F.col("prev_stars") > 0, F.col("star_delta") / F.col("prev_stars")).otherwise(
                F.lit(None)
            ),
        )
        .select("repo_id", "repo_name", "recorded_at", "stars", "star_delta", "growth_rate")
    )
