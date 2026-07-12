import { useState } from 'react'

// Repeat options — minimum interval is 30 minutes.
const REPEATS = [
  { v: 0, label: 'Once' },
  { v: 30, label: '30 min' },
  { v: 60, label: 'Hourly' },
  { v: 120, label: 'Every 2 hr' },
  { v: 1440, label: 'Daily' },
  { v: 10080, label: 'Weekly' },
]

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

  const editing = !!initial
  const valid = text.trim() && start

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd({ text: text.trim(), start, repeat, endDate })
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
                  className={`type-option ${repeat === r.v ? 'selected' : ''}`}
                  onClick={() => setRepeat(r.v)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {repeat > 0 && (
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
