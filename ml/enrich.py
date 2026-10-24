"""Step 3: fetch public facts for each drug (cached): PubChem id, FDA label warnings, stopped clinical trials."""
import json, pathlib, re, time
from concurrent.futures import ThreadPoolExecutor
import requests

CACHE = pathlib.Path(__file__).parent / "cache"
OUT = CACHE / "facts"
OUT.mkdir(exist_ok=True)


def get(url, params=None):
    for attempt in range(4):
        try:
            r = requests.get(url, params=params, timeout=60)
            if r.status_code == 404:
                return None
            if r.status_code == 429:
                time.sleep(5 * (attempt + 1)); continue
            r.raise_for_status()
            return r.json()
        except requests.RequestException:
            time.sleep(2 * (attempt + 1))
    return None


def short(text, n=320):
    text = re.sub(r"\s+", " ", text or "").strip()
    text = re.sub(r"^(WARNING:|BOXED WARNING|WARNINGS?)\s*", "", text, flags=re.I)
    return text if len(text) <= n else text[:n].rsplit(" ", 1)[0] + "…"


def pubchem(name):
    d = get(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{requests.utils.quote(name)}/cids/JSON")
    cids = (d or {}).get("IdentifierList", {}).get("CID")
    return cids[0] if cids else None


def fda(names):
    for n in names[:3]:
        for field in ("openfda.generic_name", "openfda.substance_name"):
            d = get("https://api.fda.gov/drug/label.json", {"search": f'{field}:"{n}"', "limit": 1})
            if d and d.get("results"):
                lab = d["results"][0]
                items = []
                if lab.get("boxed_warning"):
                    items.append({"kind": "Boxed warning (the FDA's strongest)", "text": short(lab["boxed_warning"][0])})
                w = lab.get("warnings_and_cautions") or lab.get("warnings")
                if w:
                    items.append({"kind": "Warning", "text": short(w[0])})
                set_id = lab.get("set_id")
                return {"url": f"https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={set_id}" if set_id else None,
                        "items": items}
    return None


def trials(name):
    d = get("https://clinicaltrials.gov/api/v2/studies", {
        "query.intr": name, "filter.overallStatus": "TERMINATED",
        "fields": "NCTId,BriefTitle,WhyStopped", "pageSize": 20, "countTotal": "true"})
    if not d:
        return None
    rows = []
    for s in d.get("studies", []):
        p = s["protocolSection"]
        why = p.get("statusModule", {}).get("whyStopped")
        if not why:
            continue
        nct = p["identificationModule"]["nctId"]
        rows.append({"id": nct, "title": short(p["identificationModule"].get("briefTitle"), 140),
                     "why": short(why, 200), "url": f"https://clinicaltrials.gov/study/{nct}"})
    # prefer trials stopped for safety reasons
    rows.sort(key=lambda r: not re.search(r"safety|toxic|adverse|liver|hepat|cardi|qt", r["why"], re.I))
    return {"total_stopped": d.get("totalCount", 0), "examples": rows[:3]}


def enrich(d):
    f = OUT / f"{d['id']}.json"
    if f.exists():
        return
    name = d["name"].lower()
    facts = {"pubchem_cid": pubchem(name), "fda": fda([name] + [n for n in d["names"] if n != name]),
             "trials": trials(name)}
    f.write_text(json.dumps(facts))


if __name__ == "__main__":
    drugs = json.loads((CACHE / "drugs.json").read_text())
    with ThreadPoolExecutor(3) as ex:
        for i, _ in enumerate(ex.map(enrich, drugs)):
            if i % 50 == 0:
                print(i, flush=True)
    have = [json.loads((OUT / f"{d['id']}.json").read_text()) for d in drugs]
    print("pubchem", sum(bool(h["pubchem_cid"]) for h in have), "fda", sum(bool(h["fda"]) for h in have),
          "trials", sum(bool(h["trials"] and h["trials"]["examples"]) for h in have))
