import { useState } from 'react'

// Add a note — a quick jot that stays pinned on Today until you delete it. An
// optional deadline turns it into a reminder (shows a countdown).
export default function NoteModal({ onAdd, onClose }) {
  const [text, setText] = useState('')
  const [due, setDue] = useState('')

  const valid = text.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd(text.trim(), due)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New note</h3>
        <p className="modal-sub">A quick jot — add a deadline to make it a reminder</p>

        <form onSubmit={handleSubmit}>
          <label>
            Note
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Bring permission slip to the office"
              rows={3}
              autoFocus
            />
          </label>

          <label>
            Remind by <span className="label-optional">(optional)</span>
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
