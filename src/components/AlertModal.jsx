import { useState } from 'react'

// Repeat presets. Anything else is entered as a custom interval below.
const REPEATS = [
  { v: 0, label: 'Once' },
  { v: 30, label: '30 min' },
  { v: 60, label: 'Hourly' },
  { v: 120, label: 'Every 2 hr' },
  { v: 1440, label: 'Daily' },
  { v: 10080, label: 'Weekly' },
]
const PRESET_VALUES = REPEATS.map((r) => r.v)

// A repeat is stored as plain minutes; the unit picker is just a nicer way to type
// a big number. Firing more often than every 30 min would be nagging, not helping.
const MIN_REPEAT = 30
const UNITS = [
  { key: 'min', label: 'min', factor: 1 },
  { key: 'hr', label: 'hours', factor: 60 },
  { key: 'day', label: 'days', factor: 1440 },
]
const factorOf = (key) => UNITS.find((u) => u.key === key)?.factor || 1

// Show an existing custom interval back in its largest whole unit (90 → 90 min,
// 180 → 3 hours, 2880 → 2 days) rather than always in minutes.
function splitMinutes(mins) {
  if (mins > 0 && mins % 1440 === 0) return { n: mins / 1440, unit: 'day' }
  if (mins > 0 && mins % 60 === 0) return { n: mins / 60, unit: 'hr' }
  return { n: mins || 45, unit: 'min' }
}

// Local "YYYY-MM-DDTHH:MM" for a datetime-local input, defaulted to the next
// half hour.
function defaultStart() {
  const d = new Date()
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Create or edit a reminder: text, first time, repeat, optional end date.
export default function AlertModal({ onAdd, onDelete, onClose, initial }) {
  const [text, setText] = useState(initial?.text || '')
  const [start, setStart] = useState(initial?.start || defaultStart())
  const [repeat, setRepeat] = useState(initial?.repeat ?? 0)
  const [endDate, setEndDate] = useState(initial?.endDate || '')

  // An existing reminder whose interval isn't one of the presets was a custom one,
  // so reopen it on the Custom tab with its value filled in.
  const initialRepeat = initial?.repeat ?? 0
  const startsCustom = initialRepeat > 0 && !PRESET_VALUES.includes(initialRepeat)
  const initialSplit = splitMinutes(startsCustom ? initialRepeat : 0)
  const [custom, setCustom] = useState(startsCustom)
  const [customN, setCustomN] = useState(String(initialSplit.n))
  const [customUnit, setCustomUnit] = useState(initialSplit.unit)

  const customMinutes = Math.floor(Number(customN) || 0) * factorOf(customUnit)
  const customTooShort = custom && customMinutes > 0 && customMinutes < MIN_REPEAT
  // What actually gets saved.
  const effectiveRepeat = custom ? customMinutes : repeat

  const editing = !!initial
  const valid = text.trim() && start && (!custom || customMinutes >= MIN_REPEAT)

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd({ text: text.trim(), start, repeat: effectiveRepeat, endDate })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editing ? 'Edit reminder' : 'New reminder'}</h3>
        <p className="modal-sub">A nudge that pops on top of Today when it's time</p>

        <form onSubmit={handleSubmit}>
          <label>
            Reminder
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Drink water"
              autoFocus
            />
          </label>

          <label>
            First time
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>

          <div className="field">
            Repeat
            <div className="type-select repeat-select habit-days">
              {REPEATS.map((r) => (
                <button
                  type="button"
                  key={r.v}
                  className={`type-option ${!custom && repeat === r.v ? 'selected' : ''}`}
                  onClick={() => {
                    setCustom(false)
                    setRepeat(r.v)
                  }}
                >
                  {r.label}
                </button>
              ))}
              <button
                type="button"
                className={`type-option ${custom ? 'selected' : ''}`}
                onClick={() => setCustom(true)}
              >
                Custom
              </button>
            </div>
          </div>

          {custom && (
            <div className="field">
              Every
              <div className="custom-repeat">
                <input
                  type="number"
                  min="1"
                  className="custom-repeat-n"
                  value={customN}
                  onChange={(e) => setCustomN(e.target.value)}
                />
                <div className="survey-units">
                  {UNITS.map((u) => (
                    <button
                      type="button"
                      key={u.key}
                      className={`survey-unit ${customUnit === u.key ? 'selected' : ''}`}
                      onClick={() => setCustomUnit(u.key)}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              {customTooShort && (
                <p className="custom-repeat-warn">
                  Reminders can't repeat more often than every {MIN_REPEAT} minutes.
                </p>
              )}
            </div>
          )}

          {effectiveRepeat > 0 && (
            <label>
              Repeat until <span className="label-optional">(optional)</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          )}

          <div className="modal-actions">
            {editing && onDelete && (
              <button type="button" className="danger-link" onClick={onDelete}>Delete</button>
            )}
            <span className="spacer" />
            <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={!valid}>
              {editing ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
