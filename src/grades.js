// The school's junior grading scale. Each code is BOTH a label and a number
// (the digit in the code), so grades can be shown as-is (E7, M5) yet still
// averaged numerically. `value` = that hidden 0–8 rank; `band` = the word.
export const GRADE_SCALE = [
  { code: 'N0', value: 0, band: 'Not achieved' },
  { code: 'N1', value: 1, band: 'Not achieved' },
  { code: 'D2', value: 2, band: 'Developing' },
  { code: 'A3', value: 3, band: 'Achieved' },
  { code: 'A4', value: 4, band: 'Achieved' },
  { code: 'M5', value: 5, band: 'Merit' },
  { code: 'M6', value: 6, band: 'Merit' },
  { code: 'E7', value: 7, band: 'Excellence' },
  { code: 'E8', value: 8, band: 'Excellence' },
]

export const GRADE_CODES = GRADE_SCALE.map((g) => g.code)

const BY_CODE = Object.fromEntries(GRADE_SCALE.map((g) => [g.code, g]))

// A colour per band — a red→purple ramp so the grade reads like a heatmap.
const BAND_COLOR = {
  'Not achieved': '#ef4444', // red
  Developing: '#f97316', // orange
  Achieved: '#eab308', // amber
  Merit: '#22c55e', // green
  Excellence: '#6366f1', // indigo
}

export function gradeInfo(code) {
  return BY_CODE[code] || null
}

// Grade chips are kept to the single accent colour (mostly-monochrome look) —
// the code itself (M6, E7…) already carries the meaning. BAND_COLOR is retained
// for reference but no longer drives the UI.
export function gradeColor() {
  return 'var(--accent)'
}

// The scale entry whose value is closest to a numeric average (ties round up).
export function nearestGrade(value) {
  let best = GRADE_SCALE[0]
  let bestDist = Infinity
  for (const g of GRADE_SCALE) {
    const dist = Math.abs(g.value - value)
    if (dist < bestDist || (dist === bestDist && g.value > best.value)) {
      best = g
      bestDist = dist
    }
  }
  return best
}

// Average a list of grade codes. Returns null when nothing's graded, else
// { avg, nearest (a scale entry), count }. `avg` keeps one decimal for display.
export function averageGrades(codes) {
  const values = codes.map((c) => BY_CODE[c]?.value).filter((v) => v != null)
  if (!values.length) return null
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return {
    avg: Math.round(mean * 10) / 10,
    nearest: nearestGrade(mean),
    count: values.length,
  }
}
