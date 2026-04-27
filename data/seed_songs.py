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
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from db import get_db
from vector_utils import build_feature_vector, build_full_feature_vector, fetch_lyrics, l2_normalize

# Wrapper so threads can log without corrupting tqdm bars
def _tlog(msg):
    tqdm.write(msg)

# How many songs to pull per artist (filters for preview URL availability)
SONGS_PER_ARTIST = 15

NUM_THREADS = 4

ITUNES_CACHE_FILE = os.path.join(os.path.dirname(__file__), ".itunes_cache.json")
VECTORS_CACHE_FILE = os.path.join(os.path.dirname(__file__), ".vectors_cache.json")

def _load_cache():
    if os.path.exists(ITUNES_CACHE_FILE):
        with open(ITUNES_CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

def _save_cache(cache):
    with open(ITUNES_CACHE_FILE, "w") as f:
        json.dump(cache, f)

def _load_vectors_cache():
    if os.path.exists(VECTORS_CACHE_FILE):
        with open(VECTORS_CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

def _save_vectors_cache(cache):
    with open(VECTORS_CACHE_FILE, "w") as f:
        json.dump(cache, f)

_itunes_cache = _load_cache()
_vectors_cache = _load_vectors_cache()

# Artists grouped by genre — iTunes returns their top songs sorted by popularity
# Covers all 12 genre slots in the feature vector
ARTISTS_BY_GENRE = {
    "pop": [
        "Taylor Swift", "Ed Sheeran", "Ariana Grande", "Dua Lipa",
        "Olivia Rodrigo", "Harry Styles", "Billie Eilish", "Post Malone",
        "Bruno Mars", "Katy Perry", "Lady Gaga", "Shawn Mendes",
        "Charlie Puth", "Selena Gomez", "Justin Bieber", "Sam Smith",
        "Lizzo", "Doja Cat", "Camila Cabello", "Halsey",
        "Benson Boone", "Sabrina Carpenter", "Chappell Roan", "Gracie Abrams",
    ],
    "hip-hop": [
        "Drake", "Kendrick Lamar", "J. Cole", "Travis Scott",
        "Future", "Lil Baby", "Tyler, the Creator", "Mac Miller",
        "Childish Gambino", "A$AP Rocky", "Nicki Minaj", "Cardi B",
        "21 Savage", "Lil Uzi Vert", "Gunna", "Polo G",
        "Rod Wave", "NBA YoungBoy", "Kodak Black", "YG",
        "Lil Durk", "Jack Harlow", "Don Toliver", "Quavo",
    ],
    "r&b": [
        "The Weeknd", "SZA", "Khalid", "Daniel Caesar",
        "Bryson Tiller", "H.E.R.", "Summer Walker", "Ella Mai",
        "Frank Ocean", "Usher", "Miguel", "Jhene Aiko",
        "Kehlani", "Lucky Daye", "6LACK", "Giveon",
        "PJ Morton", "Snoh Aalegra", "Ari Lennox", "Brent Faiyaz",
    ],
    "rock": [
        "Foo Fighters", "Red Hot Chili Peppers", "Arctic Monkeys",
        "The Strokes", "Nirvana", "Coldplay", "Imagine Dragons",
        "Twenty One Pilots", "The Killers", "Muse",
        "Fall Out Boy", "Paramore", "Panic! At The Disco", "My Chemical Romance",
        "Green Day", "Weezer", "Queens of the Stone Age", "Jack White",
        "The Black Keys", "Kings of Leon",
    ],
    "electronic": [
        "Calvin Harris", "Daft Punk", "The Chainsmokers",
        "Marshmello", "Avicii", "Zedd", "Kygo", "Disclosure",
        "Flume", "Odesza", "Illenium", "Diplo",
        "Skrillex", "Porter Robinson", "Madeon", "Fred Again",
        "Four Tet", "Jamie xx", "Aphex Twin", "Caribou",
    ],
    "country": [
        "Morgan Wallen", "Luke Combs", "Chris Stapleton",
        "Kacey Musgraves", "Zac Brown Band", "Thomas Rhett",
        "Tyler Childers", "Eric Church",
        "Kane Brown", "Blake Shelton", "Carrie Underwood", "Miranda Lambert",
        "Maren Morris", "Cody Johnson", "Zach Bryan", "Lainey Wilson",
        "Hardy", "Nate Smith", "Parker McCollum", "Ashley McBryde",
    ],
    "alternative": [
        "Tame Impala", "Vampire Weekend", "Bon Iver",
        "Lorde", "Hozier", "Alt-J", "Arcade Fire", "The National",
        "Radiohead", "Sufjan Stevens", "Fleet Foxes", "Modest Mouse",
        "Death Cab for Cutie", "Wilco", "Spoon", "LCD Soundsystem",
        "Big Thief", "Angel Olsen", "Weyes Blood", "Arlo Parks",
    ],
    "latin": [
        "Bad Bunny", "J Balvin", "Maluma", "Daddy Yankee",
        "Shakira", "Ozuna", "Rauw Alejandro", "Becky G",
        "Karol G", "Myke Towers", "Anuel AA", "Sech",
        "Jhay Cortez", "Lunay", "Feid", "Ryan Castro",
        "Peso Pluma", "Natanael Cano", "Junior H", "Eslabon Armado",
    ],
    "metal": [
        "Metallica", "Linkin Park", "System of a Down",
        "Slipknot", "Avenged Sevenfold", "Disturbed",
        "Bring Me The Horizon", "Pantera", "Tool", "Lamb of God",
        "Five Finger Death Punch", "Breaking Benjamin", "Trivium", "Mastodon",
    ],
    "indie": [
        "Mac DeMarco", "Phoebe Bridgers", "Clairo", "Mitski",
        "Waxahatchee", "Soccer Mommy", "Snail Mail", "Beabadoobee",
        "Japanese Breakfast", "boygenius", "Hand Habits", "Caroline Polachek",
        "alex g", "Palm", "Pinegrove", "Hovvdy",
        "Tomberlin", "Palehound", "Told Slant", "Florist",
    ],
    "jazz": [
        "Norah Jones", "Amy Winehouse", "John Legend",
        "Alicia Keys", "Leon Bridges",
        "Thundercat", "Robert Glasper", "Kamasi Washington", "Esperanza Spalding",
        "Jacob Collier", "Chet Baker", "Miles Davis", "John Coltrane",
    ],
    "classical": [
        "Ludovico Einaudi", "Max Richter", "Yann Tiersen",
        "Hans Zimmer", "Johann Sebastian Bach", "Frederic Chopin",
        "Claude Debussy", "Erik Satie",
    ],
}

# returns the top n songs for an artist that have preview URLs
# results are cached locally in .itunes_cache.json to avoid redundant API calls
def fetch_top_songs_for_artist(artist, n=SONGS_PER_ARTIST):
    cache_key = f"{artist}:{n}"
    if cache_key in _itunes_cache:
        return _itunes_cache[cache_key]

    for attempt in range(5):
        try:
            resp = requests.get("https://itunes.apple.com/search", params={
                "term": artist,
                "media": "music",
                "entity": "song",
                "attribute": "artistTerm",
                "limit": 50,  # fetch more so we can filter down to n with preview URLs
            }, timeout=15)
            results = resp.json().get("results", [])
            time.sleep(3)  # iTunes API limit: ~20 calls/min
            break
        except (requests.exceptions.RequestException, ValueError) as e:
            wait = 2 ** attempt  # 1, 2, 4, 8, 16 seconds
            tqdm.write(f"Request failed for {artist} (attempt {attempt + 1}/5): {e} — retrying in {wait}s")
            time.sleep(wait)
    else:
        tqdm.write(f"Giving up on {artist} after 5 attempts")
        return []

    # filter to songs that actually match the artist and have a preview URL
    # aka songs we can play
    matches = [
        r for r in results
        if artist.lower() in r.get("artistName", "").lower()
        and r.get("previewUrl")
    ]
    matches = matches[:n]
    _itunes_cache[cache_key] = matches
    _save_cache(_itunes_cache)
    return matches

# Insert a song dict from iTunes API into the DB + its artist and feature vector
def insert_track(cur, track):
    genre = track.get("primaryGenreName")
    release_date = track.get("releaseDate")
    duration_ms = track.get("trackTimeMillis")

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
        """INSERT INTO songs (song_name, preview_mp3_url, song_image_url)
           VALUES (%s, %s, %s)
           ON CONFLICT (preview_mp3_url) DO NOTHING
           RETURNING song_id""",
        (track["trackName"], track["previewUrl"],
         track["artworkUrl100"].replace("100x100bb", "600x600bb"))
    )
    row = cur.fetchone()
    if row is None:
        return False  # already in DB
    song_id = row[0]

    lyrics, is_instrumental = fetch_lyrics(track["artistName"], track["trackName"])
    label = "instrumental" if is_instrumental else ("found" if lyrics else "not found")
    print(f"  {track['artistName']} — {track['trackName']} ... {label}")
    full_vec = l2_normalize(build_full_feature_vector(genre, release_date, duration_ms, lyrics))
    cur.execute(
        "UPDATE songs SET feature_vector = %s::text::vector WHERE song_id = %s",
        (json.dumps(full_vec), song_id)
    )
    time.sleep(0.3)

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

        song_data.append((
            track["trackName"],
            track["previewUrl"],
            track["artworkUrl100"].replace("100x100bb", "600x600bb"),
            genre,
            release_date,
            duration_ms,
            track["artistName"],  # temporary, will use to link to artist_id
        ))

    # Step 4: Batch insert songs, embed lyrics, and get IDs
    added = 0
    for song_row in song_data:
        song_name, preview_url, image_url, genre, release_date, duration_ms, artist_name = song_row

        cur.execute(
            """INSERT INTO songs (song_name, preview_mp3_url, song_image_url)
               VALUES (%s, %s, %s)
               ON CONFLICT (preview_mp3_url) DO NOTHING
               RETURNING song_id""",
            (song_name, preview_url, image_url)
        )
        result = cur.fetchone()
        if result:
            song_id = result[0]
            artist_id = artist_map[artist_name]
            song_artist_data.append((song_id, artist_id))
            added += 1

            # Now fetch lyrics and create full 398D vector
            lyrics, is_instrumental = fetch_lyrics(artist_name, song_name)
            label = "instrumental" if is_instrumental else ("found" if lyrics else "not found")
            print(f"  [{added}] {artist_name} — {song_name} ... {label}")
            full_vec = l2_normalize(build_full_feature_vector(genre, release_date, duration_ms, lyrics))
            cur.execute(
                "UPDATE songs SET feature_vector = %s::text::vector WHERE song_id = %s",
                (json.dumps(full_vec), song_id)
            )
            time.sleep(0.3)
    
    # Step 5: Batch insert song_artist relationships
    if song_artist_data:
        cur.executemany(
            "INSERT INTO song_artists (song_id, artist_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
            song_artist_data
        )
    
    return added

# Fetch lyrics and compute feature vector for a single track (runs in thread pool)
# Results are cached in .vectors_cache.json keyed by previewUrl
def compute_track_data(track):
    cache_key = track["previewUrl"]
    if cache_key in _vectors_cache:
        full_vec, label = _vectors_cache[cache_key]
        return track, full_vec, label

    genre = track.get("primaryGenreName")
    release_date = track.get("releaseDate")
    duration_ms = track.get("trackTimeMillis")
    lyrics, is_instrumental = fetch_lyrics(track["artistName"], track["trackName"])
    label = "instrumental" if is_instrumental else ("found" if lyrics else "not found")
    full_vec = l2_normalize(build_full_feature_vector(genre, release_date, duration_ms, lyrics))

    _vectors_cache[cache_key] = (full_vec, label)
    return track, full_vec, label

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
    # --- Phase 1: fetch iTunes tracks in parallel ---
    all_artists = [artist for artists in ARTISTS_BY_GENRE.values() for artist in artists]
    all_tracks = []
    print(f"Fetching tracks for {len(all_artists)} artists (1 thread, ~3s/artist)...")
    with ThreadPoolExecutor(max_workers=1) as executor:  # 1 thread to respect iTunes 20 calls/min limit
        futures = {executor.submit(fetch_top_songs_for_artist, artist): artist for artist in all_artists}
        with tqdm(total=len(all_artists), desc="Fetching iTunes", unit="artist") as pbar:
            for future in as_completed(futures):
                artist = futures[future]
                tracks = future.result()
                cached = f"{artist}:{SONGS_PER_ARTIST}" in _itunes_cache
                pbar.set_postfix_str(f"{artist[:28]} {'[cached]' if cached else ''}")
                pbar.update(1)
                all_tracks.extend(tracks)

    max_lyric_threads = min(32, (os.cpu_count() or 1) + 4)
    print(f"\nFetched {len(all_tracks)} tracks total. Computing vectors ({max_lyric_threads} threads)...")

    # --- Phase 2: fetch lyrics + compute vectors in parallel ---
    computed = []  # list of (track, full_vec)
    with ThreadPoolExecutor(max_workers=max_lyric_threads) as executor:
        futures = {executor.submit(compute_track_data, track): track for track in all_tracks}
        with tqdm(total=len(all_tracks), desc="Computing vectors", unit="song") as pbar:
            for future in as_completed(futures):
                track, full_vec, label = future.result()
                pbar.set_postfix_str(f"{track['artistName'][:18]} — {track['trackName'][:18]} [{label}]")
                pbar.update(1)
                computed.append((track, full_vec))

    _save_vectors_cache(_vectors_cache)

    # --- Phase 3: DB inserts (serial — psycopg connections are not thread-safe) ---
    print(f"\nInserting {len(computed)} songs into DB...")
    total_added = 0
    with conn.cursor() as cur:
        artist_names = list({track["artistName"] for track, _ in computed})
        cur.executemany(
            "INSERT INTO artists (artist_name) VALUES (%s) ON CONFLICT (artist_name) DO NOTHING;",
            [(name,) for name in artist_names]
        )
        cur.execute(
            "SELECT artist_name, artist_id FROM artists WHERE artist_name = ANY(%s)",
            (artist_names,)
        )
        artist_map = {row[0]: row[1] for row in cur.fetchall()}

        song_artist_data = []
        for track, full_vec in tqdm(computed, desc="Inserting into DB", unit="song"):
            cur.execute(
                """INSERT INTO songs (song_name, preview_mp3_url, song_image_url)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (preview_mp3_url) DO NOTHING
                   RETURNING song_id""",
                (track["trackName"], track["previewUrl"],
                 track["artworkUrl100"].replace("100x100bb", "600x600bb"))
            )
            row = cur.fetchone()
            if row:
                song_id = row[0]
                cur.execute(
                    "UPDATE songs SET feature_vector = %s::text::vector WHERE song_id = %s",
                    (json.dumps(full_vec), song_id)
                )
                song_artist_data.append((song_id, artist_map[track["artistName"]]))
                total_added += 1

        if song_artist_data:
            cur.executemany(
                "INSERT INTO song_artists (song_id, artist_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                song_artist_data
            )
        conn.commit()

    print(f"Done! {total_added} new songs added.")