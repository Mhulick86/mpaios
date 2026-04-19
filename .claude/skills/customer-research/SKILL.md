---
name: customer-research
description: Extract signal from WhatsApp transcripts, support threads, and public sources. Variation tuned for mpaios session-store data.
---

# Customer research (mpaios edition)

Load `product-marketing-context` first.

## Two modes

**Mode 1 — mine existing sessions.** The openclaw session store already
contains every inbound message, outbound reply, and agent handoff.
Start there before scraping the internet.

**Mode 2 — external.** Reddit (r/whatsapp, r/smallbusiness), GitHub
issues on Baileys, IndieHackers, X. Capture exact phrasing, not
paraphrase.

## What to pull from sessions

- First-message intents (group by keyword cluster, not by template hit).
- Unmatched messages (no template fired) — these are the gaps.
- Takeover points — where a human had to step in. Each one is a
  product or copy defect.
- Drop-off in a sequence — which message ended the thread.

## Deliverables

Pick one per run. Do not try to produce all four:

- **Synthesis report** — themes + frequency + confidence (H/M/L).
- **Persona refresh** — patch `product-marketing-context` §3.
- **Quote bank** — verbatim lines, attributed by session id, for copy.
- **Defect list** — ordered by frequency × business impact.

## Rules

- Label every insight with confidence. Single-session signal is L.
- Flag sample bias (e.g. "90% of sessions are activation-stage users").
- Never invent a customer quote.
