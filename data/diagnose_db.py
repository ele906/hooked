import psycopg

DB_URL = "postgresql://hooked_db_user:f8908uzkpULhtEd0IUAscUvJ48BGDTfy@dpg-d799dfn5r7bs73fnjidg-a.oregon-postgres.render.com/hooked_db"
conn = psycopg.connect(DB_URL)
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM songs")
print(f"Total songs: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(*) FROM songs WHERE feature_vector IS NOT NULL")
print(f"Songs with feature_vector: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(*) FROM songs WHERE preview_mp3_url IS NOT NULL")
print(f"Songs with preview URLs: {cur.fetchone()[0]}")

cur.execute("SELECT vector_dims(feature_vector) FROM songs WHERE feature_vector IS NOT NULL LIMIT 1")
row = cur.fetchone()
print(f"Feature vector dims: {row[0] if row else 'N/A'}")

cur.execute("SELECT COUNT(*) FROM user_profiles")
print(f"\nTotal user_profiles: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(*) FROM user_profiles WHERE weight_vector IS NOT NULL")
print(f"Profiles with weight_vector: {cur.fetchone()[0]}")

cur.execute("SELECT vector_dims(weight_vector) FROM user_profiles WHERE weight_vector IS NOT NULL LIMIT 1")
row = cur.fetchone()
print(f"Weight vector dims: {row[0] if row else 'N/A'}")

cur.execute("SELECT user_id, weight_vector IS NOT NULL as has_wv FROM user_profiles WHERE user_id = 51")
row = cur.fetchone()
print(f"\nUser 51 profile: {row if row else 'NOT FOUND'}")

cur.execute("SELECT COUNT(*) FROM liked WHERE user_id = 51")
print(f"User 51 liked: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(*) FROM disliked WHERE user_id = 51")
print(f"User 51 disliked: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(DISTINCT song_id) FROM song_artists")
print(f"\nSongs with artist links: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(*) FROM artists")
print(f"Total artists: {cur.fetchone()[0]}")

cur.execute("""
    SELECT s.song_id, s.song_name, a.artist_name
    FROM songs s
    JOIN song_artists sa ON s.song_id = sa.song_id
    JOIN artists a ON sa.artist_id = a.artist_id
    WHERE s.feature_vector IS NOT NULL
    LIMIT 3
""")
print("\nSample songs (with artist join + vector):")
for row in cur.fetchall():
    print(f"  {row}")

# Check if any songs exist that DON'T have an artist link
cur.execute("""
    SELECT COUNT(*) FROM songs s
    LEFT JOIN song_artists sa ON s.song_id = sa.song_id
    WHERE sa.song_id IS NULL
""")
print(f"\nSongs WITHOUT artist links: {cur.fetchone()[0]}")

conn.close()
