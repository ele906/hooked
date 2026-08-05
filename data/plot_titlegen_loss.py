"""One-off script: trains the title-gen model with a train/val split and
plots the loss curve to a PNG. Not part of the normal training pipeline
(train_titlegen.py trains on all data with no held-out set) -- this is
purely for visualizing over/underfitting.

    python data/plot_titlegen_loss.py
"""
import os
import sys

import torch
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from db import get_db
from titlegen_model import CharTokenizer, TitleGenGPT, make_example

EPOCHS = 60
BATCH_SIZE = 64
LR = 3e-4
VAL_FRACTION = 0.1
SEED = 42


def run_epoch(model, examples, tokenizer, optimizer=None):
    train_mode = optimizer is not None
    model.train() if train_mode else model.eval()

    n = examples.size(0)
    perm = torch.randperm(n) if train_mode else torch.arange(n)
    total_loss = 0.0

    for start in range(0, n, BATCH_SIZE):
        batch = examples[perm[start:start + BATCH_SIZE]]
        inputs = batch[:, :-1]
        targets = batch[:, 1:].clone()
        targets[targets == tokenizer.pad_id] = -1

        if train_mode:
            optimizer.zero_grad()
            _, loss = model(inputs, targets)
            loss.backward()
            optimizer.step()
        else:
            with torch.no_grad():
                _, loss = model(inputs, targets)

        total_loss += loss.item() * batch.size(0)

    return total_loss / n


def main():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT genre, song_name FROM songs WHERE song_name IS NOT NULL")
    rows = cur.fetchall()
    conn.close()
    print(f"Loaded {len(rows)} songs")

    tokenizer = CharTokenizer()
    examples = torch.tensor(
        [make_example(genre, title, tokenizer) for genre, title in rows],
        dtype=torch.long,
    )

    torch.manual_seed(SEED)
    n = examples.size(0)
    perm = torch.randperm(n)
    n_val = max(1, int(n * VAL_FRACTION))
    val_idx, train_idx = perm[:n_val], perm[n_val:]
    train_examples, val_examples = examples[train_idx], examples[val_idx]
    print(f"Train: {train_examples.size(0)}  Val: {val_examples.size(0)}")

    model = TitleGenGPT(vocab_size=tokenizer.vocab_size)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR)

    train_losses, val_losses = [], []
    for epoch in range(EPOCHS):
        train_loss = run_epoch(model, train_examples, tokenizer, optimizer)
        val_loss = run_epoch(model, val_examples, tokenizer, optimizer=None)
        train_losses.append(train_loss)
        val_losses.append(val_loss)
        if epoch % 10 == 0 or epoch == EPOCHS - 1:
            print(f"epoch {epoch}: train {train_loss:.4f}  val {val_loss:.4f}")

    plt.figure(figsize=(8, 5))
    plt.plot(train_losses, label="train loss")
    plt.plot(val_losses, label="val loss")
    plt.xlabel("epoch")
    plt.ylabel("cross-entropy loss")
    plt.title("TitleGen GPT: train vs val loss")
    plt.legend()
    plt.grid(alpha=0.3)

    out_path = os.path.join(os.path.dirname(__file__), "titlegen_loss.png")
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    print(f"Saved {out_path}")


if __name__ == "__main__":
    main()
