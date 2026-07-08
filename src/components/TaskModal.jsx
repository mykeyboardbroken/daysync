import { useState, useRef, useLayoutEffect } from 'react'
import { BUCKET_OPTIONS } from '../dayParts'
import { HABIT_WEEKDAYS } from '../habits'
import { TASK_CATEGORIES } from '../taskCategories'
import Icon from './Icon'

// Create or edit a task. A task is either one-off (an optional due date) or
// repeating (a routine on a weekday schedule — blank = every day — that builds a
// streak). Toggle "Repeat" to switch between the two. Pass `initial` to edit.
export default function TaskModal({
  onAdd,
  onClose,
  initial,
  defaultBucket = '',
  defaultDue = '',
  showStreaks = false,
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [due, setDue] = useState(initial?.due ? initial.due.slice(0, 10) : defaultDue)
  const [bucket, setBucket] = useState(initial?.bucket ?? defaultBucket)
  const [category, setCategory] = useState(initial?.category || '')
  const [repeat, setRepeat] = useState(!!initial?.repeat)
  const [days, setDays] = useState(initial?.days || [])

  const editing = !!initial
  const valid = title.trim() && category

  // Grow the description box to fit its text so it never shows a scrollbar.
  const descRef = useRef(null)
  useLayoutEffect(() => {
    const el = descRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [description])

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    const desc = description.trim()
    if (repeat) {
      onAdd({ title: title.trim(), description: desc, bucket, category, repeat: true, days })
    } else {
      onAdd({ title: title.trim(), description: desc, bucket, category, repeat: false, due: due ? `${due}T23:59` : '' })
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editing ? 'Edit task' : 'New task'}</h3>
        <p className="modal-sub">
          {repeat
            ? showStreaks
              ? 'A routine to keep up — build a streak'
              : 'A routine to keep up'
            : 'Something to get done'}
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Task
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={repeat ? 'e.g. Practice piano' : 'e.g. Clean my room'}
              autoFocus
            />
          </label>

          <label>
            Description <span className="label-optional">(optional)</span>
            <textarea
              ref={descRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra details…"
              rows={2}
            />
          </label>

          <div className="field">
            What's it for?
            <div className="type-select repeat-select habit-days">
              {TASK_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  className={`type-option ${category === c.key ? 'selected' : ''}`}
                  onClick={() => setCategory(c.key)}
                >
                  <Icon name={c.icon} size={15} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            Time of day
            <div className="type-select repeat-select habit-days">
              {BUCKET_OPTIONS.map((b) => (
                <button
                  type="button"
                  key={b.key || 'any'}
                  className={`type-option ${bucket === b.key ? 'selected' : ''}`}
                  onClick={() => setBucket(b.key)}
                >
                  <Icon name={b.icon} size={15} /> {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            Repeat
            <div className="type-select repeat-select habit-days">
              <button
                type="button"
                className={`type-option ${!repeat ? 'selected' : ''}`}
                onClick={() => setRepeat(false)}
              >
                <Icon name="check" size={15} /> One-off
              </button>
              <button
                type="button"
                className={`type-option ${repeat ? 'selected' : ''}`}
                onClick={() => setRepeat(true)}
              >
                <Icon name="repeat" size={15} /> Repeats
              </button>
            </div>
          </div>

          {repeat ? (
            <div className="field">
              On <span className="label-optional">(blank = every day)</span>
              <div className="type-select repeat-select day-grid">
                {HABIT_WEEKDAYS.map((w) => (
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
          ) : (
            <label>
              Date <span className="label-optional">(optional)</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
          )}

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
