import { useState } from 'react'
import { GRADE_CODES, gradeColor } from '../grades'

// Add a single graded result to a subject's report card (title + grade).
export default function ResultModal({ subject, onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('A3')

  const valid = title.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd({ title: title.trim(), code })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add result</h3>
        <p className="modal-sub">{subject}</p>

        <form onSubmit={handleSubmit}>
          <label>
            Assessment
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Test"
              autoFocus
            />
          </label>

          <label>
            Grade
            <div className="grade-grid">
              {GRADE_CODES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`grade-chip ${code === c ? 'selected' : ''}`}
                  style={{ '--grade-color': gradeColor(c) }}
                  onClick={() => setCode(c)}
                >
                  <span className="grade-chip-code">{c}</span>
                </button>
              ))}
            </div>
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
