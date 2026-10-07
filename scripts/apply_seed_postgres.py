import pathlib
import traceback

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

HOST = "localhost"
PORT = 5432
USER = "postgres"
PASSWORD = "pic103"
DB_NAME = "colegio_appcol"

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "docker" / "postgres" / "init" / "01_schema.sql"
SEED = ROOT / "docker" / "postgres" / "init" / "02_seed.sql"


def read_sql(path: pathlib.Path) -> str:
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1", errors="replace")


def main() -> int:
    print("DB_TARGET", DB_NAME)
    admin = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname="postgres",
        user=USER,
        password=PASSWORD,
        client_encoding="UTF8",
    )
    admin.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = admin.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
    exists = cur.fetchone() is not None
    print("CONNECTED_OK")
    if not exists:
        cur.execute(f'CREATE DATABASE {DB_NAME} WITH ENCODING = \'UTF8\'')
        print("DB_CREATED", DB_NAME)
    else:
        print("DB_EXISTS", DB_NAME)
    cur.close()
    admin.close()

    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DB_NAME,
        user=USER,
        password=PASSWORD,
        client_encoding="UTF8",
    )
    conn.autocommit = True
    cur = conn.cursor()

    for path in (SCHEMA, SEED):
        sql = read_sql(path)
        print("EXEC", path.name)
        cur.execute(sql)

    cur.execute('SELECT COUNT(*) FROM "Alumnos"')
    print("ALUMNOS", cur.fetchone()[0])
    cur.execute('SELECT COUNT(*) FROM "Usuarios"')
    print("USUARIOS", cur.fetchone()[0])
    cur.execute('SELECT "Nombre_de_Usuario", "Rol" FROM "Usuarios" ORDER BY "idUsuarios"')
    for row in cur.fetchall():
        print("USER", row[0], row[1])

    cur.close()
    conn.close()
    print("SEED_OK")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as ex:
        print("ERROR", type(ex).__name__, ex)
        traceback.print_exc()
        raise SystemExit(1)
