"""Eval 1: would the model have flagged drugs later withdrawn for liver or heart harm?
The withdrawn drugs were removed from training (see train.py), so this is a fair test.
Comparison group: site drugs with no known warnings at all — how often does the model raise a false alarm?"""
import json, pathlib
from train import FLAG

CACHE = pathlib.Path(__file__).parent / "cache"

drugs = json.loads((CACHE / "drugs_scored.json").read_text())
clean = [d for d in drugs if not d["warnings"]]
out = {"flag_threshold": FLAG, "organs": {}}
for organ in ("liver", "heart"):
    pulled = [d for d in drugs if organ in d["withdrawn_for"]]
    hits = [d for d in pulled if d["scores"][organ] >= FLAG]
    false_alarms = [d for d in clean if d["scores"][organ] >= FLAG]
    out["organs"][organ] = {
        "withdrawn": len(pulled), "caught": len(hits),
        "clean_drugs": len(clean), "clean_flagged": len(false_alarms),
        "results": sorted(({"id": d["id"], "name": d["name"], "score": d["scores"][organ],
                            "caught": d["scores"][organ] >= FLAG} for d in pulled),
                          key=lambda r: -r["score"]),
    }
    o = out["organs"][organ]
    print(f"{organ}: caught {o['caught']}/{o['withdrawn']} withdrawn | false alarms {o['clean_flagged']}/{o['clean_drugs']} clean")
(CACHE / "backtest.json").write_text(json.dumps(out, indent=1))
