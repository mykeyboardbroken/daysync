// Direct-from-browser Claude calls for the Study tab. The app has no backend,
// so the user supplies their own Anthropic API key. It's kept in its own
// localStorage entry (NOT part of the schedule data, so it never lands in a
// backup export) and only ever leaves the browser to call Anthropic.

const KEY_STORAGE = 'schedule-app.aiKey'
const MODEL = 'claude-sonnet-5'
const norm = (s) => (s || '').trim().toLowerCase()

export function getApiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* ignore */
  }
}

// Summarise the student's grades/subjects into a compact block for the prompt.
export function buildStudyContext(schedule) {
  const { reports = [], events = [], timetable = {} } = schedule
  const graded = events.filter((e) => e.result && (e.subject || '').trim())

  const bySubject = new Map()
  const ensure = (subject) => {
    const k = norm(subject)
    if (!bySubject.has(k)) {
      bySubject.set(k, { subject: (subject || '').trim(), results: [], terms: [], dispositions: [] })
    }
    return bySubject.get(k)
  }

  for (const r of reports) {
    const s = ensure(r.subject)
    for (const res of r.results || []) s.results.push(`${res.title}: ${res.code}`)
    if (r.termAverages?.length) s.terms = r.termAverages.map((t) => t.label)
    if (r.dispositions?.length) s.dispositions = r.dispositions.map((d) => `${d.name} ${d.value}`)
  }
  for (const e of graded) ensure(e.subject).results.push(`${e.title}: ${e.result}`)

  const timetableSubjects = new Set()
  for (const day of Object.values(timetable)) {
    for (const cls of Object.values(day || {})) {
      if (cls?.subject) timetableSubjects.add(cls.subject.trim())
    }
  }

  const lines = []
  for (const s of bySubject.values()) {
    let line = `- ${s.subject}`
    if (s.terms.length) line += ` | term grades: ${s.terms.join(' → ')}`
    if (s.results.length) line += ` | results: ${s.results.join('; ')}`
    if (s.dispositions.length) line += ` | learning behaviours: ${s.dispositions.join(', ')}`
    lines.push(line)
  }
  for (const subj of timetableSubjects) {
    if (!bySubject.has(norm(subj))) lines.push(`- ${subj} (no grades recorded yet)`)
  }
  return lines.join('\n')
}

// Ask Claude for study suggestions. Returns { ok, text } or { ok:false, error }.
export async function suggestStudy({ apiKey, context, focus }) {
  const prompt = [
    'You are an encouraging study coach for a Year 9 student in New Zealand.',
    'Their grades use a 9-point scale, lowest to highest: N0, N1, D2, A3, A4, M5, M6, E7, E8',
    '(N = not yet achieved, D = developing, A = achieved, M = merit, E = excellence).',
    '',
    'Current subjects and grades:',
    context || '(no grades recorded yet)',
    focus ? `\nThey especially want to focus on: ${focus}` : '',
    '',
    'Suggest specific things they could study to improve. Prioritise subjects with lower',
    'grades or a downward trend. For each subject worth attention, give 2–3 concrete,',
    'actionable ideas — topics to revise, skills to practise, or study techniques —',
    'suitable for a 14-year-old. Be concise and warm. Group by subject with short bullets.',
  ].join('\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      let detail = `Error ${res.status}`
      try {
        const j = await res.json()
        detail = j?.error?.message || detail
      } catch {
        /* ignore */
      }
      if (res.status === 401) detail = 'Invalid API key — check it and try again.'
      return { ok: false, error: detail }
    }
    const data = await res.json()
    const text = (data.content || []).map((b) => b.text || '').join('').trim()
    return { ok: true, text }
  } catch {
    return { ok: false, error: 'Could not reach Anthropic (offline, or blocked by the network).' }
  }
}
