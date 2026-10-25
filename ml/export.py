"""Step 4: assemble one card per drug (facts + scores + numbered sources) for the website.
Writes public/data/index.json, public/data/drugs/<id>.json and src/data/results.json."""
import json, pathlib

HERE = pathlib.Path(__file__).parent
CACHE = HERE / "cache"
ROOT = HERE.parent
PUB = ROOT / "public" / "data"
(PUB / "drugs").mkdir(parents=True, exist_ok=True)
(ROOT / "src" / "data").mkdir(parents=True, exist_ok=True)

# Plain-English words for the official warning categories. No jargon on the site.
ORGAN_WORD = {
    "hepatotoxicity": "liver harm",
    "cardiotoxicity": "heart harm",
    "neurotoxicity": "nerve and brain harm",
    "nephrotoxicity": "kidney harm",
    "carcinogenicity": "cancer risk",
    "teratogenicity": "harm to an unborn baby",
    "hematological toxicity": "blood problems",
    "immune system toxicity": "immune system problems",
    "dermatological toxicity": "serious skin reactions",
    "vascular toxicity": "blood vessel problems",
    "respiratory toxicity": "breathing problems",
    "gastrointestinal toxicity": "stomach and gut problems",
    "psychiatric toxicity": "mental health effects",
    "musculoskeletal toxicity": "muscle and bone problems",
    "metabolic toxicity": "effects on the body's chemistry",
    "occular toxicity": "eye problems",
    "ototoxicity": "hearing problems",
    "misuse": "misuse or addiction",
    "drug misuse": "misuse or addiction",
    "infectious disease": "higher risk of infection",
}


def reason(w):
    return ORGAN_WORD.get(w["class"])


def countries(ws):
    """Country names, deduplicated; a long list becomes 'X and N other countries'."""
    seen = []
    for w in ws:
        for c in (w["country"] or "").split(";"):
            c = c.strip()
            if c and c not in seen:
                seen.append(c)
    if not seen:
        return ""
    seen.sort(key=lambda c: c != "United States")  # put the US first when present
    if len(seen) == 1:
        return seen[0]
    if len(seen) == 2:
        return f"{seen[0]} and {seen[1]}"
    return f"{seen[0]} and {len(seen) - 1} other countries"


def join(items):
    items = list(dict.fromkeys(i for i in items if i))
    if len(items) <= 1:
        return items[0] if items else None
    return ", ".join(items[:-1]) + " and " + items[-1]


def problems_of(d):
    """One line per kind of trouble, with the clearest reason and place."""
    out = []
    for kind, lead in (("withdrawn", "Pulled from the market"), ("boxed", "Carries a boxed warning")):
        ws = [w for w in d["warnings"] if w["type"] == kind]
        if not ws:
            continue
        text = lead
        where = countries(ws)
        years = [w["year"] for w in ws if w["year"]]
        if where == "Worldwide":
            text += " worldwide"
        elif where:
            text += f" in {where}"
        if years:
            text += f", first in {min(years)}" if where else f" in {min(years)}"
        why = join([reason(w) for w in ws][:3])
        if why:
            text += f" — for {why}"
        ref = next((w["refs"][0] for w in ws if w["refs"]), None)
        out.append((text, ref))
    return out


def build_card(d, by_id, facts):
    sources = []

    def cite(label, url):
        if not url:
            return None
        for i, s in enumerate(sources):
            if s["url"] == url:
                return i + 1
        sources.append({"label": label, "url": url})
        return len(sources)

    pubchem = f"https://pubchem.ncbi.nlm.nih.gov/compound/{facts['pubchem_cid']}" if facts.get("pubchem_cid") else None
    card = {
        "id": d["id"], "name": d["name"],
        "info": cite(f"PubChem: {d['name']}", pubchem),
        "chembl": cite(f"ChEMBL: {d['name']}", f"https://www.ebi.ac.uk/chembl/compound_report_card/{d['id']}/"),
        "scores": {o: {"score": round(s * 100), "band": d["bands"][o]} for o, s in d["scores"].items()},
        "own_problems": [], "similar": [], "fda": [], "trials": None,
    }
    for text, ref in problems_of(d):
        card["own_problems"].append({"text": text, "source": cite(f"Official record: {d['name']}", ref)})
    for s in d["similar"]:
        o = by_id[s["id"]]
        probs = problems_of(o)
        card["similar"].append({"name": o["name"], "similarity": round(s["similarity"] * 100),
                                "problems": [t for t, _ in probs],
                                "source": cite(f"Official record: {o['name']}",
                                               next((r for _, r in probs if r), None))})
    if facts.get("fda"):
        src = cite(f"FDA drug label: {d['name']}", facts["fda"]["url"])
        card["fda"] = [{**it, "source": src} for it in facts["fda"]["items"]]
    t = facts.get("trials")
    if t and t["total_stopped"]:
        card["trials"] = {
            "total": t["total_stopped"],
            "search": cite("ClinicalTrials.gov search",
                           f"https://clinicaltrials.gov/search?intr={d['name'].replace(' ', '%20')}&aggFilters=status:ter"),
            "examples": [{"title": e["title"], "why": e["why"], "source": cite(f"Trial {e['id']}", e["url"])}
                         for e in t["examples"]],
        }
    card["sources"] = sources
    return card


# Gemini Flash list price, US dollars per million tokens.
PRICE_IN, PRICE_OUT, USD_TO_INR = 0.30, 2.50, 89.0


def gemini_cost():
    """What the whole project actually cost to run, from the logged token counts."""
    usage = CACHE / "gemini_usage.jsonl"
    if not usage.exists():
        return None
    rows = [json.loads(l) for l in usage.read_text().splitlines()]
    out = {}
    for group, prefix in (("cards", "card_summary"), ("experiment", "experiment")):
        g = [r for r in rows if r["task"].startswith(prefix)]
        usd = sum(r["in"] for r in g) / 1e6 * PRICE_IN + sum(r["out"] for r in g) / 1e6 * PRICE_OUT
        out[group] = {"calls": len(g), "usd": round(usd, 3), "inr": round(usd * USD_TO_INR, 1)}
    out["total_inr"] = round(sum(v["inr"] for v in out.values()), 1)
    return out


if __name__ == "__main__":
    drugs = json.loads((CACHE / "drugs_scored.json").read_text())
    by_id = {d["id"]: d for d in drugs}
    summaries_f = CACHE / "summaries.json"
    summaries = json.loads(summaries_f.read_text()) if summaries_f.exists() else {}
    index = []
    for d in drugs:
        facts = json.loads((CACHE / "facts" / f"{d['id']}.json").read_text())
        card = build_card(d, by_id, facts)
        card["summary"] = summaries.get(d["id"])
        (PUB / "drugs" / f"{d['id']}.json").write_text(json.dumps(card))
        index.append({"id": d["id"], "name": d["name"], "names": d["names"]})
    (PUB / "index.json").write_text(json.dumps(sorted(index, key=lambda x: x["name"])))

    results = {"train": json.loads((CACHE / "train_report.json").read_text()),
               "backtest": json.loads((CACHE / "backtest.json").read_text())}
    exp = CACHE / "experiment.json"
    results["experiment"] = json.loads(exp.read_text()) if exp.exists() else None
    ft = CACHE / "finetune.json"
    results["finetune"] = json.loads(ft.read_text()) if ft.exists() else None
    results["gemini_cost"] = gemini_cost()
    (ROOT / "src" / "data" / "results.json").write_text(json.dumps(results, indent=1))
    print("cards", len(index), "| with summary", sum(1 for d in drugs if d["id"] in summaries))
