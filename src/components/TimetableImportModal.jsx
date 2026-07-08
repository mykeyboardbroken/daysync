import { useState } from 'react'
import { PERIODS, CYCLE_DAYS } from '../schoolCalendar'
import Icon from './Icon'

// Build an empty editable draft: draft[cycleDay][periodId] = { subject, room }.
function emptyDraft() {
  const d = {}
  for (const day of CYCLE_DAYS) {
    d[day] = {}
    for (const p of PERIODS) d[day][p.id] = { subject: '', room: '' }
  }
  return d
}

// Merge OCR results into an empty draft so every cell exists and is editable.
function draftFrom(grid) {
  const d = emptyDraft()
  for (const [day, periods] of Object.entries(grid)) {
    for (const [pid, cls] of Object.entries(periods)) {
      if (d[day] && d[day][pid]) d[day][pid] = { subject: cls.subject || '', room: cls.room || '' }
    }
  }
  return d
}

// Upload a timetable screenshot → OCR reads it → review & fix a Day 1–6 grid →
// save it all at once. Nothing is stored until you press Save.
export default function TimetableImportModal({ onImport, onClose }) {
  const [stage, setStage] = useState('pick') // pick | loading | review | error
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [rawText, setRawText] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
  const [mode, setMode] = useState('merge') // 'merge' keeps current timetable, 'new' replaces it

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setStage('loading')
    setError('')
    try {
      const { extractTimetable } = await import('../timetableOcr')
      const merged = {}
      let raw = ''
      for (let i = 0; i < files.length; i++) {
        setProgress(`Reading screenshot ${i + 1} of ${files.length}…`)
        const { grid, rawText } = await extractTimetable(files[i])
        // Later weeks fill/overwrite cells, covering more of the 6-day cycle.
        for (const [day, periods] of Object.entries(grid)) {
          merged[day] = { ...(merged[day] || {}), ...periods }
        }
        raw += `\n----- SCREENSHOT ${i + 1} -----\n${rawText}`
      }
      setRawText(raw.trim())
      setDraft(draftFrom(merged))
      setStage('review')
    } catch (err) {
      setError(`Couldn't read that image (${err?.message || 'unknown error'}).`)
      setStage('error')
    }
  }

  function edit(day, pid, field, value) {
    setDraft((prev) => ({
      ...prev,
      [day]: { ...prev[day], [pid]: { ...prev[day][pid], [field]: value } },
    }))
  }

  function handleSave() {
    onImport(draft, mode)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Upload timetable</h3>

        {stage === 'pick' && (
          <>
            <p className="modal-sub">
              Your classes rotate on a 6-day cycle, but each screenshot only shows one week (Mon–Fri).
              So pick <strong>two screenshots from two different weeks</strong> — together they cover all
              of Day 1–6. It reads the dates to slot each day correctly. Everything stays on your device.
            </p>
            <label className="file-drop">
              <input type="file" accept="image/*" multiple onChange={handleFiles} />
              <span><Icon name="image" size={18} /> Choose two screenshots…</span>
            </label>
            <p className="type-hint">
              Tip: you can also add just one now and upload the other week later — it merges.
            </p>
          </>
        )}

        {stage === 'loading' && (
          <p className="modal-sub">
            {progress || 'Reading your timetable…'} This takes up to a minute per screenshot.
          </p>
        )}

        {stage === 'error' && (
          <>
            <p className="import-error">{error}</p>
            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="ghost-btn" onClick={() => setStage('pick')}>
                Try another image
              </button>
            </div>
          </>
        )}

        {stage === 'review' && (
          <>
            {(() => {
              const isFilled = (day) =>
                PERIODS.some((p) => draft[day][p.id].subject || draft[day][p.id].room)
              const filled = CYCLE_DAYS.filter(isFilled)
              const empty = CYCLE_DAYS.filter((d) => !isFilled(d))
              const orderedDays = [...filled, ...empty]
              const count = filled.reduce(
                (n, day) => n + PERIODS.filter((p) => draft[day][p.id].subject).length,
                0,
              )
              return (
                <>
                  <p className="modal-sub">
                    {filled.length > 0 ? (
                      <>
                        Read <strong>{count} classes</strong> into Day {filled.join(', ')}.
                        {empty.length > 0 && ` Day ${empty.join(', ')} not in this screenshot — upload another week to fill ${empty.length === 1 ? 'it' : 'them'}.`}
                        {' '}Check &amp; fix, then save.
                      </>
                    ) : (
                      "Couldn't read the grid. Fill it in below, or Cancel and try a clearer screenshot."
                    )}
                  </p>
                  <div className="import-review tt-review">
                    {orderedDays.map((day) => (
                      <div key={day} className={`tt-day ${isFilled(day) ? '' : 'tt-day-empty'}`}>
                        <div className="tt-day-head">
                          Day {day}
                          {!isFilled(day) && <span className="tt-day-tag">not in screenshot</span>}
                        </div>
                  {PERIODS.map((p) => (
                    <div key={p.id} className="tt-cell">
                      <span className="tt-period">{p.label}</span>
                      <input
                        className="tt-subject"
                        value={draft[day][p.id].subject}
                        onChange={(e) => edit(day, p.id, 'subject', e.target.value)}
                        placeholder={p.noSubject ? 'Tutor' : 'Subject'}
                      />
                      <input
                        className="tt-room"
                        value={draft[day][p.id].room}
                        onChange={(e) => edit(day, p.id, 'room', e.target.value)}
                        placeholder="Room"
                      />
                    </div>
                  ))}
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
            {rawText && (
              <details className="import-raw">
                <summary>Show the text it read</summary>
                <pre>{rawText}</pre>
              </details>
            )}
            <label className="import-mode-label">Save as</label>
            <div className="type-select repeat-select">
              <button
                type="button"
                className={`type-option ${mode === 'merge' ? 'selected' : ''}`}
                onClick={() => setMode('merge')}
              >
                Merge with current
              </button>
              <button
                type="button"
                className={`type-option ${mode === 'new' ? 'selected' : ''}`}
                onClick={() => setMode('new')}
              >
                Replace all
              </button>
            </div>
            <p className="type-hint">
              {mode === 'merge'
                ? 'Fills in and updates your current timetable, keeping the rest.'
                : 'Wipes your current timetable first, then uses only what you import here.'}
            </p>

            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
              <button type="button" className="primary-btn" onClick={handleSave}>Save timetable</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
