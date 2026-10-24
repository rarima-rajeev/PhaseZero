"""Step 5: Gemini writes a short plain-English summary for each card, from the card's facts only.
Every sentence must cite a numbered source from the card. Citations to sources that don't exist are rejected."""
import json, pathlib, re, sys
from concurrent.futures import ThreadPoolExecutor
from google.genai import types
from gemini_common import MODEL, client, log_usage

ROOT = pathlib.Path(__file__).parent.parent
CACHE = pathlib.Path(__file__).parent / "cache"
OUT = CACHE / "summaries.json"

RULES = """Write a 3-4 sentence summary of this drug's warning signs for a smart reader with no medical background.
Rules:
- Use ONLY the facts in the JSON below. Do not add anything you know from elsewhere.
- End every sentence with the source number(s) it relies on, like [2] or [1][3]. Only use numbers listed in "sources".
- The liver and heart scores come from a small computer model, not from tests on people. Say so in plain words, and cite [M] for them.
- Plain words. No jargon. If you must use a medical word, explain it.
- Do not give medical advice. Do not say the drug is safe or unsafe.
"""


def facts_for_prompt(card):
    c = {k: card[k] for k in ("name", "scores", "own_problems", "similar", "fda", "trials")}
    c["sources"] = {i + 1: s["label"] for i, s in enumerate(card["sources"])}
    return json.dumps(c)


def summarize(card):
    resp = client.models.generate_content(
        model=MODEL, contents=RULES + "\nFACTS:\n" + facts_for_prompt(card),
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_level="low"),
            response_mime_type="application/json",
            response_schema={"type": "object", "properties": {"summary": {"type": "string"}}, "required": ["summary"]}))
    log_usage("card_summary", resp)
    text = json.loads(resp.text)["summary"].strip()
    valid = {str(i + 1) for i in range(len(card["sources"]))} | {"M"}
    cited = set(re.findall(r"\[(\w+)\]", text))
    if not cited or cited - valid:
        return None  # rejected: no citations, or cites a source that doesn't exist
    return text


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    done = json.loads(OUT.read_text()) if OUT.exists() else {}
    cards = [json.loads(p.read_text()) for p in sorted((ROOT / "public" / "data" / "drugs").glob("*.json"))]
    todo = [c for c in cards if c["id"] not in done][:limit]
    with ThreadPoolExecutor(4) as ex:
        for c, s in zip(todo, ex.map(summarize, todo)):
            if s:
                done[c["id"]] = s
            else:
                print("rejected", c["name"])
    OUT.write_text(json.dumps(done, indent=1))
    print("summaries", len(done))
