import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { nearestGrade } from './grades'

// pdf.js needs a web worker; point it at the bundled one (Vite resolves ?url).
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// Group text fragments into visual rows by their y position, then read each row
// left-to-right by x. This rebuilds the real reading order of multi-column
// tables (which pdf.js otherwise emits in an interleaved, unusable order).
function toRows(items, tol = 9) {
  const sorted = [...items].sort((a, b) => b.y - a.y)
  const rows = []
  for (const it of sorted) {
    let row = rows[rows.length - 1]
    if (!row || Math.abs(row.y - it.y) > tol) {
      row = { y: it.y, items: [] }
      rows.push(row)
    }
    row.items.push(it)
  }
  return rows.map((r) =>
    r.items
      .slice()
      .sort((a, b) => a.x - b.x)
      .map((i) => i.str)
      .join(' '),
  )
}

// Pull the text of every page out of a PDF file, entirely in the browser.
// Returns { text, items } per page: `text` is in proper reading order (rows by
// position); `items` keeps each fragment's x/y/font-height for finer parsing.
export async function extractPdfPages(file) {
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const pages = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const content = await page.getTextContent()
    const items = content.items
      .filter((it) => typeof it.str === 'string' && it.str.trim() !== '')
      .map((it) => ({
        str: it.str.trim(),
        x: it.transform[4],
        y: it.transform[5],
        w: it.width || 0,
        h: it.height || Math.abs(it.transform[3]) || 0,
      }))
    const text = toRows(items).join(' ').replace(/\s+/g, ' ').trim()
    pages.push({ text, items })
  }
  return pages
}

// The co-curricular page: its heading, the section labels it uses, and footer
// junk to ignore. "Service" is kept separate; every other section is lumped
// under extra-curricular activities.
const EXTRA_PAGE_RE = /Co-?Curricular|Student Profile/i
const EXTRA_HEADINGS = new Set([
  'service', 'competitions', 'competition', 'sport', 'sports', 'leadership',
  'cultural', 'music', 'dance', 'drama', 'arts', 'performing arts', 'academic',
  'committees', 'committee', 'community', 'kapa haka', 'debating', 'chess',
  'council', 'prefects', 'prefect', 'choir', 'band', 'orchestra', 'enterprise',
  'robotics', 'cadets', 'clubs', 'club', 'activities', 'involvement',
])
const EXTRA_FOOTER_RE = /rangitoto|great opportunities|great students/i

// Group a page's items into visual lines, and split each line into "cells" at
// big horizontal gaps (so two-column items like "Community Service | Te Hono"
// come out as two separate entries).
function getLines(items, tol = 6) {
  const sorted = [...items].sort((a, b) => b.y - a.y)
  const rows = []
  for (const it of sorted) {
    let row = rows[rows.length - 1]
    if (!row || Math.abs(row.y - it.y) > tol) { row = { y: it.y, items: [] }; rows.push(row) }
    row.items.push(it)
  }
  return rows.map((r) => {
    const ws = r.items.slice().sort((a, b) => a.x - b.x)
    const cells = [[ws[0]]]
    for (let i = 1; i < ws.length; i++) {
      const prev = ws[i - 1]
      const gap = ws[i].x - (prev.x + prev.w)
      if (gap > 28) cells.push([]) // big gap = column boundary
      cells[cells.length - 1].push(ws[i])
    }
    return cells.map((c) => c.map((w) => w.str).join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
  })
}

// Pull the co-curricular page into { service: [...], activities: [...] }.
// Service items stay under Service; everything under any other heading is lumped
// into activities. Returns null if there's no such page.
export function parseExtras(pages) {
  const page = pages.find((p) => EXTRA_PAGE_RE.test(p.text))
  if (!page) return null
  const service = []
  const activities = []
  let section = null // 'service' | 'other' | null
  for (const line of getLines(page.items)) {
    if (line.some((c) => EXTRA_FOOTER_RE.test(c))) continue // footer row
    if (line.some((c) => EXTRA_PAGE_RE.test(c))) { section = null; continue } // page title
    // A lone heading cell switches section (Service/Leadership → service).
    if (line.length === 1 && EXTRA_HEADINGS.has(line[0].toLowerCase())) {
      const low = line[0].toLowerCase()
      section = low === 'service' || low === 'leadership' ? 'service' : 'other'
      continue
    }
    if (!section) continue
    const cells = line.filter((c) => !/^\d+$/.test(c))
    if (section === 'service') {
      // Service is a side-by-side label/value ("Community Service | Te Hono") —
      // join into one entry.
      const item = cells.join(' — ').trim()
      if (item) service.push(item)
    } else {
      // Activities list straight down, one per line (join a space only if a line
      // ever got split, so no stray dashes).
      const item = cells.join(' ').trim()
      if (item) activities.push(item)
    }
  }
  if (!service.length && !activities.length) return null
  return { service, activities }
}

// Text between a start marker and the first following end marker.
function between(text, startRe, endRe) {
  const s = startRe.exec(text)
  if (!s) return ''
  const rest = text.slice(s.index + s[0].length)
  const e = endRe.exec(rest)
  return (e ? rest.slice(0, e.index) : rest).trim()
}

// Subject = the line directly above "Teacher:". Using position (not font size)
// skips the school-name banner at the very top, which is often larger than the
// subject title. The subject shares its line with "Periods Absent", so trim that.
function biggestText(page) {
  const items = page.items || []
  if (!items.length) return page.text.split(' ').slice(0, 3).join(' ')
  const maxH = Math.max(...items.map((i) => i.h))
  return items
    .filter((i) => i.h >= maxH - 0.5)
    .sort((a, b) => a.x - b.x)
    .map((i) => i.str)
    .join(' ')
    .trim()
}

function guessSubject(page) {
  const items = page.items || []
  const teacher = items.find((i) => /Teacher/i.test(i.str))
  if (teacher) {
    const above = items.filter((i) => i.y > teacher.y + 1)
    if (above.length) {
      const lineY = Math.min(...above.map((i) => i.y)) // closest line above "Teacher:"
      const subject = above
        .filter((i) => Math.abs(i.y - lineY) <= 4)
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(' ')
        .split(/Periods Absent/i)[0]
        .trim()
      if (subject) return subject
    }
  }
  return biggestText(page)
}

function parseTeacher(text) {
  const m = /Teacher\s*:\s*(.+?)\s+(?:Email|Periods Absent|Learning Dispositions|Academic Progress|Assessment Results)/i.exec(text)
  return m ? m[1].trim() : ''
}

function parseEmail(text) {
  const m = /Email\s*:\s*(\S+@\S+)/i.exec(text)
  return m ? m[1].trim() : ''
}

function parseAbsent(text) {
  const m = /Periods Absent\s*:\s*(\d+)/i.exec(text)
  return m ? parseInt(m[1], 10) : null
}

// Known disposition ratings (longest first so "Highly Commendable" wins over
// "Commendable"). Each disposition row is a label followed by one value per term.
const DISPOSITION_VALUES =
  /(Highly Commendable|Commendable|Highly Satisfactory|Satisfactory|Needs Attention|Not Achieved|Working Towards|Developing|Excellent|Consistent|Outstanding)/gi

function parseDispositions(text) {
  const body = between(text, /Learning Dispositions/i, /Academic Progress/i)
    .replace(/Term\s*\d/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!body) return []
  const groups = []
  let last = 0
  let m
  DISPOSITION_VALUES.lastIndex = 0
  while ((m = DISPOSITION_VALUES.exec(body))) {
    const gap = body.slice(last, m.index).trim()
    if (gap) groups.push({ name: gap, values: [] })
    if (groups.length) groups[groups.length - 1].values.push(m[0])
    last = m.index + m[0].length
  }
  // Keep only the most recent (last) term value per disposition — that's "now".
  return groups
    .filter((g) => g.name && g.values.length)
    .map((g) => ({ name: g.name, value: g.values[g.values.length - 1] }))
}

// Per-term achievement averages, e.g. "E 7.3  E 8  E 7.5" → [7.3, 8, 7.5] as codes.
// UPPERCASE band letter only (no /i) so a lowercase letter+number in body text —
// e.g. a "Page 6" footer — isn't mistaken for a grade on a not-yet-started subject.
function parseTermAverages(text) {
  const body = between(text, /Achievement Average/i, /(Progress|Assessment Results)/i)
  const out = []
  const re = /([NDAME])\s*(\d+(?:\.\d+)?)/g
  let m
  while ((m = re.exec(body))) {
    out.push({ label: `${m[1]}${m[2]}`, value: parseFloat(m[2]) })
  }
  return out
}

// Assessment results: "<name> <grade>" pairs after the heading. Grades read as
// "E 8" (band + value); the number is the 0–8 value, mapped to the code.
// Band letter is UPPERCASE only (no /i) so lowercase letters inside a title
// aren't mistaken for a grade.
const RESULT_RE = /(.+?)\s+[NDAME]\s*(\d+)(?![.\d])/g

function parseResults(text) {
  const marker = /Assessment Results/i.exec(text)
  if (!marker) return []
  const section = text.slice(marker.index + marker[0].length)
  const results = []
  let m
  RESULT_RE.lastIndex = 0
  while ((m = RESULT_RE.exec(section))) {
    const title = m[1].trim().replace(/^[•\-–\s]+/, '')
    const value = parseInt(m[2], 10)
    if (title && value >= 0 && value <= 8) {
      results.push({ title, code: nearestGrade(value).code })
    }
  }
  return results
}

// A real subject page has BOTH academic section headings AND a "Teacher:" line.
// - The guide/legend page mentions these headings as prose but has no "Teacher:".
// - The tutor/attendance page has a teacher but none of these headings.
// Requiring both skips those while keeping genuine subjects (even ungraded ones).
const SUBJECT_MARKERS = /Learning Dispositions|Academic Progress|Assessment Results/i
const HAS_TEACHER = /Teacher\s*:/i

// Parse a whole report PDF into one record per subject page.
export function parseReport(pages) {
  return pages
    .filter((page) => SUBJECT_MARKERS.test(page.text) && HAS_TEACHER.test(page.text))
    .map((page) => ({
      subject: guessSubject(page),
      teacher: parseTeacher(page.text),
      email: parseEmail(page.text),
      absent: parseAbsent(page.text),
      dispositions: parseDispositions(page.text),
      termAverages: parseTermAverages(page.text),
      results: parseResults(page.text),
    }))
}
