# Phase Zero — plan + page wording (DRAFT v2, simpler)

Nothing is built yet. Once you say "approved", this wording is locked.

**Wording rules for this site**
- Write for a smart person from any industry. No pharma jargon.
- If a science word is needed, explain it in the same line.
- I (the builder) am an AI product manager, not a drug expert. The site never claims otherwise.
- The point of the site is the AI product thinking, not the chemistry.

---

## 1. The plan in one table

| Step | What happens | Done by | AI / PM idea |
|---|---|---|---|
| 1 | Look up the drug's chemical structure | Code | Collecting data |
| 2 | Turn the structure into numbers | Code | Preparing data for ML |
| 3 | Score liver and heart risk | ML model (trained by me) | Learning from past examples |
| 4 | Find similar drugs that failed, and official warnings | Code | Using real facts with sources |
| 5 | Write a short summary from those facts only | Gemini | AI writing that can't make things up |
| 6 | Make all 500 results ahead of time | Code | Keeping cost near zero |

**Two tests (Results page):**
1. Would the model have flagged drugs that were later pulled from the market?
2. My small trained model vs. just asking Gemini — which is more accurate and cheaper?

Gemini budget: under ₹100 expected, ₹300 cap. No real patient data. Local only tonight.

---

## 2. Tagline options (pick one)

| # | Tagline | Feel |
|---|---|---|
| A | **A trial before the trial.** | Short, memorable (your pick) |
| B | A trial before the trial. Spot warning signs before the big money is spent. | A + one plain line of why |
| C | Why might this drug fail? Ask before the $1B is spent. | Earlier draft |
| D | Check the warning signs before the trial starts. | Very plain |

**Chosen:** "A trial before the trial." + "Spot warning signs before the big money, $1B, is spent."

---

## 3. Page 1 — Check a drug

**Title:** Phase Zero
**Headline:** A trial before the trial.
**Sub-line:** Spot warning signs before the big money, $1B, is spent.

**What this is (2 lines):**
New medicines often fail late, after years and huge cost. Two common reasons are harm to the liver and harm to the heart. Type a known drug to see its warning signs.

**Search box placeholder:** Try "paracetamol" or "terfenadine"
**Button:** Check
**Under the box:** Works for about 500 well-known drugs. A learning project, not medical advice.

**Result card**
- **Liver warning:** High / Medium / Low
  - small line: "Model score 72 out of 100. Higher means more like drugs that harmed the liver."
- **Heart warning:** High / Medium / Low
  - small line: "Checks one known cause of irregular heartbeat (called hERG)."
- **Similar drugs that ran into trouble:** name · what went wrong · source link
- **Official warnings (US FDA):** short warning · source link
- **In plain words:** 3–4 sentence summary
  - small label: "Written by AI using only the facts above."

**Footer:** A learning project by an AI product manager. Not medical advice. Scores can be wrong.

**Not found:** "We don't have that drug yet. Try another one."

---

## 4. Page 2 — How it works

**Title:** How it works
**Intro:** Three different tools, each doing the job it's best at.

**Diagram:**
Drug name → **Code** (finds facts) → **ML model** (scores risk) → **Gemini** (writes summary) → Result card

**Three blocks:**
- **Code — the fact finder.** Pulls facts from free public databases. Same question, same answer, every time.
- **ML model — the pattern spotter.** I trained a small model on thousands of chemicals that were already tested. It learned what risky ones tend to look like. It gives a score, not a verdict.
- **Gemini — the writer.** Turns the facts into plain English. It is only given the facts, and must link each one to its source.

**Why not an AI agent?**
An agent decides its own steps. Here the steps never change, so a fixed set of steps is cheaper, faster, and easier to test.

**Why make results ahead of time?**
All 500 results are made once. Visitors cost nothing, and they always see the same answer.

---

## 5. Page 3 — Results & decisions

**Title:** Results & decisions

**Test 1: Would it have caught past problems?**
I took [N] drugs that were pulled from the market for liver or heart harm. I kept them hidden while training, then asked the model to score them.
- Caught: [X] of [N]
- Missed: [Y] — listed below, with my best guess why

**Test 2: Train a small model, or just ask an AI chatbot?**
Both got the same [N] chemicals they had never seen.

| | My trained model | Asking Gemini directly |
|---|---|---|
| Accuracy (out of 100) | [ ] | [ ] |
| Cost for 1,000 checks | [ ] | [ ] |
| Same answer every time? | Yes | [ ] |

**What I learned:** [written after the real results, whichever way they go]

**Decisions I made**
- Fixed steps, not an agent — the job is the same every time.
- A small trained model for scoring — [reason from Test 2].
- Gemini only for writing — good with words, not trusted to invent facts.
- Results made ahead of time — no server, near-zero cost.

**Limits (honest)**
- Small public data. Scores are signals, not answers.
- Only ~500 known drugs.
- Only liver and heart. Drugs also fail for many other reasons.
- Few drugs are ever pulled from the market, so Test 1 is small.
- I am not a drug expert. This shows how I build and test AI products.

**Not medical advice.**

**Later**
- More types of risk.
- Let people check a brand-new chemical.
- Try more models.
