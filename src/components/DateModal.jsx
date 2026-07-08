import { useState } from 'react'

// Add or edit a plain important date — a day to remember (trip, holiday, event).
// Just a title and a date; it shows in "Coming up" / "Important dates" with a
// countdown. Pass `initial` to edit. (Tests are their own thing — see TestModal.)
export default function DateModal({ onAdd, onClose, initial, defaultDate = '' }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || defaultDate)

  const editing = !!initial
  const valid = title.trim() && date

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd({ title: title.trim(), date, kind: 'date' })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editing ? 'Edit date' : 'New date'}</h3>
        <p className="modal-sub">An important day to remember</p>

        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Athletics day"
              autoFocus
            />
          </label>

          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <div className="modal-actions">
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
