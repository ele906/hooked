"""Neural collaborative filtering (NeuMF-lite) for the "similarity" recommendation path.

Combines a Generalized Matrix Factorization (GMF) tower with a small MLP tower over
learned user/item embeddings, in the style of He et al. 2017 "Neural Collaborative
Filtering". Trained offline on implicit feedback from the `interactions` table
(likes/favorites as positives, dislikes as explicit negatives, random unseen
pairs as sampled negatives) and used to rerank a content-based candidate shortlist
at serve time. This is a signal on top of the existing content-based vectors, not
a replacement — users/songs without enough interaction history simply have no
entry in the trained mappings and are skipped by the caller.
"""
import random
import torch
import torch.nn as nn

# minimum number of interactions a user/song needs before it's worth including
# in training — below this the signal is mostly noise
MIN_USER_INTERACTIONS = 5
MIN_SONG_INTERACTIONS = 5

POSITIVE_TYPES = {"like", "favorite"}
NEGATIVE_TYPES = {"dislike"}

GMF_DIM = 16
MLP_DIM = 16
MLP_HIDDEN = [32, 16, 8]


class NeuMF(nn.Module):
    def __init__(self, n_users, n_items, gmf_dim=GMF_DIM, mlp_dim=MLP_DIM, mlp_hidden=MLP_HIDDEN):
        super().__init__()
        self.user_gmf = nn.Embedding(n_users, gmf_dim)
        self.item_gmf = nn.Embedding(n_items, gmf_dim)
        self.user_mlp = nn.Embedding(n_users, mlp_dim)
        self.item_mlp = nn.Embedding(n_items, mlp_dim)

        layers = []
        in_dim = mlp_dim * 2
        for h in mlp_hidden:
            layers += [nn.Linear(in_dim, h), nn.ReLU()]
            in_dim = h
        self.mlp = nn.Sequential(*layers)

        self.final = nn.Linear(gmf_dim + mlp_hidden[-1], 1)

        for emb in (self.user_gmf, self.item_gmf, self.user_mlp, self.item_mlp):
            nn.init.normal_(emb.weight, std=0.05)

    def forward(self, user_idx, item_idx):
        gmf_out = self.user_gmf(user_idx) * self.item_gmf(item_idx)
        mlp_in = torch.cat([self.user_mlp(user_idx), self.item_mlp(item_idx)], dim=-1)
        mlp_out = self.mlp(mlp_in)
        combined = torch.cat([gmf_out, mlp_out], dim=-1)
        return self.final(combined).squeeze(-1)  # raw logit, apply sigmoid for a 0-1 score


def build_id_maps(interactions, min_user=MIN_USER_INTERACTIONS, min_song=MIN_SONG_INTERACTIONS):
    """Filters interactions down to users/songs with enough history and builds
    dense index maps for embedding lookup. Returns (user_to_idx, song_to_idx, filtered)."""
    user_counts, song_counts = {}, {}
    for user_id, song_id, _type in interactions:
        user_counts[user_id] = user_counts.get(user_id, 0) + 1
        song_counts[song_id] = song_counts.get(song_id, 0) + 1

    keep_users = {u for u, c in user_counts.items() if c >= min_user}
    keep_songs = {s for s, c in song_counts.items() if c >= min_song}

    filtered = [row for row in interactions if row[0] in keep_users and row[1] in keep_songs]

    user_to_idx = {u: i for i, u in enumerate(sorted(keep_users))}
    song_to_idx = {s: i for i, s in enumerate(sorted(keep_songs))}
    return user_to_idx, song_to_idx, filtered


def build_training_pairs(filtered_interactions, user_to_idx, song_to_idx, n_negatives=4, seed=42):
    """Builds (user_idx, item_idx, label) triples: explicit positives/negatives from
    interactions plus randomly sampled negatives for unobserved user/song pairs
    (standard implicit-feedback CF technique)."""
    rng = random.Random(seed)
    all_song_indices = list(song_to_idx.values())

    observed = set()
    pairs = []
    for user_id, song_id, itype in filtered_interactions:
        if user_id not in user_to_idx or song_id not in song_to_idx:
            continue
        u, s = user_to_idx[user_id], song_to_idx[song_id]
        observed.add((u, s))
        if itype in POSITIVE_TYPES:
            pairs.append((u, s, 1.0))
        elif itype in NEGATIVE_TYPES:
            pairs.append((u, s, 0.0))

    n_pos = sum(1 for *_r, label in pairs if label == 1.0)
    users_with_positives = sorted({u for u, s, label in pairs if label == 1.0})

    for _ in range(n_pos * n_negatives):
        if not users_with_positives or not all_song_indices:
            break
        u = rng.choice(users_with_positives)
        s = rng.choice(all_song_indices)
        if (u, s) in observed:
            continue
        pairs.append((u, s, 0.0))
        observed.add((u, s))

    return pairs


def train_neumf(pairs, n_users, n_items, epochs=20, lr=0.01, weight_decay=1e-5, seed=42):
    """Trains a NeuMF model on the given (user_idx, item_idx, label) pairs."""
    torch.manual_seed(seed)
    model = NeuMF(n_users, n_items)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
    loss_fn = nn.BCEWithLogitsLoss()

    users = torch.tensor([p[0] for p in pairs], dtype=torch.long)
    items = torch.tensor([p[1] for p in pairs], dtype=torch.long)
    labels = torch.tensor([p[2] for p in pairs], dtype=torch.float32)

    model.train()
    for _ in range(epochs):
        optimizer.zero_grad()
        logits = model(users, items)
        loss = loss_fn(logits, labels)
        loss.backward()
        optimizer.step()

    return model


def score_pairs(model, user_indices, item_indices):
    """Scores a batch of (user_idx, item_idx) pairs, returning 0-1 probabilities."""
    model.eval()
    with torch.no_grad():
        u = torch.tensor(user_indices, dtype=torch.long)
        i = torch.tensor(item_indices, dtype=torch.long)
        logits = model(u, i)
        return torch.sigmoid(logits).tolist()
