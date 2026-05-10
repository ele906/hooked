import math
import numpy as np
import pytest
import requests as req
from unittest.mock import patch, MagicMock

from vector_utils import (
    GENRE_TYPES, N_GENRES, LYRIC_DIMS, TOTAL_DIMS,
    _MIN_YEAR, _MAX_YEAR, _MIN_MS, _MAX_MS,
    _encode_genre, _normalize_year, _normalize_duration, _clean_title,
    build_feature_vector, l2_normalize, cosine_similarity,
    embed_lyrics, build_full_feature_vector,
    update_weight_vector, init_weight_vector_from_prefs,
    fetch_lyrics,
)

# helpers
def approx(a, b, tol=1e-5):
    return abs(a - b) < tol

def unit_vec(slot, size=TOTAL_DIMS):
    v = [0.0] * size
    v[slot] = 1.0
    return v

def normalized_unit(slot, size=TOTAL_DIMS):
    return l2_normalize(unit_vec(slot, size))

def magnitude(vec):
    return math.sqrt(sum(x ** 2 for x in vec))

# _encode_genre
# This first test class for Encode Genre was generated using Claude, and then
# it was used as a basis for the rest of the test classes.
class TestEncodeGenre:
    def test_returns_n_genres_dims(self):
        assert len(_encode_genre("Pop")) == N_GENRES

    def test_pop(self):
        vec = _encode_genre("Pop")
        assert vec[0] == 1.0
        assert all(v == 0.0 for v in vec[1:])

    def test_case_insensitive(self):
        assert _encode_genre("POP") == _encode_genre("pop") == _encode_genre("Pop")

    def test_hip_hop(self):
        assert _encode_genre("Hip-Hop/Rap")[1] == 1.0

    def test_rap_keyword(self):
        assert _encode_genre("Rap")[1] == 1.0

    def test_trap_keyword(self):
        assert _encode_genre("Trap")[1] == 1.0

    def test_rnb(self):
        assert _encode_genre("R&B/Soul")[2] == 1.0

    def test_soul_keyword(self):
        assert _encode_genre("Soul")[2] == 1.0

    def test_rock(self):
        assert _encode_genre("Rock")[3] == 1.0

    def test_punk_keyword(self):
        assert _encode_genre("Punk")[3] == 1.0

    def test_electronic(self):
        assert _encode_genre("Electronic")[4] == 1.0

    def test_edm_keyword(self):
        assert _encode_genre("Dance & EDM")[4] == 1.0

    def test_house_keyword(self):
        assert _encode_genre("House")[4] == 1.0

    def test_country(self):
        assert _encode_genre("Country")[5] == 1.0

    def test_folk_keyword(self):
        assert _encode_genre("Folk")[5] == 1.0

    def test_jazz(self):
        assert _encode_genre("Jazz")[6] == 1.0

    def test_blues_keyword(self):
        assert _encode_genre("Blues")[6] == 1.0

    def test_classical(self):
        assert _encode_genre("Classical")[7] == 1.0

    def test_opera_keyword(self):
        assert _encode_genre("Opera")[7] == 1.0

    def test_latin(self):
        assert _encode_genre("Latin")[8] == 1.0

    def test_reggaeton_keyword(self):
        assert _encode_genre("Reggaeton")[8] == 1.0

    def test_alternative(self):
        assert _encode_genre("Alternative")[9] == 1.0

    def test_metal(self):
        assert _encode_genre("Metal")[10] == 1.0

    def test_hardcore_keyword(self):
        assert _encode_genre("Hardcore")[10] == 1.0

    def test_indie(self):
        assert _encode_genre("Indie")[11] == 1.0

    def test_singer_songwriter_keyword(self):
        assert _encode_genre("Singer-Songwriter")[11] == 1.0

    def test_unknown_genre_returns_zeros(self):
        vec = _encode_genre("Bossa Nova")
        assert all(v == 0.0 for v in vec)

    def test_empty_string_returns_zeros(self):
        assert all(v == 0.0 for v in _encode_genre(""))

    def test_none_returns_zeros(self):
        assert all(v == 0.0 for v in _encode_genre(None))

    def test_multi_keyword_match_splits_weight_evenly(self):
        # "Pop Rock" matches pop (slot 0) and rock (slot 3) — each gets 0.5
        vec = _encode_genre("Pop Rock")
        assert approx(vec[0], 0.5)
        assert approx(vec[3], 0.5)

    def test_single_match_weights_sum_to_one(self):
        assert approx(sum(_encode_genre("Jazz")), 1.0)

    def test_no_match_weights_sum_to_zero(self):
        assert sum(_encode_genre("Zydeco")) == 0.0

    def test_multi_match_weights_sum_to_one(self):
        assert approx(sum(_encode_genre("Pop Rock")), 1.0)


# _normalize_year
class TestNormalizeYear:
    def test_min_year_returns_zero(self):
        assert _normalize_year(str(_MIN_YEAR)) == 0.0

    def test_max_year_returns_one(self):
        assert _normalize_year(str(_MAX_YEAR)) == 1.0

    def test_midpoint_is_between_zero_and_one(self):
        mid = str((_MIN_YEAR + _MAX_YEAR) // 2)
        result = _normalize_year(mid)
        assert 0.0 < result < 1.0

    def test_none_returns_half(self):
        assert _normalize_year(None) == 0.5

    def test_full_date_string_uses_year_prefix(self):
        assert _normalize_year("2000-01-01") == _normalize_year("2000")

    def test_before_min_clamps_to_zero(self):
        assert _normalize_year("1900") == 0.0

    def test_after_max_clamps_to_one(self):
        assert _normalize_year("2099") == 1.0

    def test_invalid_string_returns_half(self):
        assert _normalize_year("not-a-year") == 0.5

    def test_output_in_unit_range(self):
        for year in ["1960", "1980", "2000", "2010", "2026"]:
            result = _normalize_year(year)
            assert 0.0 <= result <= 1.0

    def test_later_year_gives_higher_value(self):
        assert _normalize_year("2020") > _normalize_year("1990")


# _normalize_duration
class TestNormalizeDuration:
    def test_min_ms_returns_zero(self):
        assert _normalize_duration(_MIN_MS) == 0.0

    def test_max_ms_returns_one(self):
        assert _normalize_duration(_MAX_MS) == 1.0

    def test_midpoint_returns_half(self):
        mid = (_MIN_MS + _MAX_MS) / 2
        assert approx(_normalize_duration(mid), 0.5)

    def test_none_returns_half(self):
        assert _normalize_duration(None) == 0.5

    def test_below_min_clamps_to_zero(self):
        
        assert _normalize_duration(1000) == 0.0

    def test_above_max_clamps_to_one(self):
        assert _normalize_duration(10_000_000) == 1.0

    def test_output_in_unit_range(self):
        for ms in [60_000, 180_000, 210_000, 300_000, 600_000]:
            result = _normalize_duration(ms)
            assert 0.0 <= result <= 1.0

    def test_longer_song_gives_higher_value(self):
        assert _normalize_duration(300_000) > _normalize_duration(120_000)


# _clean_title
class TestCleanTitle:
    def test_strips_with_suffix(self):
        assert _clean_title("Die For You (with Ariana Grande)") == "Die For You"

    def test_strips_feat_with_period(self):
        assert _clean_title("Bad and Boujee (feat. Lil Uzi Vert)") == "Bad and Boujee"

    def test_strips_feat_without_period(self):
        assert _clean_title("Song (feat Artist)") == "Song"

    def test_preserves_unrelated_parens(self):
        assert _clean_title("Stressed Out (Official Video)") == "Stressed Out (Official Video)"

    def test_no_suffix_unchanged(self):
        assert _clean_title("Blinding Lights") == "Blinding Lights"

    def test_case_insensitive(self):
        assert _clean_title("Song (With Guest)") == "Song"

    def test_strips_surrounding_whitespace(self):
        assert _clean_title("  Song (feat. Artist)  ") == "Song"

    def test_multiple_words_in_suffix(self):
        assert _clean_title("Song (feat. Artist One and Artist Two)") == "Song"


# build_feature_vector
class TestBuildFeatureVector:
    def test_returns_14_dims(self):
        assert len(build_feature_vector("Pop", "2020", 210_000)) == N_GENRES + 2

    def test_correct_genre_slot(self):
        vec = build_feature_vector("Pop", None, None)
        assert vec[0] == 1.0

    def test_year_at_index_12_min(self):
        vec = build_feature_vector(None, str(_MIN_YEAR), None)
        assert vec[N_GENRES] == 0.0

    def test_year_at_index_12_max(self):
        vec = build_feature_vector(None, str(_MAX_YEAR), None)
        assert vec[N_GENRES] == 1.0

    def test_duration_at_index_13_min(self):
        vec = build_feature_vector(None, None, _MIN_MS)
        assert vec[N_GENRES + 1] == 0.0

    def test_duration_at_index_13_max(self):
        vec = build_feature_vector(None, None, _MAX_MS)
        assert vec[N_GENRES + 1] == 1.0

    def test_all_none_genre_dims_zero(self):
        vec = build_feature_vector(None, None, None)
        assert all(v == 0.0 for v in vec[:N_GENRES])

    def test_all_none_metadata_defaults_to_half(self):
        vec = build_feature_vector(None, None, None)
        assert vec[N_GENRES] == 0.5
        assert vec[N_GENRES + 1] == 0.5


# l2_normalize
class TestL2Normalize:
    def test_magnitude_is_one(self):
        assert approx(magnitude(l2_normalize([3.0, 4.0])), 1.0)

    def test_3_4_right_triangle(self):
        result = l2_normalize([3.0, 4.0])
        assert approx(result[0], 0.6)
        assert approx(result[1], 0.8)

    def test_unit_vector_unchanged(self):
        result = l2_normalize([1.0, 0.0, 0.0])
        assert approx(result[0], 1.0)
        assert approx(result[1], 0.0)

    def test_zero_vector_returns_zeros(self):
        result = l2_normalize([0.0, 0.0, 0.0])
        assert all(v == 0.0 for v in result)

    def test_negative_values_normalized(self):
        assert approx(magnitude(l2_normalize([-3.0, 4.0])), 1.0)

    def test_large_vector_normalized(self):
        vec = [float(i) for i in range(1, TOTAL_DIMS + 1)]
        assert approx(magnitude(l2_normalize(vec)), 1.0)

    def test_returns_list(self):
        assert isinstance(l2_normalize([1.0, 2.0]), list)

    def test_length_preserved(self):
        vec = [1.0] * 398
        assert len(l2_normalize(vec)) == 398


# cosine_similarity
class TestCosineSimilarity:
    def test_identical_unit_vectors_return_one(self):
        v = normalized_unit(0)
        assert approx(cosine_similarity(v, v), 1.0)

    def test_orthogonal_vectors_return_zero(self):
        v1 = normalized_unit(0)
        v2 = normalized_unit(1)
        assert approx(cosine_similarity(v1, v2), 0.0)

    def test_opposite_vectors_return_negative_one(self):
        v1 = l2_normalize([1.0, 0.0])
        v2 = l2_normalize([-1.0, 0.0])
        assert approx(cosine_similarity(v1, v2), -1.0)

    def test_length_mismatch_raises_value_error(self):
        with pytest.raises(ValueError):
            cosine_similarity([1.0, 0.0], [1.0, 0.0, 0.0])

    def test_returns_float(self):
        v = normalized_unit(0)
        assert isinstance(cosine_similarity(v, v), float)

    def test_symmetry(self):
        v1 = l2_normalize([1.0, 2.0, 3.0])
        v2 = l2_normalize([4.0, 5.0, 6.0])
        assert approx(cosine_similarity(v1, v2), cosine_similarity(v2, v1))

    def test_result_in_range(self):
        v1 = l2_normalize([0.3, 0.7, 0.0])
        v2 = l2_normalize([0.0, 0.5, 0.5])
        result = cosine_similarity(v1, v2)
        assert -1.0 <= result <= 1.0


# update_weight_vector
class TestUpdateWeightVector:
    def test_like_increases_similarity_to_song(self):
        # user points partly at slot 0 and partly at slot 1 (not already identical to song)
        user = l2_normalize([0.5, 0.5] + [0.0] * (TOTAL_DIMS - 2))
        song = normalized_unit(0)
        before = cosine_similarity(user, song)
        after = cosine_similarity(update_weight_vector(user, song, "like"), song)
        assert after > before

    def test_dislike_decreases_similarity_to_song(self):
        song = normalized_unit(0)
        user = l2_normalize([0.9] + [0.1] + [0.0] * (TOTAL_DIMS - 2))
        before = cosine_similarity(user, song)
        after = cosine_similarity(update_weight_vector(user, song, "dislike"), song)
        assert after < before

    def test_output_is_l2_normalized(self):
        user = normalized_unit(0)
        song = normalized_unit(1)
        result = update_weight_vector(user, song, "like")
        assert approx(magnitude(result), 1.0)

    def test_dislike_output_is_l2_normalized(self):
        user = normalized_unit(0)
        song = normalized_unit(1)
        result = update_weight_vector(user, song, "dislike")
        assert approx(magnitude(result), 1.0)

    def test_unknown_action_returns_unchanged_copy(self):
        user = normalized_unit(0)
        song = normalized_unit(1)
        result = update_weight_vector(user, song, "skip")
        assert result == user

    def test_length_mismatch_raises_value_error(self):
        with pytest.raises(ValueError):
            update_weight_vector([1.0, 0.0], [1.0, 0.0, 0.0], "like")

    def test_output_length_unchanged(self):
        user = normalized_unit(0)
        song = normalized_unit(1)
        assert len(update_weight_vector(user, song, "like")) == TOTAL_DIMS

    def test_larger_alpha_pulls_harder_toward_song(self):
        user = normalized_unit(0)
        song = normalized_unit(1)
        small_alpha = cosine_similarity(update_weight_vector(user, song, "like", alpha=0.01), song)
        large_alpha = cosine_similarity(update_weight_vector(user, song, "like", alpha=0.5), song)
        assert large_alpha > small_alpha

    def test_larger_beta_pushes_harder_away_from_song(self):
        song = normalized_unit(0)
        user = l2_normalize([0.9] + [0.1] + [0.0] * (TOTAL_DIMS - 2))
        small_beta = cosine_similarity(update_weight_vector(user, song, "dislike", beta=0.01), song)
        large_beta = cosine_similarity(update_weight_vector(user, song, "dislike", beta=0.5), song)
        assert large_beta < small_beta

    def test_like_same_direction_moves_closer(self):
        # user and song already aligned — like should keep them close
        v = normalized_unit(0)
        result = update_weight_vector(v, v, "like")
        assert cosine_similarity(result, v) > 0.99

    def test_dislike_returns_list(self):
        user = normalized_unit(0)
        song = normalized_unit(1)
        assert isinstance(update_weight_vector(user, song, "dislike"), list)


# init_weight_vector_from_prefs
class TestInitWeightVectorFromPrefs:
    def test_returns_total_dims(self):
        assert len(init_weight_vector_from_prefs(["pop"])) == TOTAL_DIMS

    def test_lyric_dims_are_all_zero(self):
        result = init_weight_vector_from_prefs(["pop"])
        assert all(v == 0.0 for v in result[N_GENRES + 2:])

    def test_output_is_l2_normalized(self):
        result = init_weight_vector_from_prefs(["pop", "rock"])
        assert approx(magnitude(result), 1.0)

    def test_single_genre_activates_correct_slot(self):
        result = init_weight_vector_from_prefs(["pop"])
        genre_section = result[:N_GENRES]
        assert genre_section[0] == max(genre_section)

    def test_two_genres_both_positive(self):
        result = init_weight_vector_from_prefs(["pop", "rock"])
        assert result[0] > 0.0  # pop
        assert result[3] > 0.0  # rock

    def test_empty_prefs_returns_normalized_vector(self):
        result = init_weight_vector_from_prefs([])
        assert len(result) == TOTAL_DIMS
        assert approx(magnitude(result), 1.0)

    def test_more_genres_spreads_weight(self):
        one = init_weight_vector_from_prefs(["pop"])
        four = init_weight_vector_from_prefs(["pop", "rock", "jazz", "electronic"])
        # pop slot should be smaller when weight is spread across more genres
        assert four[0] < one[0]

    def test_unknown_genre_ignored(self):
        # "Zydeco" encodes to all zeros — should still return a valid normalized vector
        result = init_weight_vector_from_prefs(["Zydeco"])
        assert len(result) == TOTAL_DIMS
        assert approx(magnitude(result), 1.0)


# embed_lyrics
class TestEmbedLyrics:
    def test_none_returns_zero_vector_of_correct_length(self):
        result = embed_lyrics(None)
        assert len(result) == LYRIC_DIMS
        assert all(v == 0.0 for v in result)

    def test_empty_string_returns_zero_vector(self):
        result = embed_lyrics("")
        assert len(result) == LYRIC_DIMS
        assert all(v == 0.0 for v in result)

    def test_text_calls_model_encode(self):
        # real model returns a numpy array; embed_lyrics calls .tolist() on it
        fake_embedding = np.array([0.1] * LYRIC_DIMS)
        mock_model = MagicMock()
        mock_model.encode.return_value = fake_embedding
        with patch("vector_utils._get_model", return_value=mock_model):
            result = embed_lyrics("I love music")
        mock_model.encode.assert_called_once_with("I love music", normalize_embeddings=False)
        assert isinstance(result, list)
        assert len(result) == LYRIC_DIMS

    def test_text_returns_model_output_as_list(self):
        fake_embedding = np.array([0.5] * LYRIC_DIMS)
        mock_model = MagicMock()
        mock_model.encode.return_value = fake_embedding
        with patch("vector_utils._get_model", return_value=mock_model):
            result = embed_lyrics("some lyrics")
        assert result == fake_embedding.tolist()


# build_full_feature_vector
class TestBuildFullFeatureVector:
    def test_returns_total_dims(self):
        result = build_full_feature_vector("Pop", "2020", 210_000, lyrics_text=None)
        assert len(result) == TOTAL_DIMS

    def test_no_lyrics_gives_zero_lyric_section(self):
        result = build_full_feature_vector("Pop", "2020", 210_000, lyrics_text=None)
        assert all(v == 0.0 for v in result[N_GENRES + 2:])

    def test_genre_slot_set_correctly(self):
        result = build_full_feature_vector("Pop", str(_MIN_YEAR), _MIN_MS, lyrics_text=None)
        assert result[0] == 1.0

    def test_year_dim_at_min(self):
        result = build_full_feature_vector(None, str(_MIN_YEAR), None, lyrics_text=None)
        assert result[N_GENRES] == 0.0

    def test_duration_dim_at_min(self):
        result = build_full_feature_vector(None, None, _MIN_MS, lyrics_text=None)
        assert result[N_GENRES + 1] == 0.0

    def test_with_lyrics_embeds_into_lyric_section(self):
        fake_embedding = np.array([0.25] * LYRIC_DIMS)
        mock_model = MagicMock()
        mock_model.encode.return_value = fake_embedding
        with patch("vector_utils._get_model", return_value=mock_model):
            result = build_full_feature_vector("Pop", "2020", 210_000, lyrics_text="hello world")
        assert len(result) == TOTAL_DIMS
        assert all(approx(v, 0.25) for v in result[N_GENRES + 2:])

    def test_metadata_section_is_first_14_dims(self):
        result = build_full_feature_vector("Pop", "2020", 210_000, lyrics_text=None)
        metadata = build_feature_vector("Pop", "2020", 210_000)
        assert result[:N_GENRES + 2] == metadata


# fetch_lyrics
class TestFetchLyrics:

    def _lrclib_ok(self, instrumental=False, lyrics=None):
        m = MagicMock()
        m.status_code = 200
        m.json.return_value = {"instrumental": instrumental, "plainLyrics": lyrics}
        return m

    def _ovh_ok(self, lyrics):
        m = MagicMock()
        m.status_code = 200
        m.json.return_value = {"lyrics": lyrics}
        return m

    def _not_found(self):
        m = MagicMock()
        m.status_code = 404
        return m

    def test_lrclib_success_returns_lyrics(self):
        with patch("vector_utils.requests.get", return_value=self._lrclib_ok(lyrics="verse 1")):
            lyrics, instrumental = fetch_lyrics("Artist", "Song")
        assert lyrics == "verse 1"
        assert instrumental is False

    def test_lrclib_instrumental_flag(self):
        with patch("vector_utils.requests.get", return_value=self._lrclib_ok(instrumental=True)):
            lyrics, instrumental = fetch_lyrics("Artist", "Song")
        assert lyrics is None
        assert instrumental is True

    def test_lrclib_miss_falls_back_to_ovh(self):
        with patch("vector_utils.requests.get", side_effect=[self._not_found(), self._ovh_ok("from ovh")]):
            lyrics, instrumental = fetch_lyrics("Artist", "Song")
        assert lyrics == "from ovh"
        assert instrumental is False

    def test_both_sources_miss_returns_none_false(self):
        with patch("vector_utils.requests.get", return_value=self._not_found()):
            lyrics, instrumental = fetch_lyrics("Artist", "Song")
        assert lyrics is None
        assert instrumental is False

    def test_lrclib_network_error_falls_back_to_ovh(self):
        with patch("vector_utils.requests.get",
                   side_effect=[req.exceptions.RequestException("timeout"), self._ovh_ok("fallback")]):
            lyrics, instrumental = fetch_lyrics("Artist", "Song")
        assert lyrics == "fallback"

    def test_both_network_errors_returns_none_false(self):
        with patch("vector_utils.requests.get",
                   side_effect=req.exceptions.RequestException("down")):
            lyrics, instrumental = fetch_lyrics("Artist", "Song")
        assert lyrics is None
        assert instrumental is False

    def test_cleans_feat_suffix_before_querying_lrclib(self):
        with patch("vector_utils.requests.get", return_value=self._lrclib_ok(lyrics="ok")) as mock_get:
            fetch_lyrics("The Weeknd", "Save Your Tears (feat. Ariana Grande)")
        params = mock_get.call_args_list[0][1]["params"]
        assert "feat" not in params["track_name"].lower()
        assert "Ariana" not in params["track_name"]

    def test_cleans_with_suffix_before_querying_lrclib(self):
        with patch("vector_utils.requests.get", return_value=self._lrclib_ok(lyrics="ok")) as mock_get:
            fetch_lyrics("The Weeknd", "Die For You (with Ariana Grande)")
        params = mock_get.call_args_list[0][1]["params"]
        assert "Ariana" not in params["track_name"]

    def test_lrclib_called_with_correct_artist(self):
        with patch("vector_utils.requests.get", return_value=self._lrclib_ok(lyrics="ok")) as mock_get:
            fetch_lyrics("Kendrick Lamar", "HUMBLE.")
        params = mock_get.call_args_list[0][1]["params"]
        assert params["artist_name"] == "Kendrick Lamar"

    def test_lrclib_null_lyrics_falls_back_to_ovh(self):
        # instrumental=False but plainLyrics=None — LRCLIB has the song but no lyrics text
        with patch("vector_utils.requests.get",
                   side_effect=[self._lrclib_ok(instrumental=False, lyrics=None), self._ovh_ok("lyrics from ovh")]):
            lyrics, instrumental = fetch_lyrics("Artist", "Song")
        assert lyrics == "lyrics from ovh"
