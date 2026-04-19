---
name: cold-whatsapp-outreach
description: Write cold WhatsApp messages that get a reply. Variation of cold-email tuned for mpaios conversational runtime.
---

# Cold WhatsApp outreach

WhatsApp is not email. The recipient sees your first line on a lock
screen, next to messages from their mother. Act accordingly.

**Always load `product-marketing-context` first.** Voice, personas, and
objections come from there.

## Before you draft

Gather:
- Recipient role + company
- Desired outcome (reply, demo, install)
- One specific, non-obvious value for *them*
- A trigger (hiring post, release, public incident)
- Proof that takes <6 words

If any field is empty, stop and ask — do not fill with filler.

## Structure

Cold WhatsApp is a two-beat message:

1. **Opener** — 1 sentence, names a specific thing about them. If the
   opener still makes sense against anyone else, rewrite it.
2. **Ask** — 1 sentence, low friction. "Worth a 2-line reply?" beats
   "open to a 30-min call?"

Total: ≤220 characters in the first bubble. Second bubble (optional,
sent 3s later) carries proof or a link.

## Forbidden

- "Hope this finds you well."
- Any word longer than 12 letters unless it's a product name.
- Feature dumps.
- Emojis used as decoration. One relevant emoji is fine; three is spam.

## Follow-ups

Max 2. Each adds a new angle:

- Follow-up 1 (day 3): different proof point, not a nudge.
- Follow-up 2 (day 7): teardown or artifact they can keep whether or
  not they reply.

After that, stop. Log to session store and let the operator pick up.

## Runtime hook

This skill maps to `src/marketing/templates/coldWhatsapp.ts`. The
template exposes `{opener}`, `{ask}`, `{proof}` vars that openclaw's
`applyTemplate` fills per recipient.
