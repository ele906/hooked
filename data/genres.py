"""Genre reference data — the fixed list of genres users pick from at signup,
and the keyword substrings used to match a chosen genre against a song's raw
iTunes genre string (e.g. "Hip-Hop/Rap" contains the "hip-hop" keyword).

This is plain reference data, not a model — used by the cold-start
recommendation path (see backend/app.py next_song) before a user has enough
swipe history for the neural CF model to have learned their taste.
"""

GENRE_KEYWORDS = {
    "pop":         ["pop"],
    "hip-hop":     ["hip-hop", "rap", "trap"],
    "r&b":         ["r&b", "soul", "rhythm and blues"],
    "rock":        ["rock", "punk", "grunge"],
    "electronic":  ["electronic", "dance", "edm", "house", "techno"],
    "country":     ["country", "folk", "bluegrass"],
    "jazz":        ["jazz", "blues", "swing"],
    "classical":   ["classical", "orchestra", "opera"],
    "latin":       ["latin", "reggaeton", "salsa"],
    "alternative": ["alternative", "alt-"],
    "metal":       ["metal", "heavy", "hardcore"],
    "indie":       ["indie", "singer-songwriter"],
}

GENRES = list(GENRE_KEYWORDS.keys())


def keywords_for(genre_picks):
    """Flattens a list of chosen genre keys (e.g. ["pop", "rock"]) into the raw
    keyword substrings used to match against a song's genre string, deduped
    but order-preserving."""
    seen = []
    for genre in genre_picks:
        for kw in GENRE_KEYWORDS.get(genre, []):
            if kw not in seen:
                seen.append(kw)
    return seen
