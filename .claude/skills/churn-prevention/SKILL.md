---
name: churn-prevention
description: Detect and act on churn signals surfaced by openclaw sessions. Designed for conversational win-back via WhatsApp.
---

# Churn prevention

Load `product-marketing-context` first.

## Signals openclaw can see

- Session silence > N days (configurable per cohort).
- Inbound message with negative keywords (`cancel`, `stop`, `too
  expensive`, `doesn't work`).
- Sequence exit before the value message.
- Support escalation that never closed.

## Intervention ladder

Escalate only when the previous step got no reply.

1. **Acknowledge** — "Noticed you haven't been around. Anything I can
   fix in 2 minutes?"
2. **Offer** — specific, bounded (not a generic discount).
3. **Exit ramp** — "If this isn't for you, reply STOP and I'll stop."
   Honor it in the session store.

## What not to do

- No guilt ("we miss you!").
- No streak-breaker gimmicks.
- No reactivation bonus that costs more than the LTV it rescues.

## Runtime hook

`src/marketing/templates/churnWinback.ts` exposes
`evaluateChurnRisk(session)` → `{ risk: 'low'|'med'|'high', reason }`
and `nextWinbackMessage(session)`.
