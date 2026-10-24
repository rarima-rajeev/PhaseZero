"""Shared Gemini setup. Key comes from ../.env.local (GEMINI_API_KEY). Token usage is logged so we can track spend."""
import json, os, pathlib, threading
from dotenv import load_dotenv
from google import genai

ROOT = pathlib.Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")
MODEL = "gemini-3.8-flash"
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
USAGE = pathlib.Path(__file__).parent / "cache" / "gemini_usage.jsonl"
_lock = threading.Lock()


def log_usage(task, resp):
    u = resp.usage_metadata
    row = {"task": task, "in": u.prompt_token_count or 0,
           "out": (u.candidates_token_count or 0) + (u.thoughts_token_count or 0)}
    with _lock, USAGE.open("a") as f:
        f.write(json.dumps(row) + "\n")
