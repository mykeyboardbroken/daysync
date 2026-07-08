import { useState } from 'react'

// Weekdays the packing list can show an item on (getDay() numbers).
const WEEKDAYS = [
  { d: 1, label: 'Mon' },
  { d: 2, label: 'Tue' },
  { d: 3, label: 'Wed' },
  { d: 4, label: 'Thu' },
  { d: 5, label: 'Fri' },
]

// Add extra everyday items to bring to school (pencil case, lunch, …). They fold
// into the "Things I need today" list. Separate several with commas. An optional
// weekday repeat limits the item to certain days (blank = every day).
export default function BringModal({ onAdd, onClose }) {
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [days, setDays] = useState([])

  const valid = text.trim()

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd(text.trim(), subject.trim(), days)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Things to bring</h3>
        <p className="modal-sub">Extra items for your packing list — separate with commas</p>

        <form onSubmit={handleSubmit}>
          <label>
            Item(s)
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Pencil case, lunch"
              autoFocus
            />
          </label>

          <label>
            Subject <span className="label-optional">(optional)</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Art"
            />
          </label>

          <div className="field">
            Repeat on <span className="label-optional">(optional — blank = every day)</span>
            <div className="type-select repeat-select">
              {WEEKDAYS.map((w) => (
                <button
                  type="button"
                  key={w.d}
                  className={`type-option ${days.includes(w.d) ? 'selected' : ''}`}
                  onClick={() => toggleDay(w.d)}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <span className="spacer" />
            <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={!valid}>Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}
