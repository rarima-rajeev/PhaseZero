"""Step 1a: download ChEMBL drug warnings (withdrawals + boxed warnings) and approved small-molecule drugs."""
import json, pathlib, requests

BASE = "https://www.ebi.ac.uk/chembl/api/data"
CACHE = pathlib.Path(__file__).parent / "cache"


def fetch_all(endpoint, key, params):
    out, url, p = [], f"{BASE}/{endpoint}.json", {**params, "limit": 1000}
    while url:
        r = requests.get(url, params=p, timeout=120).json()
        out += r[key]
        nxt = r["page_meta"]["next"]
        url, p = (f"https://www.ebi.ac.uk{nxt}" if nxt else None), None
        print(endpoint, len(out), "/", r["page_meta"]["total_count"])
    return out


if __name__ == "__main__":
    warnings = fetch_all("drug_warning", "drug_warnings", {})
    (CACHE / "chembl_warnings.json").write_text(json.dumps(warnings))
    mols = fetch_all("molecule", "molecules", {
        "max_phase": 4, "molecule_type": "Small molecule",
        "only": "molecule_chembl_id,pref_name,molecule_structures,molecule_synonyms,oral,first_approval,withdrawn_flag,molecule_hierarchy",
    })
    (CACHE / "chembl_approved.json").write_text(json.dumps(mols))
