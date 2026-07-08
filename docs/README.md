# Design docs

This folder is the **source of truth for what we build**. The workflow:

1. **You edit** these docs — describe what you want, tweak specs, check/uncheck items.
2. **I (Claude) build** from them — I read the relevant doc, implement it, and update
   the doc's status so we both know where things stand.

You don't have to write formal specs. A rough bullet list under a heading is enough —
I'll ask before filling in anything ambiguous.

## The files

| File | What it's for |
|---|---|
| [`00-overview.md`](00-overview.md) | What the app is and who it's for. The "why". |
| [`01-data-model.md`](01-data-model.md) | The data shape everything persists to. Change carefully. |
| [`02-features.md`](02-features.md) | What's built today, with status. |
| [`03-backlog.md`](03-backlog.md) | **What you want next.** This is the one you'll edit most. |
| [`TEMPLATE.md`](TEMPLATE.md) | Copy this when a feature needs a real spec. |

## How to ask for something

- **Small tweak?** Add a bullet under the right heading in [`03-backlog.md`](03-backlog.md)
  and tell me "build the backlog" (or point at the item).
- **Bigger feature?** Copy [`TEMPLATE.md`](TEMPLATE.md) to `docs/features/<name>.md`,
  fill in what you can, and I'll flesh out the rest before writing code.

## Status legend (used across the docs)

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — done and in the app
- `[!]` — needs a decision from you before I can build it
