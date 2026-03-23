import os
import sys
import psycopg
import dotenv

dotenv.load_dotenv()
DATABASE_URL = os.environ['DATABASE_URL']

def get_db():
    try:
        conn = psycopg.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)