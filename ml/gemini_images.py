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

# The banner behind the site name is deliberately photographic, unlike the three flat
# illustrations above — so it needs its own style string rather than STYLE.
PHOTO_STYLE = (
    "Photorealistic editorial photograph, shot on a 50mm lens at a wide aperture. "
    "Soft diffused natural light, gentle shadows, shallow depth of field. "
    "Warm off-white (#fbfaf7) surface and background, with muted terracotta, soft teal and "
    "pale amber as the only colours. Calm, premium, understated — a quality magazine's science "
    "pages, not a stock photo. Wide letterbox crop. The left third must be almost empty and "
    "very soft, so large text can sit over it. "
    "Absolutely no text, letters, numbers, logos, watermarks, packaging or brand marks. No people."
)

BANNERS = {
    "banner-pills": (
        "Assorted pharmaceutical capsules and round tablets loosely scattered across a warm "
        "off-white surface, seen from directly overhead. A few translucent terracotta and soft "
        "teal capsules catch the light. Most of the pills are gathered toward the right side; "
        "the left third is empty surface with a soft shadow falling across it.",
        (1800, 560),
    ),
    "banner-lab": (
        "Laboratory glassware on a warm off-white bench, seen slightly from the side: a few "
        "beakers and round flasks holding pale amber and soft teal liquid, one glass pipette "
        "resting alongside. Morning light from the right throws long soft shadows to the left. "
        "The glass is out of focus and clustered on the right; the left third is empty bench.",
        (1800, 560),
    ),
    "banner-macro": (
        "Extreme close-up macro of three translucent gelatin capsules resting on a warm off-white "
        "surface, one in muted terracotta, one in soft teal, one clear. Dramatic shallow focus — "
        "only the nearest capsule is sharp, the rest dissolve into soft colour. The capsules sit "
        "in the right half; the left half is clean blurred surface.",
        (1800, 560),
    ),
}

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


def make(name, prompt, size, style=STYLE):
    resp = client.models.generate_content(
        model=MODEL,
        contents=f"{style}\n\n{prompt}",
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
        if n in BANNERS:
            prompt, size = BANNERS[n]
            make(n, prompt, size, style=PHOTO_STYLE)
        else:
            prompt, size = IMAGES[n]
            make(n, prompt, size)
