import requests
import time
from db import get_db
import sys

conn = get_db()
curr = conn.cursor()

try:
    curr.execute(
        "INSERT INTO songs (song_name, preview_mp3_url, song_image_url) VALUES (%s, %s, %s)",
        (
            'Goose Honk',
            'http://localhost:5000/static/goose.mp3',
            'https://upload.wikimedia.org/wikipedia/commons/8/8c/Big_Goose_%285697124559%29.jpg'
        )
    )
    conn.commit()
    print("goose!")
except Exception as e:
    print(f"Insert failed: {e}")
    conn.rollback()