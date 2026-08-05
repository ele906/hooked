"""Small decoder-only transformer that generates song title suggestions,
conditioned on genre (in the style of nanoGPT / makemore).

Char-level, causal self-attention, next-character prediction. Genre is used
as a control code: training sequences are formatted as "<genre>song title",
so the model learns to condition its generation on whatever genre token
precedes the title.
"""
import math

import torch
import torch.nn as nn
import torch.nn.functional as F

BLOCK_SIZE = 48  # max sequence length (control code + title) the model attends over
N_EMBED = 128
N_HEAD = 4
N_LAYER = 3
DROPOUT = 0.1

PAD = "\x00"
BOS = "\x01"  # marks the start of the title, after the genre control code
EOS = "\x02"


class CharTokenizer:
    """Fixed vocabulary of printable ASCII + a few control characters, so the
    tokenizer doesn't need to be fit/persisted separately from the model code."""

    def __init__(self):
        printable = [chr(c) for c in range(32, 127)]
        self.chars = [PAD, BOS, EOS] + printable
        self.stoi = {ch: i for i, ch in enumerate(self.chars)}
        self.itos = {i: ch for i, ch in enumerate(self.chars)}
        self.pad_id = self.stoi[PAD]
        self.bos_id = self.stoi[BOS]
        self.eos_id = self.stoi[EOS]

    @property
    def vocab_size(self):
        return len(self.chars)

    def encode(self, text):
        return [self.stoi[ch] for ch in text if ch in self.stoi]

    def decode(self, ids):
        return "".join(self.itos[i] for i in ids if i in self.itos)


def make_example(genre, title, tokenizer, block_size=BLOCK_SIZE):
    """Formats one training sequence as "<genre token(s)><BOS>title<EOS>", so the
    genre acts as a prefix the model conditions its title generation on."""
    genre = (genre or "unknown").lower().strip()
    ids = tokenizer.encode(genre) + [tokenizer.bos_id] + tokenizer.encode(title) + [tokenizer.eos_id]
    ids = ids[:block_size]
    ids += [tokenizer.pad_id] * (block_size - len(ids))
    return ids


class CausalSelfAttention(nn.Module):
    def __init__(self, n_embed=N_EMBED, n_head=N_HEAD, block_size=BLOCK_SIZE, dropout=DROPOUT):
        super().__init__()
        assert n_embed % n_head == 0
        self.n_head = n_head
        self.head_dim = n_embed // n_head

        self.qkv = nn.Linear(n_embed, 3 * n_embed)
        self.proj = nn.Linear(n_embed, n_embed)
        self.dropout = nn.Dropout(dropout)

        mask = torch.tril(torch.ones(block_size, block_size)).view(1, 1, block_size, block_size)
        self.register_buffer("causal_mask", mask)

    def forward(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(x).split(C, dim=2)
        q = q.view(B, T, self.n_head, self.head_dim).transpose(1, 2)
        k = k.view(B, T, self.n_head, self.head_dim).transpose(1, 2)
        v = v.view(B, T, self.n_head, self.head_dim).transpose(1, 2)

        attn = (q @ k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        attn = attn.masked_fill(self.causal_mask[:, :, :T, :T] == 0, float("-inf"))
        attn = F.softmax(attn, dim=-1)
        attn = self.dropout(attn)

        out = attn @ v
        out = out.transpose(1, 2).contiguous().view(B, T, C)
        return self.proj(out)


class TransformerBlock(nn.Module):
    def __init__(self, n_embed=N_EMBED, n_head=N_HEAD, block_size=BLOCK_SIZE, dropout=DROPOUT):
        super().__init__()
        self.ln1 = nn.LayerNorm(n_embed)
        self.attn = CausalSelfAttention(n_embed, n_head, block_size, dropout)
        self.ln2 = nn.LayerNorm(n_embed)
        self.mlp = nn.Sequential(
            nn.Linear(n_embed, 4 * n_embed),
            nn.GELU(),
            nn.Linear(4 * n_embed, n_embed),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        x = x + self.mlp(self.ln2(x))
        return x


class TitleGenGPT(nn.Module):
    def __init__(self, vocab_size, n_embed=N_EMBED, n_head=N_HEAD, n_layer=N_LAYER,
                 block_size=BLOCK_SIZE, dropout=DROPOUT):
        super().__init__()
        self.block_size = block_size
        self.token_emb = nn.Embedding(vocab_size, n_embed)
        self.pos_emb = nn.Embedding(block_size, n_embed)
        self.drop = nn.Dropout(dropout)
        self.blocks = nn.Sequential(*[
            TransformerBlock(n_embed, n_head, block_size, dropout) for _ in range(n_layer)
        ])
        self.ln_f = nn.LayerNorm(n_embed)
        self.head = nn.Linear(n_embed, vocab_size, bias=False)

    def forward(self, idx, targets=None):
        B, T = idx.shape
        pos = torch.arange(T, device=idx.device).unsqueeze(0)
        x = self.drop(self.token_emb(idx) + self.pos_emb(pos))
        x = self.blocks(x)
        x = self.ln_f(x)
        logits = self.head(x)

        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                logits.view(-1, logits.size(-1)), targets.view(-1), ignore_index=-1
            )
        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens, temperature=0.8, top_k=10, eos_id=None):
        self.eval()
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.block_size:]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / temperature

            if top_k is not None:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float("-inf")

            probs = F.softmax(logits, dim=-1)
            next_id = torch.multinomial(probs, num_samples=1)
            idx = torch.cat([idx, next_id], dim=1)

            if eos_id is not None and next_id.item() == eos_id:
                break
        return idx
