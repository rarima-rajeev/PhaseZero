"""Give the fine-tuned model the exact same exam Test 1 gave the Random Forest, so the two
accuracy figures sit on the same scale.

The exam: the liver drugs that were pulled from the market (never in training), plus the site
drugs with no known problems. Score each, count how many were flagged correctly.
"""
import json, os, pathlib

THREADS = int(os.environ.get("PZ_THREADS", "8"))
os.environ.setdefault("OMP_NUM_THREADS", str(THREADS))

import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from finetune import BATCH, EPOCHS, LR, MODEL_ID, SEED, encode, set_seed
from train import FLAG, load, mol_of

CACHE = pathlib.Path(__file__).parent / "cache"
ORGAN = "liver"


def main():
    torch.set_num_threads(THREADS)
    set_seed(SEED)

    drugs = json.loads((CACHE / "drugs_scored.json").read_text())
    hidden = {d["key"] for d in drugs if d["withdrawn_for"]}

    # Train on everything the random forest trained on — the withdrawn drugs stay out.
    df = load(ORGAN, hidden)
    tok = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID, num_labels=2)
    ids, mask = encode(tok, df["smiles"])
    loader = DataLoader(TensorDataset(ids, mask, torch.tensor(df["y"].values)),
                        batch_size=BATCH, shuffle=True)
    opt = torch.optim.AdamW(model.parameters(), lr=LR)
    model.train()
    for epoch in range(EPOCHS):
        total = 0.0
        for a, b, y in loader:
            opt.zero_grad()
            out = model(input_ids=a, attention_mask=b, labels=y)
            out.loss.backward()
            opt.step()
            total += out.loss.item()
        if (epoch + 1) % 5 == 0:
            print(f"epoch {epoch + 1}/{EPOCHS}  loss {total / len(loader):.4f}", flush=True)

    # The exam: withdrawn-for-liver drugs, and drugs with no known problems.
    exam = [(d, 1) for d in drugs if ORGAN in d["withdrawn_for"]]
    exam += [(d, 0) for d in drugs if not d["warnings"]]
    smiles = [d["smiles"] for d, _ in exam]
    truth = np.array([t for _, t in exam])

    model.eval()
    ids, mask = encode(tok, smiles)
    scores = []
    with torch.no_grad():
        for i in range(0, len(smiles), 64):
            logits = model(input_ids=ids[i:i + 64], attention_mask=mask[i:i + 64]).logits
            scores += torch.softmax(logits, dim=1)[:, 1].tolist()
    ft = np.array(scores) >= FLAG
    rf = np.array([d["scores"][ORGAN] for d, _ in exam]) >= FLAG  # scores are 0-1, not 0-100

    def report(name, flagged):
        danger = truth == 1
        caught = int((flagged & danger).sum())
        cleared = int((~flagged & ~danger).sum())
        print(f"{name:22} flagged {caught}/{int(danger.sum())} dangerous, "
              f"cleared {cleared}/{int((~danger).sum())} clean, "
              f"overall {(caught + cleared) / len(truth) * 100:.0f}%")
        return {"caught": caught, "dangerous": int(danger.sum()), "cleared": cleared,
                "clean": int((~danger).sum()),
                "accuracy": round(float((caught + cleared) / len(truth)), 3)}

    out = {"exam_size": len(truth), "organ": ORGAN, "model_id": MODEL_ID,
           "finetuned_scores": {d["id"]: round(float(s), 3) for (d, _), s in zip(exam, scores)},
           "random_forest": report("Random Forest", rf),
           "finetuned": report("Fine-tuned ChemBERTa", ft)}
    (CACHE / "finetune_same_exam.json").write_text(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
