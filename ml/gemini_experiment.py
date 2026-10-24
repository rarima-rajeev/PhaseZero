"""Eval 2: trained ML model vs. asking Gemini directly, on the same held-out test chemicals.
Gemini gets exactly what the model gets: the chemical structure (SMILES text), no drug name."""
import json, pathlib, random, sys, time
from concurrent.futures import ThreadPoolExecutor
from google.genai import types
from sklearn.metrics import roc_auc_score
from gemini_common import MODEL, client, log_usage

CACHE = pathlib.Path(__file__).parent / "cache"
OUT = CACHE / "gemini_experiment_raw.json"
HERG_SAMPLE, REPEAT_SAMPLE = 150, 30
QUESTION = {
    "liver": "Does this chemical cause drug-induced liver injury in humans?",
    "heart": "Does this chemical block the hERG potassium channel (IC50 below 10 micromolar)?",
}


def ask(organ, smiles):
    """Ask Gemini once. Retries on a network hiccup; returns None if it keeps failing."""
    prompt = (f"You are a toxicology expert. {QUESTION[organ]}\nChemical (SMILES): {smiles}\n"
              "Give the probability (0-100) that the answer is yes.")
    for attempt in range(4):
        try:
            resp = client.models.generate_content(
                model=MODEL, contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={"type": "object", "properties": {"probability": {"type": "integer"}},
                                     "required": ["probability"]}))
            log_usage(f"experiment_{organ}", resp)
            return json.loads(resp.text)["probability"] / 100
        except Exception as e:
            print("retry", organ, type(e).__name__, flush=True)
            time.sleep(3 * (attempt + 1))
    return None


if __name__ == "__main__":
    split = json.loads((CACHE / "test_split.json").read_text())
    raw = json.loads(OUT.read_text()) if OUT.exists() else {}
    rng = random.Random(0)
    for organ in ("liver", "heart"):
        rows = split[organ] if organ == "liver" else rng.sample(split[organ], HERG_SAMPLE)
        todo = [r for r in rows if r["smiles"] not in raw.get(organ, {})]
        with ThreadPoolExecutor(4) as ex:
            answers = list(ex.map(lambda r: ask(organ, r["smiles"]), todo))
        raw.setdefault(organ, {}).update({r["smiles"]: {"y": r["y"], "ml": r["ml"], "gemini": a}
                                          for r, a in zip(todo, answers) if a is not None})
        OUT.write_text(json.dumps(raw))
        # Ask a subset a second time to check consistency
        rep = [s for s in list(raw[organ])[:REPEAT_SAMPLE] if "gemini_2" not in raw[organ][s]]
        with ThreadPoolExecutor(4) as ex:
            for s, a in zip(rep, ex.map(lambda s: ask(organ, s), rep)):
                if a is not None:
                    raw[organ][s]["gemini_2"] = a
        OUT.write_text(json.dumps(raw))

    result = {"model": MODEL}
    for organ, rows in raw.items():
        v = list(rows.values())
        y = [r["y"] for r in v]
        reps = [r for r in v if "gemini_2" in r]
        result[organ] = {
            "n": len(v),
            "ml_auc": round(roc_auc_score(y, [r["ml"] for r in v]), 3),
            "gemini_auc": round(roc_auc_score(y, [r["gemini"] for r in v]), 3),
            "ml_accuracy": round(sum((r["ml"] >= 0.5) == r["y"] for r in v) / len(v), 3),
            "gemini_accuracy": round(sum((r["gemini"] >= 0.5) == r["y"] for r in v) / len(v), 3),
            "repeat_n": len(reps),
            "gemini_same_flag_on_repeat": sum((r["gemini"] >= 0.5) == (r["gemini_2"] >= 0.5) for r in reps),
            "gemini_mean_abs_change": round(sum(abs(r["gemini"] - r["gemini_2"]) for r in reps) / max(1, len(reps)), 3),
        }
        print(organ, result[organ])
    (CACHE / "experiment.json").write_text(json.dumps(result, indent=1))
