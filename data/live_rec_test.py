import sys
sys.path.insert(0, '.')
import dotenv
dotenv.load_dotenv(dotenv.find_dotenv())

from db import get_db
from vector_utils import cosine_similarity

conn = get_db()
with conn.cursor() as cur:
    cur.execute("SELECT weight_vector FROM user_profiles WHERE user_id = 1")
    weight_vec = cur.fetchone()[0]

    cur.execute("""
        SELECT DISTINCT ON (s.song_id)
                s.song_name, a.artist_name, s.genre, s.feature_vector
        FROM songs s
        LEFT JOIN song_artists sa ON s.song_id = sa.song_id
        LEFT JOIN artists a ON sa.artist_id = a.artist_id
        WHERE s.feature_vector IS NOT NULL
    """)
    songs = cur.fetchall()

conn.close()

ranked = sorted(songs, key=lambda r: cosine_similarity(weight_vec, r[3]), reverse=True)

print("Top 15 songs matching your current taste profile:\n")
for song_name, artist, genre, _ in ranked[:15]:
    print(f"  {artist} — {song_name} ({genre})")
