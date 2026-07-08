import { useState } from 'react'
import { TEST_TYPES } from '../eventMeta'

// Add or edit a test: an assessment or an exam (exam = higher importance).
// Carries an optional subject so its grade rolls up per subject. Pass `initial`
// to edit an existing test instead of adding a new one.
export default function TestModal({ onAdd, onClose, initial }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || '')
  const [subject, setSubject] = useState(initial?.subject || '')
  const [testType, setTestType] = useState(initial?.testType || 'assessment')

  const editing = !!initial
  const valid = title.trim() && date

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onAdd({ title: title.trim(), date, subject: subject.trim(), kind: 'test', testType })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editing ? 'Edit test' : 'New test'}</h3>
        <p className="modal-sub">Track it, then record how it went</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            Type
            <div className="type-select">
              {Object.entries(TEST_TYPES).map(([key, meta]) => (
                <button
                  type="button"
                  key={key}
                  className={`type-option ${testType === key ? 'selected' : ''}`}
                  style={{ '--type-color': meta.color }}
                  onClick={() => setTestType(key)}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
          <p className="type-hint">Exams count as higher importance than assessments.</p>

          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Algebra unit test"
              autoFocus
            />
          </label>

          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label>
            Subject <span className="label-optional">(optional)</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Maths — lets grades group by subject"
            />
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
