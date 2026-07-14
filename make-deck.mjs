import PptxGenJS from 'pptxgenjs'

// Deck styled to match the app: dark navy base, indigo accent, Plus Jakarta Sans.
const BG = '0F172A'
const SURFACE = '1E293B'
const ACCENT = '6366F1'
const TEXT = 'E2E8F0'
const DIM = '94A3B8'
const WHITE = 'FFFFFF'
const FONT = 'Plus Jakarta Sans'

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_16x9' // 10 x 5.625 in
pptx.author = 'Brian Kim'
pptx.title = 'DaySync — investor pitch'

const W = 10
const M = 0.6 // margin

// Every slide: dark background + a thin accent rule under the title.
function slide({ kicker, title }) {
  const s = pptx.addSlide()
  s.background = { color: BG }
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.38, w: W - M * 2, h: 0.25,
      fontFace: FONT, fontSize: 11, bold: true, color: ACCENT, charSpacing: 1.5,
    })
  }
  if (title) {
    s.addText(title, {
      x: M, y: 0.62, w: W - M * 2, h: 0.6,
      fontFace: FONT, fontSize: 30, bold: true, color: WHITE,
    })
    s.addShape(pptx.ShapeType.rect, {
      x: M, y: 1.28, w: 0.7, h: 0.05, fill: { color: ACCENT },
    })
  }
  return s
}

// A rounded "card" with a heading and body copy.
function card(s, { x, y, w, h, head, body, headColor = WHITE }) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: SURFACE }, line: { color: '334155', width: 1 },
  })
  s.addText(head, {
    x: x + 0.22, y: y + 0.16, w: w - 0.44, h: 0.3,
    fontFace: FONT, fontSize: 14, bold: true, color: headColor,
  })
  s.addText(body, {
    x: x + 0.22, y: y + 0.5, w: w - 0.44, h: h - 0.66,
    fontFace: FONT, fontSize: 11, color: DIM, lineSpacing: 16, valign: 'top',
  })
}

function bullets(s, items, { x = M, y = 1.6, w = W - M * 2, size = 14 } = {}) {
  s.addText(
    items.map((t) => ({
      text: t,
      options: { bullet: { code: '2022' }, color: TEXT, fontSize: size, fontFace: FONT, paraSpaceAfter: 10 },
    })),
    { x, y, w, h: 3.4, valign: 'top' },
  )
}

/* ------------------------------------------------------------------ 1. Title */
{
  const s = pptx.addSlide()
  s.background = { color: BG }
  s.addShape(pptx.ShapeType.roundRect, {
    x: M, y: 1.55, w: 0.72, h: 0.72, rectRadius: 0.18, fill: { color: ACCENT },
  })
  s.addText('✓', {
    x: M, y: 1.55, w: 0.72, h: 0.72,
    fontFace: FONT, fontSize: 30, bold: true, color: WHITE, align: 'center', valign: 'middle',
  })
  s.addText('DaySync', {
    x: M, y: 2.45, w: W - M * 2, h: 0.8,
    fontFace: FONT, fontSize: 54, bold: true, color: WHITE,
  })
  s.addText('The planner built around a student’s actual school day.', {
    x: M, y: 3.25, w: 7.4, h: 0.4,
    fontFace: FONT, fontSize: 18, color: DIM,
  })
  s.addText('Prototype · live & installable · seeking first users', {
    x: M, y: 4.55, w: 7, h: 0.3,
    fontFace: FONT, fontSize: 12, color: ACCENT, bold: true,
  })
}

/* ---------------------------------------------------------------- 2. Problem */
{
  const s = slide({ kicker: 'The problem', title: 'Students run their lives on nothing' })
  card(s, { x: M, y: 1.65, w: 2.86, h: 1.5, head: 'Scattered',
    body: 'Timetable in one app, homework in another, grades on a school portal, everything else on paper.' })
  card(s, { x: M + 3.06, y: 1.65, w: 2.86, h: 1.5, head: 'Not built for school',
    body: 'Notion and Todoist assume a 9–5. They know nothing about a rotating timetable or a term break.' })
  card(s, { x: M + 6.12, y: 1.65, w: 2.86, h: 1.5, head: 'Abandoned',
    body: 'Planners ask for a 20-question setup before they show you anything. Students bounce.' })
  s.addText(
    'The result: most students plan their week in their head — and forget the book, the test, and the deadline.',
    { x: M, y: 3.55, w: W - M * 2, h: 0.6, fontFace: FONT, fontSize: 16, color: TEXT, italic: true },
  )
}

/* --------------------------------------------------------------- 3. Solution */
{
  const s = slide({ kicker: 'The solution', title: 'One app for the whole student day' })
  bullets(s, [
    'Knows the school day — built on the rotating cycle-day timetable, term breaks and public holidays.',
    'School and life in one place — classes, homework, grades, routines, focus, reminders.',
    'Opens to your day in two questions. No setup wall, no account required.',
    'Works with no signal, and installs to the Home Screen like a native app.',
  ], { y: 1.75, size: 15 })
  s.addShape(pptx.ShapeType.roundRect, {
    x: M, y: 4.05, w: W - M * 2, h: 0.75, rectRadius: 0.08,
    fill: { color: '1E1B4B' }, line: { color: ACCENT, width: 1 },
  })
  s.addText('Built by a 13-year-old student, for students — not guessed at by adults.', {
    x: M + 0.25, y: 4.05, w: W - M * 2 - 0.5, h: 0.75,
    fontFace: FONT, fontSize: 14, bold: true, color: WHITE, valign: 'middle',
  })
}

/* ------------------------------------------------------ 4. Product (shipped) */
{
  const s = slide({ kicker: 'The product', title: 'What already works today' })
  const F = [
    ['Today', 'Your day split into morning, afternoon and night. Tap a task to open its steps; drag to reorder.'],
    ['Academics', 'Cycle-day timetable, homework, assignments, grades, and an auto-built “what to pack” list.'],
    ['Calendar', 'Tests and dates, with school holidays and public holidays already in it.'],
    ['Focus', 'A full-screen distraction-free timer, with the apps you commit to avoiding.'],
    ['Reminders', 'Timed nudges that repeat on any interval you like.'],
    ['Motivation', 'XP, levels and a login streak — progress you can see.'],
  ]
  F.forEach(([head, body], i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    card(s, {
      x: M + col * 3.06, y: 1.65 + row * 1.72, w: 2.86, h: 1.52,
      head, body, headColor: WHITE,
    })
  })
}

/* --------------------------------------------------------- 5. Why it's hard */
{
  const s = slide({ kicker: 'Why it wins', title: 'The moat is the boring stuff' })
  bullets(s, [
    'Timetable-native. The rotating cycle day is the thing every generic planner gets wrong — and it’s the thing that makes school usable.',
    'Zero marginal cost. No AI bills, no API fees. Every feature — including the workout generator — runs on the device.',
    'Privacy by default. Data lives on the phone. Nothing to leak, nothing to sell, easy for a school to say yes to.',
    'Offline-first. Works on a school bus, in a basement classroom, on a dead network.',
    'Distribution is a link. No app store review, no gatekeeper — it installs from a WhatsApp message.',
  ], { y: 1.7, size: 14 })
}

/* --------------------------------------------------------------- 6. Traction */
{
  const s = slide({ kicker: 'Where we are', title: 'Prototype — built, live, installable' })
  card(s, { x: M, y: 1.7, w: 4.34, h: 2.5, head: 'Done',
    body: '• Full product shipped and deployed\n• Installs to iPhone home screen (PWA)\n• Works fully offline\n• Pre-launch audit passed: 9 real bugs found and fixed\n• Zero infrastructure cost to date' })
  card(s, { x: M + 4.54, y: 1.7, w: 4.34, h: 2.5, head: 'Not yet',
    body: '• No users — has not launched\n• No revenue\n• No accounts / cloud sync (built, switched off)\n• No push notifications yet' })
  s.addText('We are pre-launch. The next milestone is the first ten real students.', {
    x: M, y: 4.45, w: W - M * 2, h: 0.4,
    fontFace: FONT, fontSize: 13, color: ACCENT, bold: true,
  })
}

/* ------------------------------------------------------------- 7. Milestones */
{
  const s = slide({ kicker: 'Roadmap', title: 'Milestones' })
  const MS = [
    ['NOW', 'Prototype', 'Product live and installable. Free, offline, no account.'],
    ['M1', 'First users', 'Launch to one school year group. Learn what students actually use.'],
    ['M2', 'Stickiness', 'Optional accounts, cloud sync across devices, push notifications.'],
    ['M3', 'Scale', 'Real school timetable import. Word-of-mouth to a whole school.'],
    ['M4', 'Revenue', 'Turn on the business model once retention is proven.'],
  ]
  const y0 = 1.75
  MS.forEach(([tag, head, body], i) => {
    const y = y0 + i * 0.66
    s.addShape(pptx.ShapeType.roundRect, {
      x: M, y, w: 0.78, h: 0.5, rectRadius: 0.1,
      fill: { color: i === 0 ? ACCENT : SURFACE }, line: { color: i === 0 ? ACCENT : '334155', width: 1 },
    })
    s.addText(tag, {
      x: M, y, w: 0.78, h: 0.5,
      fontFace: FONT, fontSize: 11, bold: true, color: i === 0 ? WHITE : DIM,
      align: 'center', valign: 'middle',
    })
    s.addText(head, {
      x: M + 0.95, y: y + 0.02, w: 2.1, h: 0.24,
      fontFace: FONT, fontSize: 13, bold: true, color: WHITE,
    })
    s.addText(body, {
      x: M + 0.95, y: y + 0.25, w: 6.3, h: 0.24,
      fontFace: FONT, fontSize: 11, color: DIM,
    })
  })
}

/* --------------------------------------------------------- 8. Business model */
{
  const s = slide({ kicker: 'Business model — future', title: 'Free to students. Paid by schools.' })
  card(s, { x: M, y: 1.7, w: 2.86, h: 2.35, head: 'Core — free, forever',
    body: 'The whole planner. No ads, no data selling. Free is the growth engine: a student will not pay to try a planner, and a school will not adopt one nobody uses.' })
  card(s, { x: M + 3.06, y: 1.7, w: 2.86, h: 2.35, head: 'Premium — student',
    body: 'A small monthly fee for cloud sync across devices, backup, notifications, and deeper grade insight. Opt-in, never a wall.' })
  card(s, { x: M + 6.12, y: 1.7, w: 2.86, h: 2.35, head: 'Schools — the real revenue',
    body: 'Per-school licence: push the official timetable and term dates to every student, plus an admin view. One sale reaches a thousand students.' })
  s.addText('Not switched on yet — by design. Retention first, revenue second.', {
    x: M, y: 4.3, w: W - M * 2, h: 0.4,
    fontFace: FONT, fontSize: 13, color: DIM, italic: true,
  })
}

/* ----------------------------------------------------------------- 9. Market */
{
  const s = slide({ kicker: 'Market', title: 'Every student has this problem' })
  const N = [
    ['~800k', 'school students in New Zealand — the beachhead'],
    ['~1.5B', 'students in school worldwide'],
    ['$0', 'marginal cost to serve one more student'],
  ]
  N.forEach(([big, small], i) => {
    const x = M + i * 3.06
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.8, w: 2.86, h: 1.7, rectRadius: 0.08,
      fill: { color: SURFACE }, line: { color: '334155', width: 1 },
    })
    s.addText(big, {
      x, y: 1.95, w: 2.86, h: 0.7,
      fontFace: FONT, fontSize: 32, bold: true, color: ACCENT, align: 'center',
    })
    s.addText(small, {
      x: x + 0.2, y: 2.65, w: 2.46, h: 0.7,
      fontFace: FONT, fontSize: 11, color: DIM, align: 'center', valign: 'top',
    })
  })
  s.addText(
    'Start with one year group, in one school, in one city. Win it properly, then repeat.',
    { x: M, y: 3.9, w: W - M * 2, h: 0.5, fontFace: FONT, fontSize: 14, color: TEXT },
  )
}

/* -------------------------------------------------------------------- 10. Ask */
{
  const s = slide({ kicker: 'The ask', title: 'What we need next' })
  bullets(s, [
    'Users, not money — first. Ten students using it for a month tells us more than any funding round.',
    'Intros to a school that will let us pilot with one year group.',
    'A small amount of funding to cover cloud sync, notifications and design polish.',
    'Advice on turning a product students love into a product schools buy.',
  ], { y: 1.75, size: 15 })
  s.addShape(pptx.ShapeType.roundRect, {
    x: M, y: 4.1, w: W - M * 2, h: 0.8, rectRadius: 0.08,
    fill: { color: ACCENT },
  })
  s.addText('daysync.vercel.app  ·  Brian Kim  ·  briankimnz@gmail.com', {
    x: M, y: 4.1, w: W - M * 2, h: 0.8,
    fontFace: FONT, fontSize: 14, bold: true, color: WHITE, align: 'center', valign: 'middle',
  })
}

await pptx.writeFile({ fileName: 'DaySync-Pitch.pptx' })
console.log('wrote DaySync-Pitch.pptx')
