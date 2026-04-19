---
name: ab-test-setup
description: Run A/B tests on templates and sequences inside mpaios without a feature-flag vendor.
---

# A/B test setup

Load `product-marketing-context` first.

## What is testable here

- Template copy variants (`template.v1`, `template.v2`).
- Sequence timing (`delayFromPrev`).
- Sequence structure (3 messages vs 4).
- Opener vs. no-opener for cold outreach.

## What is not worth testing

- Emoji vs no-emoji (dominated by recipient-segment variance).
- Tiny wording tweaks on low-volume templates. If n<300, don't bother.
- Anything where both arms would pass the `copywriting` voice check —
  the win will be noise.

## Setup

1. Hash `session.id` to bucket (stable, no cookie).
2. Record `variant` in every analytics event.
3. Pre-commit the stopping rule (sample size OR date, whichever first).
4. Pre-commit the primary metric. One.

## Reading results

- Report effect size + confidence interval, not p-value alone.
- If CI crosses 0, call it inconclusive. Ship the simpler arm.
- Kill, don't extend, tests that miss the date cutoff.
