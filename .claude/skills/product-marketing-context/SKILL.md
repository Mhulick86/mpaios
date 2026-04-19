---
name: product-marketing-context
description: Foundational mpaios product, audience, and positioning context. All other marketing skills reference this file first.
---

# mpaios product marketing context

All marketing skills in this repo resolve against this document before
generating copy, sequences, or campaigns. Update it when product
positioning, audience, or tone changes — then every downstream skill
inherits the change.

## 1. Product

- **What it is**: `mpaios` is a programmatic consumer of
  [`openclaw`](https://www.npmjs.com/package/openclaw) — a WhatsApp
  gateway CLI built on Baileys with an optional Pi RPC agent channel.
- **What it does**: accept inbound WhatsApp messages, match them against
  templates or exec hooks, optionally forward to an agent, reply, and
  persist the session.
- **Form factor**: self-hosted Node ≥22 service. No SaaS, no hosted
  control plane. Runs where the operator runs it.
- **Primary interface**: text-first conversation on WhatsApp. Not email,
  not a landing page — treat every "send" as a message a human will open
  on their phone.

## 2. Target audience

- Technical founders and growth engineers who already self-host.
- Small operations teams automating customer conversations — support
  triage, post-sale onboarding, win-back, survey capture.
- Agencies building white-labelled WhatsApp flows for SMB clients.

## 3. Personas

- **Solo operator** — one person, wants cold outreach + reply handling
  on the same number, hates paying per seat.
- **Ops engineer** — has a Pi or small VPS, wants WhatsApp wired into
  internal tooling via RPC.
- **Agency builder** — deploys the same flow across many client
  numbers, needs templated campaigns and per-session state.

## 4. Pain points (verbatim customer language > polish)

- "I don't want to pay $200/seat for Twilio just to send 50 messages."
- "Every WhatsApp BSP wants a business verification I can't get yet."
- "I need the bot to stop replying once a human picks up the thread."
- "Our drip sequence should live in git, not in a vendor dashboard."

## 5. Competitive landscape

- Hosted BSPs (Twilio, MessageBird, 360dialog): easier, but per-message
  pricing and vendor lock-in.
- DIY Baileys scripts: flexible, but no template engine, no session
  store, no agent channel out of the box.
- **mpaios sits between these** — owns the runtime, gives you
  templates + session + optional RPC, no per-message fee.

## 6. Differentiation

- Config-as-code: replies, sequences, and exec hooks live in the repo.
- Pluggable agent channel via `monitorWebChannel` — LLM replies without
  a middleman.
- Runs on a Pi. Tiny footprint.

## 7. Common objections

- "Is unofficial WhatsApp safe?" → call out Baileys limitations and the
  ban-risk tradeoff explicitly; do not pretend it's the official API.
- "What about media, groups, buttons?" → scope to what openclaw
  actually supports today; don't oversell.
- "How do I migrate off later?" → templates are portable markdown +
  JSON; exporting to another BSP is a config remap, not a rewrite.

## 8. Switching dynamics

- Most prospects already tried a hosted BSP and got stuck on verification,
  pricing, or lock-in.
- Trigger moment: "I just want to send a WhatsApp from a cron job."

## 9. Customer language to reuse

"drip", "cadence", "handoff", "takeover", "win-back", "opt-out",
"keyword trigger", "business hours", "template", "session". Prefer these
over corporate synonyms ("nurture campaign", "lifecycle marketing").

## 10. Brand voice

- Peer-to-peer, terminal-native, understated.
- No em-dashes in marketing copy (reserve for docs).
- No "revolutionize", "unlock", "synergy", "leverage", "seamlessly".
- Short sentences. Concrete verbs. Numbers over adjectives.

## 11. Proof points

- Runs on Node ≥22 with one dependency (`openclaw`).
- Session store + reply templates + Pi RPC agent ship in the default
  boot path (`runLegacyCliEntry`).
- MIT-licensed, single-file consumer example in `src/index.ts`.

## 12. Goals for marketing work in this repo

- Drive self-hosted installs, not trial signups.
- Grow the operator persona first; agency persona second.
- Every asset (cold outreach, sequence, survey) must be runnable
  through openclaw without a rewrite.
