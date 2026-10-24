"""Step 2: train two small classic ML models (liver, heart) and score the 500 drugs.

Rule: every score shown on the site comes from a model that never saw that drug.
- Drugs withdrawn for liver/heart harm (the backtest set) are removed from training entirely.
- Other site drugs that appear in the training data get an out-of-fold score (5-fold).
"""
import json, pathlib
import numpy as np, pandas as pd
from rdkit import Chem, DataStructs, RDLogger
from rdkit.Chem import rdFingerprintGenerator
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, train_test_split

RDLogger.DisableLog("rdApp.*")
HERE = pathlib.Path(__file__).parent
CACHE = HERE / "cache"
GEN = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
DATA = {"liver": "raw/dili.tab", "heart": "raw/herg_karim.tab"}
FLAG = 0.5  # score at or above this = "flagged" (High or Medium on the card)


def mol_of(smiles):
    m = Chem.MolFromSmiles(smiles or "")
    if m is None:
        return None
    return max(Chem.GetMolFrags(m, asMols=True), key=lambda f: f.GetNumHeavyAtoms())


def fp(m):
    return GEN.GetFingerprint(m)


def to_np(fps):
    arr = np.zeros((len(fps), 2048), dtype=np.uint8)
    for i, f in enumerate(fps):
        DataStructs.ConvertToNumpyArray(f, arr[i])
    return arr


def model():
    return RandomForestClassifier(n_estimators=500, min_samples_leaf=1, class_weight="balanced",
                                  n_jobs=-1, random_state=0)


def load(organ, exclude_keys):
    df = pd.read_csv(HERE / DATA[organ], sep="\t")
    rows = []
    for smi, y in zip(df["Drug"], df["Y"]):
        m = mol_of(smi)
        if m is None:
            continue
        key = Chem.MolToInchiKey(m).split("-")[0]
        if key in exclude_keys:
            continue
        rows.append((key, Chem.MolToSmiles(m), int(y), fp(m)))
    out = pd.DataFrame(rows, columns=["key", "smiles", "y", "fp"]).drop_duplicates("key")
    return out.reset_index(drop=True)


def band(s):
    return "High" if s >= 0.65 else "Medium" if s >= FLAG else "Low"


if __name__ == "__main__":
    drugs = json.loads((CACHE / "drugs.json").read_text())
    backtest_keys = {d["key"] for d in drugs if d["withdrawn_for"]}
    drug_fps = [fp(mol_of(d["smiles"])) for d in drugs]
    X_drugs = to_np(drug_fps)
    key_to_idx = {d["key"]: i for i, d in enumerate(drugs)}

    report, split_out = {}, {}
    for organ in DATA:
        df = load(organ, backtest_keys)
        X, y = to_np(list(df["fp"])), df["y"].values

        # Held-out test set for the ML-vs-Gemini experiment (20%, fixed seed)
        idx_tr, idx_te = train_test_split(np.arange(len(df)), test_size=0.2, stratify=y, random_state=0)
        m = model().fit(X[idx_tr], y[idx_tr])
        p_te = m.predict_proba(X[idx_te])[:, 1]
        split_out[organ] = [{"smiles": df["smiles"][i], "y": int(y[i]), "ml": round(float(p), 4)}
                            for i, p in zip(idx_te, p_te)]

        # Final model on all (cleaned) data + out-of-fold scores for training rows
        final = model().fit(X, y)
        scores = final.predict_proba(X_drugs)[:, 1]
        oof = np.zeros(len(df))
        for tr, te in StratifiedKFold(5, shuffle=True, random_state=0).split(X, y):
            oof[te] = model().fit(X[tr], y[tr]).predict_proba(X[te])[:, 1]
        overlap = 0
        for j, k in enumerate(df["key"]):
            if k in key_to_idx:
                scores[key_to_idx[k]] = oof[j]
                overlap += 1
        for d, s in zip(drugs, scores):
            d.setdefault("scores", {})[organ] = round(float(s), 3)

        report[organ] = {
            "training_rows": int(len(df)), "positives": int(y.sum()),
            "test_rows": int(len(idx_te)),
            "test_auc": round(float(roc_auc_score(y[idx_te], p_te)), 3),
            "cv_auc": round(float(roc_auc_score(y, oof)), 3),
            "site_drugs_in_training_scored_out_of_fold": overlap,
        }
        print(organ, report[organ])

    # Similar drugs that ran into trouble (withdrawn or boxed warning), by structure similarity
    troubled = [i for i, d in enumerate(drugs) if d["warnings"]]
    for i, d in enumerate(drugs):
        sims = DataStructs.BulkTanimotoSimilarity(drug_fps[i], [drug_fps[j] for j in troubled])
        ranked = sorted(((s, j) for s, j in zip(sims, troubled) if j != i), reverse=True)[:3]
        d["similar"] = [{"id": drugs[j]["id"], "similarity": round(s, 2)} for s, j in ranked if s >= 0.3]
        d["bands"] = {o: band(s) for o, s in d["scores"].items()}

    (CACHE / "drugs_scored.json").write_text(json.dumps(drugs, indent=1))
    (CACHE / "test_split.json").write_text(json.dumps(split_out))
    (CACHE / "train_report.json").write_text(json.dumps(report, indent=1))
