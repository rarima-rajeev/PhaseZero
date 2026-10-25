"""Experiment 3: fine-tune a pretrained chemistry model on the liver data, and compare it
honestly against the Random Forest on exactly the same held-out chemicals.

Why the liver and not the heart: the liver model is the weak one (426 examples). Thin data is
where borrowing knowledge from a pretrained model should help most — and where it is cheapest
to test. The heart set would take hours on a CPU for little expected gain.

The model (ChemBERTa-77M) was pretrained on 77 million molecules from PubChem. We use a
safetensors copy of it: that format stores numbers only and cannot execute code, unlike the
older .bin format, which recent PyTorch refuses to load for exactly that reason. It has never seen a
toxicity label. We train a small classifier on top of it using our 340 training chemicals, then
score the same 86 held-out chemicals the Random Forest was scored on.

Free: the model downloads once and runs locally. No API, no account, no cost.
"""
import json, os, pathlib, sys

# Keep the laptop usable: cap the threads before torch is imported.
THREADS = int(os.environ.get("PZ_THREADS", "8"))
os.environ.setdefault("OMP_NUM_THREADS", str(THREADS))
os.environ.setdefault("MKL_NUM_THREADS", str(THREADS))

import numpy as np
import torch
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from train import DATA, load, to_np  # same data loading, so the comparison is fair

HERE = pathlib.Path(__file__).parent
CACHE = HERE / "cache"
MODEL_ID = "yzimmermann/ChemBERTa-77M-MLM-safetensors"
ORGAN = "liver"
EPOCHS, BATCH, LR = 30, 16, 3e-5
SEED = 0


def set_seed(s):
    torch.manual_seed(s)
    np.random.seed(s)


def encode(tok, smiles):
    enc = tok(list(smiles), padding=True, truncation=True, max_length=128, return_tensors="pt")
    return enc["input_ids"], enc["attention_mask"]


def main():
    torch.set_num_threads(THREADS)
    set_seed(SEED)

    # Same rows, same split, same seed as train.py — otherwise the comparison means nothing.
    drugs = json.loads((CACHE / "drugs.json").read_text())
    backtest_keys = {d["key"] for d in drugs if d["withdrawn_for"]}
    df = load(ORGAN, backtest_keys)
    y = df["y"].values
    idx_tr, idx_te = train_test_split(np.arange(len(df)), test_size=0.2, stratify=y, random_state=SEED)
    print(f"{len(idx_tr)} to learn from, {len(idx_te)} held out", flush=True)

    tok = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID, num_labels=2)

    ids_tr, mask_tr = encode(tok, df["smiles"][idx_tr])
    ids_te, mask_te = encode(tok, df["smiles"][idx_te])
    y_tr = torch.tensor(y[idx_tr])
    loader = DataLoader(TensorDataset(ids_tr, mask_tr, y_tr), batch_size=BATCH, shuffle=True)

    opt = torch.optim.AdamW(model.parameters(), lr=LR)
    model.train()
    for epoch in range(EPOCHS):
        total = 0.0
        for ids, mask, labels in loader:
            opt.zero_grad()
            out = model(input_ids=ids, attention_mask=mask, labels=labels)
            out.loss.backward()
            opt.step()
            total += out.loss.item()
        print(f"epoch {epoch + 1}/{EPOCHS}  loss {total / len(loader):.4f}", flush=True)

    model.eval()
    with torch.no_grad():
        logits = model(input_ids=ids_te, attention_mask=mask_te).logits
    p = torch.softmax(logits, dim=1)[:, 1].numpy()

    rf = json.loads((CACHE / "test_split.json").read_text())[ORGAN]
    by_smiles = {r["smiles"]: r for r in rf}
    rf_scores = [by_smiles[s]["ml"] for s in df["smiles"][idx_te]]

    result = {
        "model_id": MODEL_ID, "organ": ORGAN, "epochs": EPOCHS,
        "train_rows": len(idx_tr), "test_rows": len(idx_te),
        "finetuned_auc": round(float(roc_auc_score(y[idx_te], p)), 3),
        "finetuned_accuracy": round(float(((p >= 0.5) == y[idx_te]).mean()), 3),
        "random_forest_auc": round(float(roc_auc_score(y[idx_te], rf_scores)), 3),
        "random_forest_accuracy": round(float(((np.array(rf_scores) >= 0.5) == y[idx_te]).mean()), 3),
    }
    (CACHE / "finetune.json").write_text(json.dumps(result, indent=1))
    print(json.dumps(result, indent=1))


if __name__ == "__main__":
    sys.exit(main())
