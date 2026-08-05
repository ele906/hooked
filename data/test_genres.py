from genres import GENRE_KEYWORDS, GENRES, keywords_for


class TestGenres:
    def test_genres_list_matches_keyword_keys(self):
        assert GENRES == list(GENRE_KEYWORDS.keys())

    def test_twelve_genres(self):
        assert len(GENRES) == 12


class TestKeywordsFor:
    def test_single_genre_returns_its_keywords(self):
        assert keywords_for(["pop"]) == ["pop"]

    def test_multiple_genres_combined_in_order(self):
        result = keywords_for(["pop", "rock"])
        assert result == ["pop", "rock", "punk", "grunge"]

    def test_dedupes_repeated_keywords(self):
        result = keywords_for(["pop", "pop"])
        assert result == ["pop"]

    def test_unknown_genre_contributes_nothing(self):
        assert keywords_for(["zydeco"]) == []

    def test_empty_list_returns_empty(self):
        assert keywords_for([]) == []

    def test_hip_hop_has_three_keywords(self):
        assert keywords_for(["hip-hop"]) == ["hip-hop", "rap", "trap"]
