# DaySync — handoff

A school + life planner for students. React 19 + Vite 7, deployed on Vercel as an
installable PWA. Built by Brian Kim (13, first year of college) for his own year group.

**Repo:** `mykeyboardbroken/daysync` → Vercel auto-deploys on push to `main`.
**Status:** feature-complete v1, pre-launch. No users yet.

---

## 1. What it is (and what it deliberately isn't)

DaySync is a **school planner**. Its one real moat is that it understands a *school day*:
the rotating 6-day cycle timetable, term breaks, public holidays, what to pack for
tomorrow's classes. Notion and Todoist can't do that.

Everything else (routines, focus timer, workouts) is supporting cast. **When in doubt,
invest in the school features and leave the rest alone.**

### Design rules we converged on the hard way

All of these were learned by getting them wrong first. Don't quietly undo them:

1. **No pressure, no assumptions.** The app never infers anything about a user from
   their gender or body. It doesn't ask for weight/height. Training is opt-in and
   invisible until switched on. (An earlier version inferred workout emphasis from
   gender and prescribed barbell lifts to 13-year-olds. Both removed.)
2. **Every optional feature is OFF by default** and hidden until enabled.
3. **Onboarding is short.** Four questions. A signup wall or a 20-question survey is how
   you lose half the people who tap your link.
4. **No AI, no server, no bills.** Everything — workouts, sport drills, timetable OCR —
   runs on-device. This is a feature, not a limitation: free forever, works offline, and
   every suggestion was chosen by a human who can be held to it.
5. **Delete features.** Goals, the daily challenge, and the equipment picker were each
   built and then cut. That was the right call every time.

---

## 2. Architecture

- **State:** one hook, `src/useSchedule.js`. Everything lives under a single
  `localStorage` key (`schedule-app.data`), so one save keeps it all consistent.
- **`normalize(parsed)`** runs every migration on load AND on backup import. It is the
  only place the data shape is fixed.
- **`freshData()`** is what a brand-new install gets (9 starter routines). It does NOT
  run `normalize()` — it pre-sets every `seeded*` flag so migrations skip it.
- **`load()`**: no data → `freshData()`; unreadable data → parks the corrupt blob under
  `schedule-app.data.corrupt` and starts fresh. Never overwrite a damaged original.

### Key files

| File | What |
|---|---|
| `useSchedule.js` | The store. All state, actions, migrations. ~1400 lines. |
| `schoolCalendar.js` | **Hardcoded to Brian's school** — cycle days, period times, term dates, holidays. |
| `timetableOcr.js` | Screenshot → timetable grid (tesseract.js, on-device). |
| `workouts.js` | Bodyweight workout rotation + per-sport skill drills. No AI. |
| `survey.js` | Onboarding questions. |
| `alerts.js` | Reminder due-time logic (DST-safe). |
| `gamify.js` | XP → level tiers. |
| `supabase.js` / `useAuth.js` | Optional cloud sync. Dormant unless env keys are set. |

---

## 3. Features

**Tabs:** Today · Academics · Calendar · Focus · Settings

- **Today** — reminder banners, greeting, level/XP chip, date + cycle day, weather, and
  the day plan split into **Morning / Afternoon / Night sub-tabs**. It auto-selects the
  part of the day you're actually in, and each tab carries a count of what's still left
  so nothing hides behind a tab. Tasks expand on tap; drag-reorder by the grip in edit
  mode (pointer events — HTML5 drag-and-drop does not work on touch).
- **Academics** — Classes (cycle-day timetable + auto packing list + screenshot import),
  Work (homework/assignments), Grades (PDF report import), Coming up. Shows a proper
  "No school" empty state on weekends/holidays.
- **Calendar** — month grid. Dots are **colour-coded**: 🔴 test · 🟣 assignment ·
  🟠 homework · ⚪ task. School and public holidays are shaded.
- **Focus** — Pomodoro; goes full-screen black while running. Distraction list.
- **Settings** — Appearance · Profile · Exercise · Backup · About.

**Training (opt-in):**
- **Sport training** — 12 sports (incl. netball, volleyball, dance, hockey). One sport a
  day, rotating. Rate each skill Weak / Okay / Strong on the task itself and the drills
  lean toward your weak areas. Sits in a time slot you choose.
- **Workout** — behind a single switch in Settings, **off by default**. Bodyweight only.
  Rotation: Push → Pull → Legs → **Rest** → Cardio → Core → **Rest**.

**Onboarding:** survey (name → gender → age → sports) → outro animation → **IntroTour**
→ app. The intro cards: 3 explaining the app, + a sport-drills card with an inline
on/off switch (only if they play a sport), + an *informational* backup card telling
them they can make an account in Settings (only if cloud is configured & they're not
signed in — no signup button, just points them there), + an **Add to Home Screen** card
on iOS. Every card after the survey is skippable.

The survey → intro handoff is seamless: the survey outro scales but stays **opaque**
(it must NOT fade to transparent, or the app flashes through underneath), and the intro
is opaque from its first frame (no fade-in). Don't re-introduce either fade.

---

## 4. Cloud sync / accounts — READ THIS

**Configured, but needs a Vercel redeploy to actually go live.**

- Supabase project: `https://uxguwihkskflpjlyqgcd.supabase.co`
- `user_data` table + RLS policies created (`supabase-setup.sql`). Verified working — an
  unauthenticated read returns `[]`, not other people's data.
- Keys are in `.env.local`, which is **gitignored — never commit it**.

**PENDING:** add these two in **Vercel → Settings → Environment Variables**, then
**redeploy**. Vite bakes env vars in at *build* time, so adding them without a rebuild
does nothing at all.

```
VITE_SUPABASE_URL=https://uxguwihkskflpjlyqgcd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Xl-xEgSbPRWZbZb94IWuyA_AYKog4so
```

**Sign-in is OPT-IN, never a wall.** The app opens straight into the day, local-only.
Signing in is a row in Settings → Backup. With no env vars the whole feature is
invisible — no dead UI promising something that can't happen.

**Sync rules — both original bugs are fixed; don't regress them:**
- Every local save is timestamped (`schedule-app.updatedAt`). On sign-in the **newer side
  wins**: cloud newer → adopt it; local newer → keep it and push up.
- A **failed pull never pushes.** Writing over a cloud copy you've never read is exactly
  how you lose data. It retries on the `online` event.
- The login-streak effect depends on `[synced]`, **not `[]`**. With `[]`, the cloud pull
  replaced the whole data object and silently discarded the streak bump — every launch,
  forever.

**Still to decide in Supabase:** Authentication → Email → "Confirm email" is probably
still ON. Recommend turning it OFF (it's friction, and school mail filters eat the
confirmation emails).

---

## 5. Known issues / gotchas

1. **The school calendar is hardcoded to one school** (`schoolCalendar.js`). Perfect for
   Brian's year group; unusable by anyone else. This is the single biggest blocker to
   the app working outside his school.
2. **Term dates run out after 2026, but this now degrades gracefully.** The calendar is a
   `SCHOOL_YEARS` list. Past the last configured year, `isSchoolDay()` falls back to
   "weekdays are school days" so the timetable keeps working, and Academics shows a
   banner ("2027 term dates needed") instead of silently reading "No school" forever.
   **TO ADD A YEAR:** copy the 2026 block in `schoolCalendar.js`, change the dates. A
   commented-out 2027 stub is already there. Do this when the school publishes 2027 dates.
3. **iOS deletes localStorage for sites not opened in ~7 days**, unless the app is
   installed to the Home Screen. That's why the Add-to-Home-Screen card exists in the
   intro. It is the main way a user silently loses everything.
4. **The timetable screenshot import has never been tested on a real timetable.** It reads
   "Day 1–6" row labels (an earlier version only read *dates*, so a cycle-day screenshot
   imported nothing). Recent fixes: OCR corrects a leading letter misread as its
   look-alike digit (**S29 was read as 529**; also 61→G1, 814→B14 — numeric-only rooms
   left alone), and Strings/music/orchestra/choir/band import with a **blank room**
   (travelling classes — see `roomlessSubject()` in `timetableOcr.js`). **Still test this
   end-to-end before launch. Everything the app is for depends on it.**
5. **Dead code:** `reminders.js`, `RemindersList.jsx`, `ReminderModal.jsx`,
   `GradesSummary.jsx` are unused, plus a number of unused CSS classes.

---

## 6. Pre-launch audit — fixes worth not regressing

A full audit was run (data layer + UI). Nine real bugs found and fixed:

- **Migrations were rewriting user-created tasks on every load.** A task you named "Pack
  your bag" got renamed, recategorised, and had its weekdays wiped. Title-based rewrites
  now run **once** (`seededLegacyTitleFix`) and never look at a title again.
- **A corrupt save wiped everything.** Now parked under a backup key, not overwritten.
- **Storage full crashed the app.** Now degrades to running in memory.
- **A malformed backup import** could hand the renderer a `null` array. Every collection
  is shape-forced in `normalize()` before any migration touches it.
- **XP bug:** "Add result" created an already-done event without awarding XP, so
  un-ticking it later *deducted* 20 XP that was never earned.
- **Reminders drifted an hour after DST.** Daily/weekly repeats now step by calendar
  days, not fixed milliseconds. NZ changes the clocks twice a year.
- **"Export backup" did nothing on iPhone** — the blob URL was revoked on the very next
  line, which cancels the download in Safari. Now uses the iOS share sheet.
- **Bright theme:** completed tasks were muddy grey slabs and the skill buttons were
  light-on-light. Both now use theme-aware tokens. In the installed app the iOS status
  bar glyphs are white, so bright mode lays a dark strip behind them.
- **iOS zoomed the entire page** whenever you tapped an input — any input under 16px
  triggers it, and it never zooms back out. Inputs are 16px on phones now.

---

## 7. CSS traps that already bit us (don't re-introduce)

- **`position: fixed` breaks inside a transformed ancestor.** The post-survey reveal
  animates a transform, so it wraps *content only* — the tab bar and FAB sit outside it.
- **A flex container with `align-items: stretch` can't scroll its overflowing child.**
  The survey/intro screens need `align-items: flex-start`, or tall content (the 12-option
  sports question) is physically unreachable.
- **A flex item won't shrink below its content without `min-width: 0`.** The week strip
  overflowed *every* iPhone because of this.
- `body { overflow-x: hidden }` is a safety net, not a fix.

---

## 8. Dev

```bash
npm run dev      # localhost:5173
npm run build    # NOT a typecheck. A green build once shipped a TDZ crash —
                 # it cannot catch runtime errors.
```

Git is not on PATH; use `"C:\Program Files\Git\cmd\git.exe"`.

**Testing approach:** there is no test framework. The pattern used throughout was to
write a throwaway script in `.smoke/`, bundle it with esbuild, and headlessly render
components with `react-dom/server` — this catches real crashes that `npm run build`
cannot. Stub `pdfjs-dist/.../pdf.worker.min.mjs?url` and define `import.meta.env`.
Always render with an **empty** store too; that's where crashes hide.

---

## 9. What to do next

**The only two things blocking launch — both need Brian, not code:**

1. **Add the Vercel env vars and redeploy** → sync goes live. In Vercel → Settings →
   Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (values in
   §4), then Deployments → Redeploy. Verify: Settings → Backup shows a "Sync & backup"
   row, and after creating an account the pill says **Synced**. Also flip off "Confirm
   email" in Supabase (§4).
2. **Test the timetable screenshot import on a real timetable.** Highest-value thing left.
   If setup is painful, nobody uses the school features — and then DaySync is just a
   to-do list with extra steps. The S29/Strings fixes just landed, so it's a good moment.

**Then:** tell people. Lead with **Add to Home Screen** — it's what protects their data.

**Later / growth:** school-agnostic timetables (the real unlock beyond one school), and
push notifications (needs the cloud, which now exists). Add 2027 term dates when the
school publishes them (§5.2).

There's a VC pitch deck at `DaySync-Pitch.pptx` (regenerate with `node make-deck.mjs`).
It's deliberately honest about having zero users — slide 6 has a "Not yet" column.
