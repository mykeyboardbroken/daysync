import { PERIODS, CYCLE_DAYS, cycleDay } from './schoolCalendar'

// Columns run left→right in this fixed order (matches the timetable screenshot).
const PERIOD_IDS = PERIODS.map((p) => p.id) // [tutor, p1, p2, p3a, p3b, p4, p5]
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

// Draw the image upscaled to a canvas and apply one of two treatments:
//  - 'threshold': dark class text → black, coloured backgrounds → white (reads
//     every class cell, but kills the light-coloured date column).
//  - 'gray': grayscale + contrast stretch (keeps the white date text readable).
function drawCanvas(img, mode) {
  const scale = Math.min(2, 3000 / Math.max(1, img.width))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data
  if (mode === 'threshold') {
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      const v = lum < 120 ? 0 : 255
      d[i] = d[i + 1] = d[i + 2] = v
    }
  } else {
    let min = 255
    let max = 0
    const lums = new Float32Array(d.length / 4)
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      lums[i / 4] = lum
      if (lum < min) min = lum
      if (lum > max) max = lum
    }
    const range = Math.max(1, max - min)
    for (let i = 0; i < d.length; i += 4) {
      const v = ((lums[i / 4] - min) / range) * 255
      d[i] = d[i + 1] = d[i + 2] = v
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas
}

function collectWords(data) {
  if (Array.isArray(data.words) && data.words.length) return data.words
  const out = []
  for (const b of data.blocks || [])
    for (const p of b.paragraphs || [])
      for (const l of p.lines || [])
        for (const wd of l.words || []) out.push(wd)
  return out
}
function toWords(data) {
  return collectWords(data)
    .map((w) => ({
      text: (w.text || '').trim(),
      x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1,
      cx: (w.bbox.x0 + w.bbox.x1) / 2, cy: (w.bbox.y0 + w.bbox.y1) / 2, h: w.bbox.y1 - w.bbox.y0,
    }))
    .filter((w) => w.text)
}
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
function splitInto(values, n) {
  const s = [...values].sort((a, b) => a - b)
  if (s.length <= n) return s.map((v) => [v])
  const gaps = []
  for (let i = 1; i < s.length; i++) gaps.push({ size: s[i] - s[i - 1], at: i })
  gaps.sort((a, b) => b.size - a.size)
  const cuts = new Set(gaps.slice(0, n - 1).map((g) => g.at))
  const out = []
  let cur = []
  s.forEach((v, i) => { if (cuts.has(i)) { out.push(cur); cur = [] } cur.push(v) })
  out.push(cur)
  return out
}
function nearest(centers, v) {
  let bi = 0
  for (let i = 1; i < centers.length; i++) if (Math.abs(centers[i] - v) < Math.abs(centers[bi] - v)) bi = i
  return bi
}

// ---- Which cycle day is each row? ----
// Timetables come in two shapes and we must handle both:
//   a) Rows labelled "Day 1".."Day 6" — the cycle day is written right there.
//   b) Rows labelled with dates ("Monday 3 March") — convert the date to a cycle day.
// Reading only (b) meant a Day 1–6 screenshot imported NOTHING at all, and any dated
// row landing inside a term break resolved to null (no cycle day exists on a holiday)
// and was silently dropped.
// Exported so it can be tested without running OCR.
export function rowCyclesFrom({ rowCenters, dWords = [], cWords = [], lineH = 16 }) {
  const allWords = [...dWords, ...cWords]

  // (a) A "Day N" label on this row. OCR may return it merged ("Day3") or split
  // ("Day", "3"), so handle both.
  const dayFromLabel = (rowCy) => {
    const onRow = allWords
      .filter((w) => Math.abs(w.cy - rowCy) < lineH * 1.2)
      .sort((a, b) => a.x0 - b.x0)
    for (let i = 0; i < onRow.length; i++) {
      const merged = /^day\s*([1-6])$/i.exec(onRow[i].text)
      if (merged) return Number(merged[1])
      if (/^day$/i.test(onRow[i].text)) {
        const next = onRow[i + 1]
        const n = next && /^([1-6])$/.exec(next.text.replace(/[.,:]/g, ''))
        if (n) return Number(n[1])
      }
    }
    return null
  }

  // (b) A date on this row, anchored on the weekday word.
  const weekdayRe = /^(mon|tues|wednes|thurs|fri)day/i
  const anchors = dWords.filter((w) => weekdayRe.test(w.text))
  const dayFromDate = (rowCy) => {
    const anchor = anchors.reduce(
      (best, a) => (!best || Math.abs(a.cy - rowCy) < Math.abs(best.cy - rowCy) ? a : best),
      null,
    )
    if (!anchor) return null
    const parts = []
    for (const w of dWords
      .filter((w) => Math.abs(w.cy - anchor.cy) < lineH * 0.7 && w.x0 >= anchor.x0 - 2)
      .sort((a, b) => a.x0 - b.x0)) {
      if (/^tutor|^pd\b|^pd\d|\(/i.test(w.text)) break
      parts.push(w.text)
    }
    const text = parts.join(' ')
    const m = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)/.exec(text)
    if (!m) return null
    const mi = MONTHS.indexOf(m[2].toLowerCase())
    if (mi < 0) return null
    const ym = /\b(20\d{2})\b/.exec(text)
    const year = ym ? Number(ym[1]) : new Date().getFullYear()
    return cycleDay(new Date(year, mi, Number(m[1])))
  }

  const cycles = rowCenters.map((rowCy) => dayFromLabel(rowCy) ?? dayFromDate(rowCy))

  // (c) Last resort: a 6-row grid with no readable row labels IS a cycle timetable,
  // and those always run Day 1 → Day 6 top to bottom. Importing it beats handing back
  // an empty grid because the OCR couldn't read a header.
  if (rowCenters.length === CYCLE_DAYS.length && cycles.every((c) => !c)) {
    return CYCLE_DAYS.slice()
  }
  return cycles
}

// OCR a timetable screenshot and reconstruct the grid, keyed by CYCLE DAY (1–6).
// Each row's date is read and converted to its cycle day, so a Mon–Fri weekly
// screenshot drops into the right Day 1–6 slots. Returns { grid, rawText }.
export async function extractTimetable(file) {
  const img = await loadImage(file)
  const classCanvas = drawCanvas(img, 'threshold')
  const dateCanvas = drawCanvas(img, 'gray')

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  let cWords
  let dWords
  let rawText = ''
  try {
    const c = await worker.recognize(classCanvas, {}, { blocks: true })
    cWords = toWords(c.data)
    rawText = c.data.text || ''
    const dp = await worker.recognize(dateCanvas, {}, { blocks: true })
    dWords = toWords(dp.data)
  } finally {
    await worker.terminate()
  }

  const grid = {}
  // Suffix match so merged tokens like "TTRRoom"/"BECRoom" still anchor a cell.
  const rooms = cWords.filter((w) => /room[.:,]?$/i.test(w.text))
  if (rooms.length < 3) return { grid, rawText }

  const lineH = mean(cWords.map((w) => w.h)) || 16
  // Rows = however many the screenshot has (5 weekday rows, or 6 cycle rows).
  const ys = rooms.map((r) => r.cy).sort((a, b) => a - b)
  const rowCenters = []
  let group = [ys[0]]
  for (let i = 1; i < ys.length; i++) {
    if (ys[i] - ys[i - 1] > lineH * 2.5) { rowCenters.push(mean(group)); group = [] }
    group.push(ys[i])
  }
  rowCenters.push(mean(group))

  const colCenters = splitInto(rooms.map((r) => r.cx), 7).map(mean).sort((a, b) => a - b)
  const colWidth = colCenters.length > 1 ? Math.min(...colCenters.slice(1).map((c, i) => c - colCenters[i])) : 9999
  const colOf = (cx) => {
    let c = 0
    for (let i = 0; i < colCenters.length - 1; i++) if (cx >= colCenters[i] + 0.4 * colWidth) c = i + 1
    return c
  }

  const rowCycle = rowCyclesFrom({ rowCenters, dWords, cWords, lineH })

  for (const room of rooms) {
    const col = colOf(room.cx)
    const cd = rowCycle[nearest(rowCenters, room.cy)]
    const periodId = PERIOD_IDS[col]
    if (!cd || !periodId) continue

    // Room code = nearest word right of the "…Room" token; drop dots ("G.1"→"G1").
    const right = cWords
      .filter((w) => w !== room && Math.abs(w.cy - room.cy) < lineH * 0.6 && w.x0 >= room.x1 - 2)
      .sort((a, b) => a.x0 - b.x0)
    const roomCode = (right[0]?.text || '').replace(/[.,]/g, '').trim()

    // Subject = alphabetic words below the room line, strictly in this column,
    // grouped into lines (top→bottom) then read left→right.
    const cand = cWords.filter(
      (w) =>
        w.cy > room.cy + lineH * 0.5 &&
        w.cy < room.cy + lineH * 3.2 &&
        colOf(w.cx) === col &&
        /[A-Za-z&]/.test(w.text),
    )
    cand.sort((a, b) => a.cy - b.cy)
    const lines = []
    for (const w of cand) {
      const last = lines[lines.length - 1]
      if (last && Math.abs(last[0].cy - w.cy) < lineH * 0.6) last.push(w)
      else lines.push([w])
    }
    const subject = lines
      .map((ln) => ln.sort((a, b) => a.x0 - b.x0).map((w) => w.text).join(' '))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!grid[cd]) grid[cd] = {}
    grid[cd][periodId] = { subject, room: roomCode }
  }

  return { grid, rawText }
}
