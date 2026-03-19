import os
import sys
import psycopg
import dotenv

dotenv.load_dotenv()
DATABASE_URL = os.environ['DATABASE_URL']

def get_db():
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                print("Successfully connected to Hooked Database!")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)