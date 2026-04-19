---
name: copy-editing
description: Edit drafted copy against mpaios voice rules. Produces a redlined diff, not a rewrite.
---

# Copy editing

Load `product-marketing-context` first.

## Workflow

1. Read the full draft once without editing.
2. Pass 1 — structural: does each section earn its place? Cut, don't
   reorder, unless ordering is the problem.
3. Pass 2 — sentence-level: apply the house rules from `copywriting`.
4. Pass 3 — voice: flag anything that sounds like a vendor deck.

## Output format

Return a diff, not a new draft. For each change, include:

- Original line
- Edited line
- One-phrase reason (`banned word`, `long sentence`, `abstract`, `adverb`)

## Never

- Silently change meaning.
- Add a new claim the author didn't make.
- "Improve" a quote from a customer.
