# Defaults to auto-discover top songs for each artist in ARTISTS_BY_GENRE
#   Connects to local database (.env)
#   1 API call per artist
#   60 artists × 5s sleep = ~5 minutes total
#
# CLI modes:
#   python seed_songs.py
#     → Seeds all artists from ARTISTS_BY_GENRE using local database
#   
#   python seed_songs.py --database-url "postgresql://user:password@host:port/db"
#     → Seeds all artists from ARTISTS_BY_GENRE using remote database (e.g., Render)
#   
#   python seed_songs.py "Artist|Song Title" "Artist2|Song Title2" ...
#     → Seeds specific songs manually using local database
#   
#   python seed_songs.py --database-url "postgresql://..." "Artist|Song Title" ...
#     → Seeds specific songs manually using remote database

import json
import requests
import time
import os
import sys
import psycopg
from db import get_db
from vector_utils import build_feature_vector, l2_normalize

# How many songs to pull per artist (filters for preview URL availability)
SONGS_PER_ARTIST = 8

# Artists grouped by genre — iTunes returns their top songs sorted by popularity
# Covers all 12 genre slots in the feature vector
# ~60 artists × 8 songs = ~480 songs (before filtering for missing preview URLs)
ARTISTS_BY_GENRE = {
    "pop": [
        "Taylor Swift", "Ed Sheeran", "Ariana Grande", "Dua Lipa",
        "Olivia Rodrigo", "Harry Styles", "Billie Eilish", "Post Malone",
        "Bruno Mars", "Katy Perry", "Lady Gaga", "Shawn Mendes",
    ],
    "hip-hop": [
        "Drake", "Kendrick Lamar", "J. Cole", "Travis Scott",
        "Future", "Lil Baby", "Tyler, the Creator", "Mac Miller",
        "Childish Gambino", "A$AP Rocky", "Nicki Minaj", "Cardi B",
    ],
    "r&b": [
        "The Weeknd", "SZA", "Don Toliver", "Khalid",
        "Daniel Caesar", "Bryson Tiller", "H.E.R.", "Summer Walker",
        "Ella Mai", "Frank Ocean", "Usher", "Miguel",
    ],
    "rock": [
        "Foo Fighters", "Red Hot Chili Peppers", "Arctic Monkeys",
        "The Strokes", "Nirvana", "Coldplay", "Imagine Dragons",
        "Twenty One Pilots", "The Killers", "Muse",
    ],
    "electronic": [
        "Calvin Harris", "Daft Punk", "The Chainsmokers",
        "Marshmello", "Avicii", "Zedd", "Kygo", "Disclosure",
    ],
    "country": [
        "Morgan Wallen", "Luke Combs", "Chris Stapleton",
        "Kacey Musgraves", "Zac Brown Band", "Thomas Rhett",
        "Tyler Childers", "Eric Church",
    ],
    "alternative": [
        "Tame Impala", "Vampire Weekend", "Bon Iver",
        "Lorde", "Hozier", "Alt-J", "Arcade Fire", "The National",
    ],
    "latin": [
        "Bad Bunny", "J Balvin", "Maluma", "Daddy Yankee",
        "Shakira", "Ozuna", "Rauw Alejandro", "Becky G",
    ],
    "metal": [
        "Metallica", "Linkin Park", "System of a Down",
        "Slipknot", "Avenged Sevenfold", "Disturbed",
    ],
    "indie": [
        "Mac DeMarco", "Phoebe Bridgers", "Clairo", "Mitski",
        "Waxahatchee", "Soccer Mommy", "Snail Mail",
        "Kids That Fly", "WHALES•TALK",
    ],
    "jazz": [
        "Norah Jones", "Amy Winehouse", "John Legend",
        "Alicia Keys", "Leon Bridges",
    ],
}

# returns the top n songs for an artist that have preview URLs
def fetch_top_songs_for_artist(artist, n=SONGS_PER_ARTIST):
    try:
        resp = requests.get("https://itunes.apple.com/search", params={
            "term": artist,
            "media": "music",
            "entity": "song",
            "attribute": "artistTerm",
            "limit": 50,  # fetch more so we can filter down to n with preview URLs
        }, timeout=10)
        results = resp.json().get("results", [])
    except requests.exceptions.RequestException as e:
        print(f"Request failed for {artist}: {e}")
        return []

    # filter to songs that actually match the artist and have a preview URL
    # aka songs we can play
    matches = [
        r for r in results
        if artist.lower() in r.get("artistName", "").lower()
        and r.get("previewUrl")
    ]
    return matches[:n]

# Insert a song dict from iTunes API into the DB + its artist and feature vector
def insert_track(cur, track):
    genre = track.get("primaryGenreName")
    release_date = track.get("releaseDate")
    duration_ms = track.get("trackTimeMillis")
    itunes_track_id = str(track["trackId"])

    feature_vec = l2_normalize(build_feature_vector(genre, release_date, duration_ms))

    cur.execute(
        "INSERT INTO artists (artist_name) VALUES (%s) ON CONFLICT (artist_name) DO NOTHING;",
        (track["artistName"],)
    )
    cur.execute(
        "SELECT artist_id FROM artists WHERE artist_name = %s",
        (track["artistName"],)
    )
    artist_id = cur.fetchone()[0]

    cur.execute(
        """INSERT INTO songs (song_name, preview_mp3_url, song_image_url, duration_ms, genre,
                              release_date, itunes_track_id, feature_vector)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (itunes_track_id) DO NOTHING
           RETURNING song_id""",
        (track["trackName"], track["previewUrl"], track["artworkUrl100"].replace("100x100bb", "600x600bb"),
         duration_ms, genre, release_date, itunes_track_id, json.dumps(feature_vec))
    )
    row = cur.fetchone()
    if row is None:
        return False  # already in DB
    song_id = row[0]

    cur.execute(
        "INSERT INTO song_artists (song_id, artist_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
        (song_id, artist_id)
    )
    return True

# Batch insert all tracks in a single operation
def batch_insert_tracks(cur, tracks):
    """Insert all tracks at once for better performance"""
    if not tracks:
        return 0
    
    # Step 1: Insert all unique artists
    artist_names = {track["artistName"] for track in tracks}
    artist_values = [(name,) for name in artist_names]
    cur.executemany(
        "INSERT INTO artists (artist_name) VALUES (%s) ON CONFLICT (artist_name) DO NOTHING;",
        artist_values
    )
    
    # Step 2: Get artist IDs
    cur.execute(
        "SELECT artist_name, artist_id FROM artists WHERE artist_name = ANY(%s)",
        (list(artist_names),)
    )
    artist_map = {row[0]: row[1] for row in cur.fetchall()}
    
    # Step 3: Prepare song data
    song_data = []
    song_artist_data = []
    
    for track in tracks:
        genre = track.get("primaryGenreName")
        release_date = track.get("releaseDate")
        duration_ms = track.get("trackTimeMillis")
        itunes_track_id = str(track["trackId"])
        feature_vec = l2_normalize(build_feature_vector(genre, release_date, duration_ms))
        
        song_data.append((
            track["trackName"],
            track["previewUrl"],
            track["artworkUrl100"].replace("100x100bb", "600x600bb"),
            duration_ms,
            genre,
            release_date,
            itunes_track_id,
            json.dumps(feature_vec),
            track["artistName"]  # temporary, will use to link to artist_id
        ))
    
    # Step 4: Batch insert songs and get IDs
    added = 0
    for song_row in song_data:
        # Unpack all but the artist name
        song_values = song_row[:-1]
        artist_name = song_row[-1]
        
        cur.execute(
            """INSERT INTO songs (song_name, preview_mp3_url, song_image_url, duration_ms, genre,
                                  release_date, itunes_track_id, feature_vector)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (itunes_track_id) DO NOTHING
               RETURNING song_id""",
            song_values
        )
        result = cur.fetchone()
        if result:
            song_id = result[0]
            artist_id = artist_map[artist_name]
            song_artist_data.append((song_id, artist_id))
            added += 1
    
    # Step 5: Batch insert song_artist relationships
    if song_artist_data:
        cur.executemany(
            "INSERT INTO song_artists (song_id, artist_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
            song_artist_data
        )
    
    return added

# Get database connection - checks for DATABASE_URL env var or --database-url CLI arg
def get_connection():
    # Check for --database-url argument
    if len(sys.argv) > 1 and sys.argv[1] == "--database-url" and len(sys.argv) > 2:
        database_url = sys.argv[2]
        print(f"Connecting to remote database: {database_url[:50]}...")
        conn = psycopg.connect(database_url)
        # Remove these args so they don't get processed as songs
        sys.argv.pop(1)
        sys.argv.pop(1)
        return conn
    
    # Check for DATABASE_URL environment variable
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        print(f"Connecting to database from DATABASE_URL env var: {database_url[:50]}...")
        conn = psycopg.connect(database_url)
        return conn
    
    # Default to local database
    print("Connecting to local database...")
    return get_db()

conn = get_connection()
print(conn)
# CLI mode: seed specific songs manually
if len(sys.argv) > 1:
    songs_to_seed = [tuple(arg.split("|", 1)) for arg in sys.argv[1:]]
    with conn.cursor() as cur:
        for artist, song in songs_to_seed:
            try:
                resp = requests.get("https://itunes.apple.com/search", params={
                    "term": f"{artist} {song}",
                    "media": "music",
                    "entity": "song",
                    "limit": 5
                }, timeout=10)
                results = resp.json().get("results", [])
            except requests.exceptions.RequestException as e:
                print(f"Request failed for '{song}' by {artist}: {e}")
                continue
            # time.sleep(5)

            track = next(
                (r for r in results
                 if artist.lower() in r["artistName"].lower()
                 and song.lower() in r["trackName"].lower()),
                None
            )
            if not track:
                print(f"Skipping '{song}' by {artist}: no matching result found")
                continue
            if not track.get("previewUrl"):
                print(f"Skipping {track['trackName']}: no preview URL")
                continue

            if not insert_track(cur, track):
                print("Already in DB, skipping.")

        conn.commit()
    print("Done!")

# fetch top songs per artist in each genre
else:
    total_added = 0
    all_tracks = []
    
    # Collect all tracks first
    with conn.cursor() as cur:
        for genre, artists in ARTISTS_BY_GENRE.items():
            for artist in artists:
                print(f"  Fetching: {artist}")
                tracks = fetch_top_songs_for_artist(artist)
                all_tracks.extend(tracks)
        
        # Batch insert all tracks at once
        print(f"\nBatch inserting {len(all_tracks)} songs...")
        total_added = batch_insert_tracks(cur, all_tracks)
        conn.commit()
    
    print(f"Done! {total_added} new songs added.")
