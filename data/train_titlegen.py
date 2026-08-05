"""Offline training script for the song-title generator.

Pulls (genre, song_name) pairs from the DB, trains a small genre-conditioned
char-level transformer (see titlegen_model.py), and writes the trained
weights to data/titlegen_artifacts/. The backend loads these artifacts
lazily to suggest song titles for generated tracks.

There's no auto-retraining pipeline — run this manually whenever the songs
table grows meaningfully:

    python data/train_titlegen.py
"""
import os
import sys

import torch

sys.path.insert(0, os.path.dirname(__file__))
from db import get_db
from titlegen_model import CharTokenizer, TitleGenGPT, make_example, BLOCK_SIZE

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "titlegen_artifacts")

EPOCHS = 60
BATCH_SIZE = 64
LR = 3e-4


def main():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT genre, song_name FROM songs WHERE song_name IS NOT NULL")
    rows = cur.fetchall()
    conn.close()

    print(f"Loaded {len(rows)} songs")
    if len(rows) < 50:
        print("Not enough titles to train on yet — skipping.")
        return

    tokenizer = CharTokenizer()
    examples = torch.tensor(
        [make_example(genre, title, tokenizer) for genre, title in rows],
        dtype=torch.long,
    )

    model = TitleGenGPT(vocab_size=tokenizer.vocab_size)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR)

    model.train()
    n = examples.size(0)
    for epoch in range(EPOCHS):
        perm = torch.randperm(n)
        total_loss = 0.0
        for start in range(0, n, BATCH_SIZE):
            batch = examples[perm[start:start + BATCH_SIZE]]
            inputs = batch[:, :-1]
            targets = batch[:, 1:].clone()
            targets[targets == tokenizer.pad_id] = -1  # don't penalize padding predictions

            optimizer.zero_grad()
            _, loss = model(inputs, targets)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * batch.size(0)

        if epoch % 10 == 0 or epoch == EPOCHS - 1:
            print(f"epoch {epoch}: loss {total_loss / n:.4f}")

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    torch.save({
        "state_dict": model.state_dict(),
        "vocab_size": tokenizer.vocab_size,
    }, os.path.join(ARTIFACT_DIR, "titlegen.pt"))

    print(f"Saved model to {ARTIFACT_DIR}")


if __name__ == "__main__":
    main()
