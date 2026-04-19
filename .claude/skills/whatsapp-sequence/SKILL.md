---
name: whatsapp-sequence
description: Design multi-step WhatsApp drips. Variation of email-sequence for conversational cadence + mpaios session store.
---

# WhatsApp sequence design

An email sequence lives in an inbox; a WhatsApp sequence lives in a
*conversation*. If message 4 doesn't make sense given that the
recipient might have replied to message 2, the sequence is broken.

Load `product-marketing-context` first.

## Principles

- **One message, one job.** Never ask two things in one bubble.
- **Value before ask.** First two messages give; third may ask.
- **Cadence < 1/day.** WhatsApp fatigue is instant. Space accordingly.
- **Always honor takeover.** If a human replies via the same session,
  pause the sequence (`session.takeover = true`).

## Sequence types

| Type           | Messages | Span     | Trigger                          |
|----------------|----------|----------|----------------------------------|
| Welcome        | 4–5      | 10 days  | new opt-in                       |
| Activation     | 3–4      | 7 days   | installed, not used              |
| Win-back       | 2–3      | 14 days  | silent >30 days                  |
| Post-purchase  | 3        | 5 days   | order confirmed                  |
| Survey         | 1–2      | same day | support closed / session closed  |

## Authoring steps

1. Confirm the trigger is observable in the openclaw session store.
2. Draft each message as `{ id, delayFromPrev, template, vars }`.
3. Specify `pauseOnKeywords` (e.g. `stop`, `opt out`, `human`).
4. Specify `pauseOnReply` (default: true for all but Welcome #1).
5. Write the exit criteria — not just the schedule.

## Runtime hook

Compiles to `src/marketing/templates/whatsappSequence.ts`.
`advanceSequence(session, now)` returns the next message to send or
`null` if paused / complete.
