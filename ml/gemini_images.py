"""Make the site's illustrations with Gemini's image model, then compress them to webp.

House style: calm editorial illustration, warm stone-grey palette to match the site, no text,
no logos, no real people.
"""
import pathlib, sys
from io import BytesIO
from google.genai import types
from PIL import Image
from gemini_common import client, log_usage

OUT = pathlib.Path(__file__).parent.parent / "public" / "img"
OUT.mkdir(parents=True, exist_ok=True)
MODEL = "gemini-3.1-flash-image"

STYLE = (
    "Clean modern editorial illustration, flat vector style with soft paper grain. "
    "Warm stone-grey and off-white palette (#fbfaf7 background, #1c1b19 ink) with a single muted "
    "terracotta accent. Generous empty space. Calm, scientific, understated — like a quality "
    "newspaper's science section. Absolutely no text, letters, numbers, logos, watermarks, "
    "signatures or brand marks anywhere. No people's faces. Not a photograph."
)

IMAGES = {
    "hero": (
        "A wide, airy composition of abstract molecular structures — thin connected lines and small "
        "circular nodes — drifting across open space, with a few faint laboratory glass shapes in "
        "the far background. Very light and spacious, mostly empty on the left side so text can sit "
        "over it comfortably. Low contrast, quiet.",
        (1536, 640),
    ),
    "pipeline": (
        "Three simple abstract shapes in a row, connected left to right by a thin line: a grid of "
        "small squares, a cluster of connected dots forming a branching tree, and an open page with "
        "blank ruled lines. Evenly spaced, diagram-like, restrained.",
        (1200, 500),
    ),
    "lab": (
        "A quiet overhead view of a research desk: a few pieces of laboratory glassware, a notebook "
        "with blank pages, and a scattering of small abstract molecule diagrams. Soft shadows, "
        "muted palette, nothing cluttered.",
        (1200, 500),
    ),
}


def make(name, prompt, size):
    resp = client.models.generate_content(
        model=MODEL,
        contents=f"{STYLE}\n\n{prompt}",
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )
    log_usage("image", resp)
    for part in resp.candidates[0].content.parts:
        if part.inline_data:
            img = Image.open(BytesIO(part.inline_data.data)).convert("RGB")
            img.thumbnail((size[0], size[0]), Image.LANCZOS)
            path = OUT / f"{name}.webp"
            img.save(path, "webp", quality=72, method=6)
            print(name, img.size, f"{path.stat().st_size // 1024} KB")
            return
    print(name, "no image returned")


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(IMAGES)
    for n in wanted:
        prompt, size = IMAGES[n]
        make(n, prompt, size)
