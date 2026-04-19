---
name: launch-strategy
description: Plan mpaios launches (release, module, template pack) across the channels that actually convert for self-hosted tools.
---

# Launch strategy

Load `product-marketing-context` first.

## Channels that fit this product

- GitHub release notes (primary — this is where operators look).
- HackerNews Show HN (for milestone releases only).
- Reddit: r/selfhosted, r/homelab, r/whatsapp.
- IndieHackers post (with install command, not a screenshot).
- A short README banner on the repo itself.

## Channels to skip

- LinkedIn posts (wrong audience).
- Product Hunt (low fit for self-hosted infra).
- Paid ads pre-1k-installs.

## Launch checklist

- [ ] Release notes are diffable (bullet list, linked PRs).
- [ ] Install/upgrade command tested from a clean box.
- [ ] One concrete before/after (latency, line count, replies/hr).
- [ ] `docs/workflow.md` updated if runtime surface changed.
- [ ] Regression check: prior templates still compile.
- [ ] Rollback path documented.

## Anti-patterns

- Launching on Friday.
- Launching without a working demo command.
- Claiming parity with a hosted BSP. We are not that.
