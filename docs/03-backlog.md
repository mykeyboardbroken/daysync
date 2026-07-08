# Backlog

**This is the file you edit most.** Add what you want under any heading — a rough
bullet is fine. Mark priority however you like, or just tell me which to build next.

Status: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` needs your decision

## Top priority (recommended order, agreed 2026-07-02)

- [ ] **Deploy + PWA** — get it off localhost onto a real URL (Vercel/Netlify) and add a
      manifest + service worker so it installs to the phone home screen and works offline.
      This is what makes it usable at school. **Do first.**
- [ ] **Export / import data** — download all data as `.json` and re-import it. No seed
      exists anymore, so this is the only backup / device-move path. Low effort.

## Next up (small, well-understood)

- [ ] **Edit existing items** — assignments / dates / reminders / notes are add + delete
      only. Reuse each modal with an `initial` prop (like `ClassModal` does).
- [ ] **Reminders with a deadline show in "Coming up"** (within 48h), alongside assignments.

## Ideas (discussed, not scoped yet)

- [ ] **Screenshot → timetable** — upload a photo of the timetable and auto-fill it.
      Best via Claude vision + a small serverless endpoint (API key can't live in the
      browser); Tesseract.js is backend-free but rougher. Needs a review-before-save step.
- [ ] Notifications ("assignment due tomorrow") — depends on the PWA groundwork.
- [ ] Week overview (all 7 days' / cycle days' classes at a glance)
- [ ] Notes per class
- [ ] Configurable weather location (currently hard-coded to Auckland in `useWeather.js`)
- [ ] Sunday-start weeks (currently Monday-start)

## Infra

- [ ] `git init` to start tracking history

## Done this session

- [x] Cycle-day timetable (Day 1–6), fixed periods, shared Tutor room, no default seed
- [x] "+" Add menu: Assignment / Date / Reminder / Note / To bring / Class
- [x] Coming up (48h), Reminders (optional deadline), Notes, Important dates
- [x] Pack list (books grouped, To-bring extras, subject tags), weather + roll-forward
- [x] Assignments tab: filter bar + styled cards (subject badges, relative due)

---

## How to add an item

Just write it as a bullet under a heading above. If you want it built a specific way,
add sub-bullets. If it's fuzzy, leave it — I'll ask before building. When you're ready,
tell me e.g. "build the edit-assignment item".
