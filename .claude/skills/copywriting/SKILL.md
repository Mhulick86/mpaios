---
name: copywriting
description: Write marketing copy for mpaios in its documented voice. Covers landing sections, READMEs, and message templates.
---

# Copywriting

Load `product-marketing-context` first; §10 is the voice spec.

## House rules

- Short sentences. A long sentence is an edit away from two short ones.
- Concrete over abstract. "Runs on a Pi" beats "lightweight footprint".
- Numbers over adjectives. "One dependency" beats "minimal dependencies".
- Terminal-native tone. Assume the reader has a shell open.
- No em-dashes in marketing copy.
- Banned words: revolutionize, unlock, synergy, leverage, seamlessly,
  effortless, cutting-edge, best-in-class, game-changer.

## Section patterns that work for this product

- **Hero**: one-line product statement + one-line proof.
- **How it works**: 3 steps, each ≤10 words, each verifiable in code.
- **When to use this vs a hosted BSP**: honest 2-column compare.
- **Install**: copy-pasteable command before any prose.

## Checks before shipping

- Read aloud. If you stumble, rewrite.
- Delete every adverb, then put back only the ones that change meaning.
- Swap every "we" for the concrete actor when possible.
