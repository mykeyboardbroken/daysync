# DaySync — Handoff

A personal **school + life planner** for a college student. React + Vite, runs
entirely in the browser, **all data in `localStorage`** (key `schedule-app.data`).
**No backend, no accounts, no network** except a free weather API (Open-Meteo).

---

## Run / build

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

- Node/npm on this machine need a PATH refresh in a fresh shell:
  `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`
- **Git is installed** (2.55, via winget) at `C:\Program Files\Git\cmd\git.exe`
  (not on PATH in fresh shells — call it by full path). Repo is committed locally;
  **there is NO remote** (see "Backing up" below).

---

## The tabs (bottom nav)

**Today · Academics · Calendar · Focus · Settings**

### Today
- **Greeting banner** — one line: "Good morning/afternoon/night, {name}" by hour
  (5–12 / 12–17 / 21–5); the in-between evening shows a rotating cheer-up quote.
  (`greeting.js`)
- **Weather** — boxless one-liner. After **8pm** shows tomorrow's. Location hardcoded
  Auckland (`useWeather.js`).
- **Level/XP card** — tap to open a details modal (progress ring, streak, tier ladder).
- **Training weather heads-up** — amber card if a training today (co-curricular task or
  training-like title) overlaps the day's likely-rain window; looks ahead to tomorrow
  after 8pm. (`trainingAlert.js`)
- **Today's plan** — un-boxed sections Morning / Afternoon / Night (+ Anytime on top when
  used). Tasks + generated workouts drop into their buckets.
  - Tap a task → expands to show **steps + Edit**. Checkbox = done; done rows go darker.
    Category icon per row. Description clamps to one line (expands when open); fallback
    "Routine for {category}".
  - **Edit button** (top-right of the plan): grip handle to **drag-reorder** (HTML5 drag —
    desktop mouse solid, touch unreliable), a remove ✕, and a "+ Add a default task"
    picker (re-add built-in defaults; added ones show a check).
- **Notes** (when any).

### Academics (`SchoolTab.jsx`)
- **Coming up** at top (assignments due ≤48h + upcoming tests/dates; homework counts as
  an assignment). Sub-tabs: **Classes · Work · Grades**.
  - **Classes** — WeekStrip day browser + Pack-for list + timetable (6-day cycle, rolls
    forward after last bell). Timetable OCR import is fragile, tuned to Rangitoto.
  - **Work** — filters All / **Homework** / Assignments / Tests / Done. Homework = an
    assignment with `kind: 'homework'`.
  - **Grades** — report cards from a PDF (`pdfImport.js`, fragile) + hand-added results.

### Calendar (`CalendarTab.jsx`)
- Month grid, dots per dated item. **Weekends** tinted + accent numbers. **School
  holidays** (term breaks / summer) green tint; **NZ/Auckland public holidays (2026)** a
  red dot + red cell that overrides the break tint. Tap a day → detail + add Date/Task.

### Focus (`FocusTab.jsx`)
- Pomodoro timer. Presets **30 min / 1 hr / 2 hr** (default 30) + custom slider up to
  **3 hours**. Start → **full-screen black + time only**; tap reveals an auto-hiding ✕
  (top-left) to pause/exit.
- **"Stay away from" list** (accountability, editable). **Leave detection** (Page
  Visibility) counts tab-switches mid-session. Finishing awards **1 XP/min** and logs
  total focused minutes.
- **Cannot block apps** — a web app has no such power. Real blocking = OS Screen Time
  (iOS Family Controls), which is **native-app-only + needs Apple's entitlement**.

### Settings (full tab, `SettingsModal.jsx`)
Borderless divider list with accent icon tiles. Panels:
- **Appearance** — Dark/Bright base + accent (12 swatches + hue slider). Only a "custom"
  theme now (presets removed; old presets migrate to custom).
- **Tasks** — Show streaks toggle (off by default).
- **Profile** — editable Name, Age, Weight units (kg default), Workout location
  (Gym/Home), Home equipment, Sports, Sport-training time, Workout time.
- **Backup** — Export/Import all data as JSON.

---

## Onboarding survey (`survey.js`, `SurveyModal.jsx`)
Full-screen, animated, first-open (shows while `!onboarded`). Asks: name, age, sports
(multi), gym access, home equipment (if no gym), sport-training time, workout time.
Supports `showIf` conditional questions. Answers → `profile`.

## Workout generator (`workouts.js`, free/offline)
Two sessions, each in its own chosen bucket ("I don't" hides one):
- **Sport training** — ONE sport per day (rotates). Real drills grouped by skill aspect;
  expanded panel rates each aspect **Weak / Okay / Strong** (`profile.sportSkills`),
  drills weight toward weak (full pass first, then extra weak). Heading "Recommended
  drills", no reshuffle.
- **Workout** — general strength rotating **Push → Pull → Legs by day** + core, using only
  available equipment (or full gym). Has a "New workout" reshuffle.
- **Age scaling** (`intensityForAge`): 16–34 (college) = full; 35–49 slightly shorter;
  <16 / 50+ shorter & easier.
- A morning workout hides the standalone "Stretch / Move" (its warm-up covers it).

## Gamification (`gamify.js`)
- **XP** on completion (task 10 / assignment 15 / event 20 / workout 25 / focus 1-per-min).
  Symmetric — un-checking removes XP.
- **Levels** — 12 named tiers + icons (Sprout → Mythic); cost rises each level
  (gap L→L+1 = 50·L XP). `levelInfo(xp)`.
- **Login streak** — +1 per day opened, resets on a gap.

## Default tasks (seeded once, deletable, re-addable via `taskTemplates.js`)
Morning: **Journaling** (first, steps), **Stretch / Move** (second). Afternoon:
**Hydration check**, **Reading**, **Clean your room** (Sun), **Organise your wardrobe**
(Sat). Night: **Night grooming**, **Get ready for tomorrow** (pinned last), **Check
tomorrow's plans**. Ordering uses a task `order` field (set by dragging) with
`pinFirst`/`pinLast` fallbacks.

---

## Data model — `useSchedule.js`
One `localStorage` object. `normalize()` fills defaults + runs all migrations on load AND
on backup import. Key slices: `assignments` (with `kind`), `events`, `notes`, `bring`,
`timetable`, `reports`, `extras`, `tasks` (unified one-off/repeating:
`{title, description, steps[], bucket, category, repeat, days[], log{}, due, done, order, pinFirst/pinLast}`),
`theme`/`customColors`, `settings`, `profile` (survey + sportSkills), `xp`,
`loginStreak`/`lastActive`, `workoutLog`/`workoutSeed`, `focusDistractions`/`focusMinutes`,
plus one-time `seeded*` flags. Tasks are the single model (habits were folded in as
repeating tasks).

## Reliability
- **ErrorBoundary** wraps the app (`main.jsx`) → recoverable screen, not a white page.
- App identity: **DaySync** (`index.html`, `public/icon.svg`, `public/manifest.webmanifest`)
  — install-ready except for PNG icons (see below).

---

## Known limits / roadmap (rough priority)
1. **Not deployed** — localhost only. Next: deploy (Vercel/Netlify) + PWA. Needs **PNG app
   icons** (192/512/180) in `public/` for real install prompts (only an SVG now).
2. **Accounts / sharing** — deferred. Needs a backend (Supabase recommended: auth + DB +
   persistent sessions, free tier). Turns app from local→cloud.
3. **App blocking** — impossible from web; would need a separate **native iOS app** (Swift
   + Family Controls entitlement).
4. **2026 is hardcoded** — school term dates + NZ public holidays (`schoolCalendar.js`) and
   **Auckland** weather (`useWeather.js`). Update yearly / per user.
5. **Fragile importers** — PDF report + timetable OCR tuned to specific formats.
6. **Drag-reorder** unreliable on touch; add pointer-based dragging or arrows for phones.
7. No tests; no reminders/notifications (needs PWA).

## Dead files to clean up (if still present)
`ReminderModal.jsx`, `RemindersList.jsx`, `reminders.js`, `GradesSummary.jsx`,
`LifeTab.jsx` — unused, safe to delete.
