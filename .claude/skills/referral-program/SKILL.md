---
name: referral-program
description: Design a referral loop inside a conversational product without paid rewards or scraped contacts.
---

# Referral program

Load `product-marketing-context` first.

## Why most referral programs fail for this product

- Self-hosted operators do not want monetary rewards tied to KYC.
- WhatsApp has strict rules on unsolicited invites. Do not send one.
- The referrer has to *want* to send the invite unprompted.

## What works for mpaios

- **Artifact referral** — an exportable template pack signed with the
  operator's handle. If shared, the new installer sees "shared by X".
- **Config-as-gift** — ready-to-run config for a specific use case
  (support triage, survey). Nothing to scrape.
- **Credit, not cash** — free access to premium template packs once
  the repo is in active use.

## Instrumentation

- `referrer` field in config, carried through install.
- Count attributable installs, not clicks.
- Show the referrer *their* number, privately, in a monthly digest
  message.

## Anti-patterns

- Asking mid-session for a referral.
- Double-sided cash rewards.
- Importing a contact list to "invite your team".
