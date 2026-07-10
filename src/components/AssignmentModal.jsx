import { useState } from 'react'

// Create or edit an assignment: title, subject, and a due date. When `initial`
// is passed the form is prefilled and acts as an edit; otherwise it adds a new
// one. Title is required so the app can sort and flag it.
export default function AssignmentModal({ onAdd, onClose, initial, defaultKind = 'assignment' }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [subject, setSubject] = useState(initial?.subject || '')
  // Stored due is "YYYY-MM-DDT23:59"; the date input wants just the date part.
  const [due, setDue] = useState(initial?.due ? initial.due.slice(0, 10) : '')

  const kind = initial?.kind || defaultKind
  const noun = kind === 'homework' ? 'homework' : 'assignment'
  const editing = !!initial
  const valid = title.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    // Date only — pin to end of that day so it still counts down / sorts right
    // (kept as a local datetime string to avoid UTC drift).
    onAdd({ title: title.trim(), subject: subject.trim(), due: due ? `${due}T23:59` : '', kind })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editing ? `Edit ${noun}` : `New ${noun}`}</h3>
        <p className="modal-sub">What do you need to get done?</p>

        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 5 problem set"
              autoFocus
            />
          </label>

          <label>
            Subject
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Math (optional)"
            />
          </label>

          <label>
            Due <span className="label-optional">(optional)</span>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
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
