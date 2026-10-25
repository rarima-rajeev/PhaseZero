# Phase Zero

**A trial before the trial.** Spot warning signs before the big money, $1B, is spent.

Type a well-known drug, get one risk card: liver risk, heart (hERG) risk, similar drugs that ran
into trouble, FDA label warnings, trials stopped early — every claim with a source link.

A fixed pipeline, not an agent. Classical ML does the scoring, plain code finds the facts, Gemini
only writes the summary.

## Run the website

```bash
npm install
npm run dev
```

Keys live in `.env.local` (not committed): `GEMINI_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`. The website
itself needs neither — everything is precomputed into `public/data/`. PostHog does nothing if its
key is empty.

## Rebuild the data

Everything below runs offline on a laptop. Each step caches, so re-running is cheap.

```bash
cd ml
python3.13 -m venv .venv && .venv/bin/pip install rdkit scikit-learn pandas requests python-dotenv google-genai
```

| Step | Command | What it does |
|---|---|---|
| 1 | `.venv/bin/python fetch_chembl.py` | Download ChEMBL drug warnings + approved drugs |
| 2 | `.venv/bin/python build_drugs.py` | Pick the 500 drugs and the withdrawn-drug backtest set |
| 3 | `.venv/bin/python train.py` | Train the liver + heart models, score every drug (~3 min) |
| 4 | `.venv/bin/python enrich.py` | Fetch PubChem / openFDA / ClinicalTrials.gov facts (~20 min) |
| 5 | `.venv/bin/python backtest.py` | Eval 1: would it have caught the withdrawn drugs? |
| 6 | `.venv/bin/python gemini_experiment.py` | Eval 2: trained model vs. asking Gemini directly |
| 7 | `.venv/bin/python gemini_cards.py` | Gemini writes the 500 plain-English summaries |
| 8 | `.venv/bin/python export.py` | Build `public/data/` + `src/data/results.json` |

Training data comes from the Therapeutics Data Commons files already in `ml/raw/`
(`dili.tab` = liver, `herg_karim.tab` = heart).

### Keeping the test fair

Drugs withdrawn from the market for liver or heart harm are removed from training entirely. Other
site drugs that appear in the training data are scored out-of-fold. So no score shown on the site
comes from a model that saw that drug.

## Licence

**Data:** derived from ChEMBL (CC BY-SA 3.0), Therapeutics Data Commons (CC BY 4.0), PubChem,
openFDA and ClinicalTrials.gov (public domain). See LICENSE.

**Code:** MIT.

## Limits

Decision support for researchers. Not medical advice. No patient data. See the Results page for the
honest numbers, including the misses.
