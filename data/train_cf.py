"""Offline training script for the neural collaborative filtering model.

Pulls all interactions from the DB, trains a NeuMF model (see cf_model.py), and
writes the trained weights + user/song index mappings to data/cf_artifacts/.
The backend loads these artifacts lazily to rerank content-based candidates.

Run this periodically (e.g. weekly, or whenever interaction volume grows
meaningfully) — there's no auto-retraining pipeline, this is a manual step:

    python data/train_cf.py
"""
import json
import os
import sys

import torch

sys.path.insert(0, os.path.dirname(__file__))
from db import get_db
from cf_model import build_id_maps, build_training_pairs, train_neumf, MIN_USER_INTERACTIONS, MIN_SONG_INTERACTIONS

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "cf_artifacts")


def main():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT user_id, song_id, type FROM interactions")
    interactions = cur.fetchall()
    conn.close()

    print(f"Loaded {len(interactions)} interactions")

    user_to_idx, song_to_idx, filtered = build_id_maps(interactions)
    print(f"After filtering to users/songs with >={MIN_USER_INTERACTIONS}/{MIN_SONG_INTERACTIONS} "
          f"interactions: {len(user_to_idx)} users, {len(song_to_idx)} songs, {len(filtered)} interactions")

    if len(user_to_idx) < 2 or len(song_to_idx) < 2:
        print("Not enough data to train a CF model yet — skipping. "
              "The app will keep serving pure content-based recommendations.")
        return

    pairs = build_training_pairs(filtered, user_to_idx, song_to_idx)
    print(f"Built {len(pairs)} training pairs (positive + negative)")

    model = train_neumf(pairs, n_users=len(user_to_idx), n_items=len(song_to_idx))

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    torch.save({
        "state_dict": model.state_dict(),
        "n_users": len(user_to_idx),
        "n_items": len(song_to_idx),
    }, os.path.join(ARTIFACT_DIR, "neumf.pt"))

    with open(os.path.join(ARTIFACT_DIR, "mappings.json"), "w") as f:
        json.dump({
            "user_to_idx": {str(k): v for k, v in user_to_idx.items()},
            "song_to_idx": {str(k): v for k, v in song_to_idx.items()},
        }, f)

    print(f"Saved model + mappings to {ARTIFACT_DIR}")


if __name__ == "__main__":
    main()
