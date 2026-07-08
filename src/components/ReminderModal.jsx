import { useState } from 'react'
import { REPEATS } from '../reminders'

// Add a reminder — something to do that stays on the Today tab until you check
// it off. Can repeat (daily / weekdays / weekly) so it comes back each period.
export default function ReminderModal({ onAdd, onClose }) {
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  const [repeat, setRepeat] = useState('none')

  const valid = text.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd({ text: text.trim(), due, repeat })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New reminder</h3>
        <p className="modal-sub">Something to do — check it off when done</p>

        <form onSubmit={handleSubmit}>
          <label>
            Reminder
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Return library book"
              autoFocus
            />
          </label>

          <label>
            Repeat
            <div className="type-select repeat-select">
              {REPEATS.map((r) => (
                <button
                  type="button"
                  key={r.key}
                  className={`type-option ${repeat === r.key ? 'selected' : ''}`}
                  onClick={() => setRepeat(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </label>

          <label>
            Deadline <span className="label-optional">(optional)</span>
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>

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
