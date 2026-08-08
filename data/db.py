import os
import dotenv
from psycopg_pool import ConnectionPool

dotenv.load_dotenv()
DATABASE_URL = os.environ['DATABASE_URL']

# Keeps connections to the (remote) Postgres instance warm across requests so
# each request borrows an already-negotiated TCP/TLS connection instead of
# paying full connection setup latency every time.
_pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=10, open=True)

def get_db():
    """Returns a connection checked out from the pool. Caller is responsible
    for returning it via release_db() once done (see app.py's per-request
    checkout/teardown)."""
    return _pool.getconn()

def release_db(conn):
    _pool.putconn(conn)
