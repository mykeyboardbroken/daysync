# Features (current state)

Status: `[x]` done · `[~]` in progress · `[ ]` not started · `[!]` needs your decision

## Shell & navigation
- [x] Two-tab layout (Today / Assignments)
- [x] Floating **+** button (SVG-centered) — opens an **Add menu**: Assignment / Date /
      Reminder / Note / Class
- [x] Week strip: 7 day circles, prev/next-week arrows, "Today" shortcut

## Today tab
- [x] **Header** — full date (no year) + a **6-day cycle** tracker badge ("Day 5" /
      "No school"). Cycle advances only on school days; weekends & holidays are skipped.
      Rules live in [`src/schoolCalendar.js`](../src/schoolCalendar.js) — edit `HOLIDAYS`
      / the anchor there. Includes "Today" pill / jump-to-today button.
- [x] **Coming up** box — anything in the next 48h: assignments due soon (check inline)
      **and** dated events/tests happening today or tomorrow. Calm framing (not "Urgent").
- [x] **Reminders** — things to do, pinned until you check them off
- [x] **Notes** — quick jots so you don't forget; delete when done with them
- [x] **Important dates** — tests/dates further out (beyond 48h), with a countdown
- [x] **Things I need today** — a packing list that rolls up every class's "things
      needed" for the day, split on commas, de-duplicated, showing which classes need each
- [x] **Timetable** for the day's **cycle day** — the fixed period slots (Tutor, 1st,
      2nd, 3A, 3B, 4th, 5th) with their times; tap a slot to set its **subject, room,
      things needed** (Tutor has no subject — room only, and its room is **shared across
      all cycle days**: editing/clearing it applies to every day); edit in a modal (which also holds
      the **Remove** button); "copy from another cycle day" when empty; shows "No school"
      on off days. Add also available via the + menu (pick day + period).
- [x] **Weather strip** (bottom) — a one-line "what to wear" note for the viewed day:
      rain likelihood, high/low, and whether to take a jumper / wear covered shoes. Pulls
      a live daily forecast from Open-Meteo (free, no key). Needs internet; location is set
      in [`src/useWeather.js`](../src/useWeather.js) (`WEATHER_LOCATION`, default Auckland).

## Assignments tab
- [x] Deadline-sorted checklist (soonest first; undated sink to bottom)
- [x] Check to strike through · delete · subject chips
- [ ] Edit an existing assignment  ← see backlog

## Persistence
- [x] Auto-save all state to `localStorage` on every change

---

_When I finish a backlog item, I move its line here and mark it `[x]`._
