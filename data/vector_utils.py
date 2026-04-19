import re
import urllib.parse
import numpy as np
import requests

# 12 main genre types, each with  associated keywords for matching
# Could be updated in the future but should be good for now
GENRE_TYPES = [
    ("pop",         ["pop"]),
    ("hip-hop",     ["hip-hop", "rap", "trap"]),
    ("r&b",         ["r&b", "soul", "rhythm and blues"]),
    ("rock",        ["rock", "punk", "grunge"]),
    ("electronic",  ["electronic", "dance", "edm", "house", "techno"]),
    ("country",     ["country", "folk", "bluegrass"]),
    ("jazz",        ["jazz", "blues", "swing"]),
    ("classical",   ["classical", "orchestra", "opera"]),
    ("latin",       ["latin", "reggaeton", "salsa"]),
    ("alternative", ["alternative", "alt-"]),
    ("metal",       ["metal", "heavy", "hardcore"]),
    ("indie",       ["indie", "singer-songwriter"]),
]

N_GENRES = len(GENRE_TYPES)  # 12
LYRIC_DIMS = 384             # sentence-transformers all-MiniLM-L6-v2
TOTAL_DIMS = N_GENRES + 2 + LYRIC_DIMS  # 398

# sentence-transformers model is cached here after first load to speed up future calls
_model = None

# Normalization bounds for year and duration
_MIN_YEAR = 1960
_MAX_YEAR = 2026
_MIN_MS   = 60_000   # 1 min
_MAX_MS   = 600_000  # 10 min

# initialize weight vec from preferences
# lyric dims are zeroed out at signup — they fill in as the user swipes songs
def init_weight_vector_from_prefs(prefs_frontend):
    # build a vector for each selected genre (14-dim metadata only)
    vectors = [build_feature_vector(genre, None, None) for genre in prefs_frontend]

    if not vectors:
        base = [1.0] * N_GENRES + [0.5, 0.5]  # default if nothing selected
    else:
        base = [sum(v[i] for v in vectors) / len(vectors) for i in range(N_GENRES + 2)]

    # pad with zeros for lyric dims
    return l2_normalize(base + [0.0] * LYRIC_DIMS)

# encodes a genre string into N_GENRES types
# If the genre matches multiple types, weight is split evenly across matches
# Splitting evenly probably isn't the best/most realisitc approach but it should be good enough for now
def _encode_genre(genre_str):
    vec = [0.0] * N_GENRES
    if not genre_str:
        return vec

    # convert genre string to lowercase for case-insensitive matching
    genre_lower = genre_str.lower()
    matches = [i for i, (_, keywords) in enumerate(GENRE_TYPES)
               if any(kw in genre_lower for kw in keywords)]

    # split weight evenly across matches
    if matches:
        weight = 1.0 / len(matches)
        for i in matches:
            vec[i] = weight

    return vec

# normalize release year betwen 0 and 1, not sure if this will actually
# be useful as I suspect genre will be the driving factor
# but it could help the model learn that a user prefers newer or older songs
def _normalize_year(release_date):
    if not release_date:
        return 0.5
    try:
        year = int(str(release_date)[:4])
        return max(0.0, min(1.0, (year - _MIN_YEAR) / (_MAX_YEAR - _MIN_YEAR)))
    except (ValueError, TypeError):
        return 0.5

# normalize duration between 0 and 1, with a reasonable range of 1 min to 10 min
# honestly not sure if this will be useful either but it could help the model learn 
# that a user prefers shorter or longer songs
def _normalize_duration(duration_ms):
    if not duration_ms:
        return 0.5
    clamped = max(_MIN_MS, min(_MAX_MS, duration_ms))
    return (clamped - _MIN_MS) / (_MAX_MS - _MIN_MS)

# builds a 14-dim feature vector from song metadata, with the layout:
# [12 genre slots | normalized year | normalized duration]
# genre is from iTunes primaryGenreName string 
# release_date is either a year int or a date string
# duration_ms is the track duration in milliseconds
def build_feature_vector(genre, release_date, duration_ms):
    vec = _encode_genre(genre)
    vec.append(_normalize_year(release_date))
    vec.append(_normalize_duration(duration_ms))
    return vec

# returns the L2-normalized form of a vector, which is important for cosine similarity calculations
# L2 normalization scales the vector to have a sum of squares equal to 1
def l2_normalize(vec):
    arr = np.array(vec, dtype=np.float32)
    magnitude = np.linalg.norm(arr)
    if magnitude == 0:
        return vec[:]
    return (arr / magnitude).tolist()

# computes cosine similarity between two vectors
# since both vectors are L2-normalized, the cosine similarity is just their dot product
def cosine_similarity(v1, v2):
    if len(v1) != len(v2):
        raise ValueError(f"Vector length mismatch: {len(v1)} vs {len(v2)}")
    return float(np.dot(v1, v2))

# loads sentence-transformers model on first use and caches it for future calls
def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

# strip collaboration suffixes from song title since LRCLIB doesn't store them
def _clean_title(title):
    title = re.sub(r'\s*\(with [^)]+\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*\(feat\.?\s*[^)]+\)', '', title, flags=re.IGNORECASE)
    return title.strip()

# fetch lyrics for a song, trying LRCLIB first and falling back to lyrics.ovh if not found
# returns (lyrics, instrumental)
def fetch_lyrics(artist, title):
    clean = _clean_title(title)

    # LRCLIB — free, no auth, has an explicit instrumental flag
    try:
        resp = requests.get(
            'https://lrclib.net/api/get',
            params={'artist_name': artist, 'track_name': clean},
            timeout=8
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get('instrumental'):
                return None, True
            lyrics = data.get('plainLyrics')
            if lyrics:
                return lyrics, False
    except requests.exceptions.RequestException:
        pass

    # lyrics.ovh fallback, has a much larger, but less accurate database
    try:
        url = (
            f'https://api.lyrics.ovh/v1/'
            f'{urllib.parse.quote(artist)}/{urllib.parse.quote(clean)}'
        )
        resp = requests.get(url, timeout=8)
        if resp.status_code == 200:
            lyrics = resp.json().get('lyrics')
            if lyrics:
                return lyrics, False
    except requests.exceptions.RequestException:
        pass

    return None, False

# embeds lyrics into a 384-dim vector via sentence-transformers.
# returns a zero vector if lyrics_text is None (instrumental or not found)
def embed_lyrics(lyrics_text):
    if not lyrics_text:
        return [0.0] * LYRIC_DIMS
    embedding = _get_model().encode(lyrics_text, normalize_embeddings=False)
    return embedding.tolist()

# builds a full 398-dim feature vector for a song by combining metadata and lyrics
def build_full_feature_vector(genre, release_date, duration_ms, lyrics_text=None):
    metadata = build_feature_vector(genre, release_date, duration_ms)  # 14-dim
    lyric_vec = embed_lyrics(lyrics_text)                               # 384-dim
    return metadata + lyric_vec


# update a user's weight vector based on a swipe action
# for a like, we move the weight vector slightly towards the song vector (scaled by alpha)
# for a dislike, we move the weight vector slightly away from the song vector (scaled by beta)
# after the update, we L2-normalize the weight vector again
def update_weight_vector(current_vec, song_vec, action, alpha=0.1, beta=0.1):
    if len(current_vec) != len(song_vec):
        raise ValueError(f"Vector length mismatch: {len(current_vec)} vs {len(song_vec)}")

    c = np.array(current_vec, dtype=np.float32)
    s = np.array(song_vec, dtype=np.float32)

    if action == "like":
        updated = c + alpha * s
    elif action == "dislike":
        updated = c - beta * s
    else:
        return current_vec[:]

    return l2_normalize(updated.tolist())
