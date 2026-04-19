---
name: marketing-psychology
description: Apply behavioral principles honestly in mpaios conversational flows. No dark patterns.
---

# Marketing psychology (honest version)

Load `product-marketing-context` first.

## Principles we use

- **Specificity beats salience.** A precise number ("47 sessions/hr") is
  more persuasive and more honest than a superlative ("blazing fast").
- **Default bias.** Ship sensible defaults in the template config;
  don't hide them behind flags.
- **Loss framing** is fine when the loss is real ("you'll keep paying
  per message"). Not when it's fabricated.
- **Social proof** requires a source. "Used by X teams" without a list
  is noise.

## Dark patterns we refuse

- Fake scarcity, fake urgency, fake countdown timers.
- Opt-out buried in settings. `STOP` must work from any message.
- Guilt-tripping win-back.
- "Confirmshaming" CTAs ("No thanks, I hate saving money").

## How to audit a flow for dark patterns

For each step, ask:
1. Would the user choose this if they fully understood what happens next?
2. Is the exit path as visible as the conversion path?
3. If the claim were removed, would the flow still work?

If any answer is "no", rewrite the step.
