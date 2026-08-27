import os

import pg8000.dbapi


def read_secret(path):
    with open(path, encoding="utf-8") as secret_file:
        return secret_file.read().strip()


connection = pg8000.dbapi.connect(
    host=os.environ.get("DB_HOST", "db"),
    port=int(os.environ.get("DB_PORT", "5432")),
    database=os.environ.get("DB_NAME", "app"),
    user=os.environ.get("DB_USER", "app"),
    password=read_secret(os.environ["DB_PASSWORD_FILE"]),
    timeout=5,
)
try:
    cursor = connection.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS visits (
            id BIGSERIAL PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.commit()
    print("migration completed", flush=True)
finally:
    connection.close()
