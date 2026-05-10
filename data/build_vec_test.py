import sys
sys.path.insert(0, '.')
from vector_utils import (
    fetch_lyrics, build_full_feature_vector,
    init_weight_vector_from_prefs, l2_normalize, TOTAL_DIMS
)

# fetch_lyrics
lyrics, is_instrumental = fetch_lyrics("Mitski", "Nobody")
print(f"fetch_lyrics: instrumental={is_instrumental}, got lyrics={lyrics is not None}, length={len(lyrics) if lyrics
else 0}")

# should flag as instrumental
lyrics2, is_instrumental2 = fetch_lyrics("Bonobo", "Kiara")
print(f"instrumental test: {is_instrumental2}")  # expect True

# iTunes collab suffix stripping
lyrics3, _ = fetch_lyrics("The Weeknd", "Save Your Tears (with Ariana Grande)")
print(f"collab suffix test: got lyrics={lyrics3 is not None}")  # expect True

# build_full_feature_vector
vec = build_full_feature_vector("Pop", "2021-01-01", 180000, lyrics)
print(f"vector length: {len(vec)} (expect {TOTAL_DIMS})")  # expect 398

# instrumental/miss gets zero lyric dims but correct length
vec2 = build_full_feature_vector("Electronic", "2019-01-01", 240000, None)
print(f"zero-lyric vector length: {len(vec2)} (expect {TOTAL_DIMS})")
print(f"lyric dims are zero: {all(x == 0.0 for x in vec2[14:])}")  # expect True

# init_weight_vector_from_prefs 
weight = init_weight_vector_from_prefs(["pop", "hip-hop"])
print(f"weight vector length: {len(weight)} (expect {TOTAL_DIMS})")
print(f"lyric dims are zero: {all(x == 0.0 for x in weight[14:])}")  # expect True
