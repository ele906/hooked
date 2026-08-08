"""Decade reference data — the fixed list of eras users can pick from at
signup/search, paired with a curated set of iconic artists per era. iTunes
doesn't expose release year in a queryable way, so (like genre keyword
matching) this is approximate: "a 90s song" means "a song by an artist on
the curated 90s list," not "released 1990-1999."

Scoped to 1950s-2020s: earlier decades have essentially no preview-able
catalog on iTunes (the API seed_songs.py uses), so they'd just be dead
dropdown options.
"""

DECADE_ARTISTS = {
    "1950s": [
        "Elvis Presley", "Chuck Berry", "Buddy Holly & The Crickets", "Little Richard",
        "Fats Domino", "Ray Charles", "The Everly Brothers", 'Nat "King" Cole',
    ],
    "1960s": [
        "The Beatles", "The Beach Boys", "The Supremes", "Otis Redding",
        "Bob Dylan", "Aretha Franklin", "The Rolling Stones", "Sam Cooke",
    ],
    "1970s": [
        "Fleetwood Mac", "Stevie Wonder", "Earth, Wind & Fire", "ABBA",
        "Elton John", "Marvin Gaye", "Led Zeppelin", "Bee Gees",
    ],
    "1980s": [
        "Michael Jackson", "Prince & The Revolution", "Whitney Houston",
        "Madonna", "Duran Duran", "George Michael", "Tina Turner", "Cyndi Lauper",
    ],
    "1990s": [
        "Mariah Carey", "TLC", "Backstreet Boys", "The Notorious B.I.G.",
        "No Doubt", "Boyz II Men", "En Vogue",
    ],
    "2000s": [
        "Beyoncé", "Eminem", "Outkast", "Coldplay",
        "USHER", "Alicia Keys", "LINKIN PARK", "Rihanna",
    ],
    "2010s": [
        "Adele", "Drake", "Ed Sheeran", "Taylor Swift",
        "Bruno Mars", "Kendrick Lamar", "Lorde", "The Weeknd",
    ],
    "2020s": [
        "Olivia Rodrigo", "Doja Cat", "Bad Bunny", "SZA",
        "Dua Lipa", "Harry Styles", "Billie Eilish", "Morgan Wallen",
    ],
}

DECADES = list(DECADE_ARTISTS.keys())


def artists_for(decade_picks):
    """Flattens a list of chosen decade keys (e.g. ["1980s", "1990s"]) into
    the curated artist names for those eras, deduped but order-preserving."""
    seen = []
    for decade in decade_picks:
        for artist in DECADE_ARTISTS.get(decade, []):
            if artist not in seen:
                seen.append(artist)
    return seen
