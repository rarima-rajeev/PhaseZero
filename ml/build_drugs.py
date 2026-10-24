"""Step 1b: pick the ~500 drugs shown on the site, plus the backtest set
(drugs withdrawn from the market for liver or heart harm). Source: ChEMBL drug warnings."""
import json, pathlib, random, requests
from rdkit import Chem, RDLogger

RDLogger.DisableLog("rdApp.*")
HERE = pathlib.Path(__file__).parent
CACHE = HERE / "cache"
TARGET = 500
TOX = {"hepatotoxicity": "liver", "cardiotoxicity": "heart"}


def parent_key(smiles):
    """Connectivity part of the InChIKey of the largest fragment (drops salts)."""
    m = Chem.MolFromSmiles(smiles or "")
    if m is None:
        return None
    frags = Chem.GetMolFrags(m, asMols=True)
    m = max(frags, key=lambda f: f.GetNumHeavyAtoms())
    return Chem.MolToInchiKey(m).split("-")[0], Chem.MolToSmiles(m)


def fetch_molecules(ids):
    out = []
    ids = list(ids)
    for i in range(0, len(ids), 50):
        r = requests.get(
            f"https://www.ebi.ac.uk/chembl/api/data/molecule/set/{';'.join(ids[i:i+50])}.json",
            params={"only": "molecule_chembl_id,pref_name,molecule_structures,molecule_synonyms,first_approval,oral"},
            timeout=120).json()
        out += r["molecules"]
    return out


def names_of(m):
    syns = {s["molecule_synonym"].lower() for s in m.get("molecule_synonyms") or []
            if s["syn_type"] in ("INN", "USAN", "BAN", "OTHER", "TRADE_NAME", "USP", "JAN")}
    syns.add(m["pref_name"].lower())
    return sorted(s for s in syns if len(s) < 40)


if __name__ == "__main__":
    warnings = json.loads((CACHE / "chembl_warnings.json").read_text())
    approved = json.loads((CACHE / "chembl_approved.json").read_text())

    by_parent = {}
    for w in warnings:
        by_parent.setdefault(w["parent_molecule_chembl_id"], []).append({
            "type": "withdrawn" if w["warning_type"] == "Withdrawn" else "boxed",
            "organ": TOX.get(w["warning_class"]),
            "class": w["warning_class"],
            "country": w["warning_country"],
            "year": w["warning_year"],
            "description": w["warning_description"],
            "refs": [r["ref_url"] for r in w["warning_refs"] if r.get("ref_url")][:2],
        })

    mols = {m["molecule_chembl_id"]: m for m in approved}
    missing = [p for p in by_parent if p not in mols]
    for m in fetch_molecules(missing):
        mols[m["molecule_chembl_id"]] = m

    def usable(cid):
        m = mols.get(cid)
        return m and m.get("pref_name") and (m.get("molecule_structures") or {}).get("canonical_smiles")

    def organs(cid, kind):
        return {w["organ"] for w in by_parent.get(cid, []) if w["type"] == kind and w["organ"]}

    backtest = sorted(c for c in by_parent if organs(c, "withdrawn") and usable(c))
    boxed = sorted(c for c in by_parent if organs(c, "boxed") and usable(c) and c not in backtest)
    fill_pool = sorted(c for c, m in mols.items()
                       if c not in backtest and c not in boxed and usable(c) and m.get("oral") and m.get("first_approval"))
    random.Random(0).shuffle(fill_pool)
    must = ["CHEMBL112", "CHEMBL17157"]  # acetaminophen, terfenadine (used as examples on the page)
    chosen = list(dict.fromkeys(must + backtest + boxed))
    chosen += [c for c in fill_pool if c not in chosen]

    drugs, seen = [], set()
    for cid in chosen:
        if len(drugs) >= TARGET:
            break
        m = mols.get(cid)
        if not usable(cid):
            continue
        k = parent_key(m["molecule_structures"]["canonical_smiles"])
        if not k or k[0] in seen:
            continue
        seen.add(k[0])
        drugs.append({
            "id": cid, "name": m["pref_name"].title(), "names": names_of(m),
            "smiles": k[1], "key": k[0],
            "withdrawn_for": sorted(organs(cid, "withdrawn")),
            "warnings": by_parent.get(cid, []),
        })
    (CACHE / "drugs.json").write_text(json.dumps(drugs, indent=1))
    print("drugs", len(drugs), "| backtest (withdrawn liver/heart)", sum(1 for d in drugs if d["withdrawn_for"]),
          "| boxed liver/heart", len(boxed))
