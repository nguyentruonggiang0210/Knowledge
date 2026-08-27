"""Tính top trending theo category/ngày (window function RANK)."""
from __future__ import annotations

from pyspark.sql import DataFrame
from pyspark.sql import functions as F
from pyspark.sql.window import Window


def transform(df: DataFrame, top_n: int = 25) -> DataFrame:
    """Xếp hạng repo theo số star trong từng (category, ngày), giữ top_n."""
    day = F.to_date("recorded_at").alias("day")
    window = Window.partitionBy("category", day).orderBy(F.col("stars").desc())

    return (
        df.withColumn("day", F.to_date("recorded_at"))
        .withColumn("rank", F.rank().over(window))
        .filter(F.col("rank") <= top_n)
        .select("day", "category", "rank", "repo_id", "repo_name", "stars")
    )
