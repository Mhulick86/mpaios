---
name: analytics-tracking
description: Instrument mpaios sessions and sequences without exfiltrating message bodies. Self-hosted-first telemetry.
---

# Analytics tracking

Load `product-marketing-context` first.

## What we track

- Inbound message count (by template match / no match).
- Outbound message count (by template id, sequence id, step).
- Takeover events.
- Sequence completions and exit points.
- Churn-risk transitions (`low` → `med` → `high`).

## What we never track

- Message bodies.
- Phone numbers in plaintext (hash with session salt).
- Anything that leaves the host by default.

## Naming

- `event`: snake_case, present tense. `message_sent`, `sequence_exited`.
- `properties`: flat, no PII, stable across versions.
- One event per meaningful state transition. No `click_button_v2_final`.

## Implementation note

Emit via the openclaw session hook. The default sink is stdout-JSON;
operators plug their own (PostHog self-hosted, Plausible, SQLite). No
vendor lock-in at the instrumentation layer.
