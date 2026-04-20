import math

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
TOTAL_DIMS = N_GENRES + 2 + LYRIC_DIMS  # 398 (12 genres + 2 metadata + 384 lyric embeddings)

# Normalization bounds for year and duration
_MIN_YEAR = 1960
_MAX_YEAR = 2026
_MIN_MS   = 60_000   # 1 min
_MAX_MS   = 600_000  # 10 min

# initialize weight vec from prefernecnes 
# returns the L2-normalized form of a vector

def init_weight_vector_from_prefs(prefs_frontend):
    # build a vector for each selected genre (12-dim + 2 metadata = 14-dim total)
    vectors = [build_feature_vector(genre, None, None) for genre in prefs_frontend]
    
    if not vectors:
        base = [1.0] * N_GENRES + [0.5, 0.5]  # default if nothing selected (12 genres + 2 metadata)
    else:
        # average genres and metadata across all selected genres
        base = [sum(v[i] for v in vectors) / len(vectors) for i in range(N_GENRES + 2)]
    
    # pad with zeros for lyric embedding dimensions
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
    magnitude = math.sqrt(sum(x * x for x in vec))
    if magnitude == 0:
        return vec[:]
    return [x / magnitude for x in vec]

# computes cosine similarity between two vectors
# since both vectors are L2-normalized, the cosine similarity is just their dot product
def cosine_similarity(v1, v2):
    if len(v1) != len(v2):
        raise ValueError(f"Vector length mismatch: {len(v1)} vs {len(v2)}")
    return sum(a * b for a, b in zip(v1, v2))

# update a user's weight vector based on a swipe action
# for a like, we move the weight vector slightly towards the song vector (scaled by alpha)
# for a dislike, we move the weight vector slightly away from the song vector (scaled by beta)
# after the update, we L2-normalize the vector again
def update_weight_vector(current_vec, song_vec, action, alpha=0.1, beta=0.1):
    # Handle initialization: if current_vec is empty, initialize with the song vector
    if len(current_vec) == 0:
        if action == "like":
            return l2_normalize(song_vec[:])
        elif action == "dislike":
            return l2_normalize([-x for x in song_vec])
        else:
            return l2_normalize(song_vec[:])
    
    # Handle dimension mismatch by padding shorter vector with zeros to match longer
    if len(current_vec) != len(song_vec):
        max_len = max(len(current_vec), len(song_vec))
        if len(current_vec) < max_len:
            current_vec = current_vec + [0.0] * (max_len - len(current_vec))
        if len(song_vec) < max_len:
            song_vec = song_vec + [0.0] * (max_len - len(song_vec))

    if action == "like":
        updated = [c + alpha * s for c, s in zip(current_vec, song_vec)]
    elif action == "dislike":
        updated = [c - beta * s for c, s in zip(current_vec, song_vec)]
    else:
        return current_vec[:]

    return l2_normalize(updated)
