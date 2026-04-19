# .claude/skills

Author-time marketing skills for anyone editing mpaios with Claude
Code. Each skill is a markdown file that primes the agent with
mpaios-specific conventions, voice, and runtime hooks.

## Provenance

Variations inspired by
[coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
(MIT). See `../../NOTICE`. Content is rewritten for mpaios, not
copied — upstream focuses on web/email; we target conversational
WhatsApp flows.

## Load order

Every skill expects `product-marketing-context` to be loaded first. If
you change mpaios positioning, audience, or voice, change it there —
downstream skills inherit.

## Curated list

### Conversational runtime (maps to `src/marketing/`)
- `cold-whatsapp-outreach` → `templates/coldWhatsapp.ts`
- `whatsapp-sequence` → `templates/whatsappSequence.ts`
- `churn-prevention` → `templates/churnWinback.ts`
- `customer-research` (mines openclaw session store)

### Copy and voice
- `copywriting`
- `copy-editing`
- `marketing-psychology`

### Growth and measurement
- `launch-strategy`
- `referral-program`
- `analytics-tracking`
- `ab-test-setup`

### Foundation
- `product-marketing-context`

## Refresh upstream

```sh
./scripts/sync-skills.sh
```

Prints a diff of upstream skill titles vs. what we've curated. Does
not overwrite local files.
