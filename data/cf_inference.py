"""Lazy-loading inference wrapper around the trained NeuMF model, used by the
backend to score unseen songs for a user. If no trained artifacts exist yet
(e.g. not enough interaction data), or a given user/song wasn't part of
training, scoring simply reports "no CF signal" — the caller falls back to
the genre-preference cold-start path (see backend/app.py next_song).
"""
import json
import os

import torch

from data.cf_model import NeuMF

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "cf_artifacts")

_model = None
_user_to_idx = None
_song_to_idx = None
_load_attempted = False


def _load():
    global _model, _user_to_idx, _song_to_idx, _load_attempted
    if _load_attempted:
        return
    _load_attempted = True

    model_path = os.path.join(ARTIFACT_DIR, "neumf.pt")
    mappings_path = os.path.join(ARTIFACT_DIR, "mappings.json")
    if not (os.path.exists(model_path) and os.path.exists(mappings_path)):
        return

    checkpoint = torch.load(model_path, weights_only=True)
    model = NeuMF(checkpoint["n_users"], checkpoint["n_items"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    with open(mappings_path) as f:
        mappings = json.load(f)

    _model = model
    _user_to_idx = {int(k): v for k, v in mappings["user_to_idx"].items()}
    _song_to_idx = {int(k): v for k, v in mappings["song_to_idx"].items()}


def is_available():
    _load()
    return _model is not None


def known_user(user_id):
    """True if this user had enough interaction history to get a learned
    embedding during the last training run."""
    _load()
    return _model is not None and user_id in _user_to_idx


def known_song_ids():
    """The set of song IDs the trained model has an embedding for."""
    _load()
    if _song_to_idx is None:
        return set()
    return set(_song_to_idx.keys())


def score_candidates(user_id, song_ids):
    """Returns {song_id: cf_score} for the songs the trained model has an
    embedding for. Returns an empty dict if the user is unknown to the model
    or no model has been trained — callers should treat that as "no CF signal,
    use content similarity alone" rather than an error."""
    _load()
    if _model is None or user_id not in _user_to_idx:
        return {}

    known_song_ids = [sid for sid in song_ids if sid in _song_to_idx]
    if not known_song_ids:
        return {}

    u_idx = _user_to_idx[user_id]
    user_indices = [u_idx] * len(known_song_ids)
    item_indices = [_song_to_idx[sid] for sid in known_song_ids]

    with torch.no_grad():
        u = torch.tensor(user_indices, dtype=torch.long)
        i = torch.tensor(item_indices, dtype=torch.long)
        scores = torch.sigmoid(_model(u, i)).tolist()

    return dict(zip(known_song_ids, scores))
