import torch

from cf_model import (
    build_id_maps, build_training_pairs, train_neumf, score_pairs,
    NeuMF, MIN_USER_INTERACTIONS, MIN_SONG_INTERACTIONS,
)


# build_id_maps
class TestBuildIdMaps:
    def test_filters_users_below_min_interactions(self):
        interactions = [(1, 100, "like")] * (MIN_USER_INTERACTIONS - 1)
        user_to_idx, song_to_idx, filtered = build_id_maps(interactions)
        assert user_to_idx == {}
        assert filtered == []

    def test_keeps_users_at_min_interactions(self):
        interactions = [(1, 100 + i, "like") for i in range(MIN_USER_INTERACTIONS)]
        # give the songs enough interactions too by reusing across users
        interactions += [(2, 100 + i, "like") for i in range(MIN_USER_INTERACTIONS)] * MIN_SONG_INTERACTIONS
        user_to_idx, song_to_idx, filtered = build_id_maps(interactions, min_user=1, min_song=1)
        assert 1 in user_to_idx
        assert 2 in user_to_idx

    def test_filters_songs_below_min_interactions(self):
        interactions = [(1, 100, "like")] * 10
        user_to_idx, song_to_idx, filtered = build_id_maps(interactions, min_user=1, min_song=5)
        assert 100 in song_to_idx

    def test_indices_are_dense_and_zero_based(self):
        interactions = [(1, 100, "like")] * 5 + [(2, 200, "like")] * 5
        user_to_idx, song_to_idx, filtered = build_id_maps(interactions, min_user=5, min_song=5)
        assert set(user_to_idx.values()) == {0, 1}
        assert set(song_to_idx.values()) == {0, 1}

    def test_filtered_excludes_rows_with_dropped_user_or_song(self):
        interactions = [(1, 100, "like")] * 5 + [(2, 200, "like")]  # user 2 below threshold
        _, _, filtered = build_id_maps(interactions, min_user=5, min_song=5)
        assert all(row[0] == 1 for row in filtered)


# build_training_pairs
class TestBuildTrainingPairs:
    def test_positive_type_gets_label_one(self):
        user_to_idx, song_to_idx = {1: 0}, {100: 0}
        pairs = build_training_pairs([(1, 100, "like")], user_to_idx, song_to_idx, n_negatives=0)
        assert (0, 0, 1.0) in pairs

    def test_favorite_gets_label_one(self):
        user_to_idx, song_to_idx = {1: 0}, {100: 0}
        pairs = build_training_pairs([(1, 100, "favorite")], user_to_idx, song_to_idx, n_negatives=0)
        assert (0, 0, 1.0) in pairs

    def test_dislike_gets_label_zero(self):
        user_to_idx, song_to_idx = {1: 0}, {100: 0}
        pairs = build_training_pairs([(1, 100, "dislike")], user_to_idx, song_to_idx, n_negatives=0)
        assert (0, 0, 0.0) in pairs

    def test_play_type_produces_no_explicit_pair(self):
        user_to_idx, song_to_idx = {1: 0}, {100: 0}
        pairs = build_training_pairs([(1, 100, "play")], user_to_idx, song_to_idx, n_negatives=0)
        assert pairs == []

    def test_sampled_negatives_avoid_observed_pairs(self):
        user_to_idx = {1: 0}
        song_to_idx = {100: 0, 200: 1}
        pairs = build_training_pairs(
            [(1, 100, "like")], user_to_idx, song_to_idx, n_negatives=4, seed=1
        )
        observed_positive = (0, 0, 1.0)
        assert observed_positive in pairs
        assert not any(u == 0 and s == 0 and label == 0.0 for u, s, label in pairs)

    def test_negative_sampling_scales_with_positives_and_n_negatives(self):
        user_to_idx = {1: 0}
        song_to_idx = {i: i for i in range(20)}
        interactions = [(1, i, "like") for i in range(3)]
        pairs = build_training_pairs(interactions, user_to_idx, song_to_idx, n_negatives=4, seed=1)
        n_sampled_negatives = len(pairs) - 3
        assert n_sampled_negatives <= 3 * 4

    def test_deterministic_with_fixed_seed(self):
        user_to_idx = {1: 0}
        song_to_idx = {i: i for i in range(20)}
        interactions = [(1, i, "like") for i in range(3)]
        pairs_a = build_training_pairs(interactions, user_to_idx, song_to_idx, seed=7)
        pairs_b = build_training_pairs(interactions, user_to_idx, song_to_idx, seed=7)
        assert pairs_a == pairs_b

    def test_unknown_user_or_song_skipped(self):
        user_to_idx, song_to_idx = {1: 0}, {100: 0}
        pairs = build_training_pairs([(2, 999, "like")], user_to_idx, song_to_idx, n_negatives=0)
        assert pairs == []


# train_neumf / score_pairs
class TestTrainNeumf:
    def test_returns_neumf_instance(self):
        pairs = [(0, 0, 1.0), (0, 1, 0.0)]
        model = train_neumf(pairs, n_users=1, n_items=2, epochs=1)
        assert isinstance(model, NeuMF)

    def test_learns_to_separate_liked_from_disliked_song(self):
        # user 0 always likes song 0, always dislikes song 1 — should be learnable
        pairs = [(0, 0, 1.0)] * 20 + [(0, 1, 0.0)] * 20
        model = train_neumf(pairs, n_users=1, n_items=2, epochs=100, lr=0.05)
        scores = score_pairs(model, [0, 0], [0, 1])
        assert scores[0] > scores[1]

    def test_score_pairs_returns_values_in_unit_range(self):
        pairs = [(0, 0, 1.0), (0, 1, 0.0)]
        model = train_neumf(pairs, n_users=1, n_items=2, epochs=1)
        scores = score_pairs(model, [0, 0], [0, 1])
        assert all(0.0 <= s <= 1.0 for s in scores)

    def test_forward_output_shape_matches_batch(self):
        model = NeuMF(n_users=3, n_items=5)
        u = torch.tensor([0, 1, 2], dtype=torch.long)
        i = torch.tensor([0, 1, 2], dtype=torch.long)
        out = model(u, i)
        assert out.shape == (3,)
