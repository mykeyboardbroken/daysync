# Overview

**Schedule App** is a personal **school day planner** — a single-user, browser-only
web app (React + Vite). No backend, no accounts; all data lives in `localStorage`.

## Who it's for

One student, on their own device. It should be fast to glance at ("what's today?")
and low-friction to update. Mobile-friendly, dark theme, single column.

## The two views

- **Today** — the day in order: what's urgent, the morning routine, the day's classes,
  the after-school routine. Reads top-to-bottom like the day unfolds.
- **Assignments** — a deadline-sorted checklist of all schoolwork.

## Design principles

1. **Glanceable first.** The thing you need to see now should need no clicks.
2. **Chronological.** On the Today tab, top-of-screen = earlier in the day.
3. **Low friction.** Adding a task or class is one short form, no page changes.
4. **No data loss.** Everything auto-saves on every change.
5. **Simple beats clever.** One data store, pure date helpers, plain CSS.

## Explicit non-goals (for now)

- Multi-device sync / accounts / a backend.
- Sharing or collaboration.
- Notifications / calendar integration.

If any of these change, they graduate to [`03-backlog.md`](03-backlog.md) with a note.
