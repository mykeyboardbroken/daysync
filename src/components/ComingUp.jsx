import { useMemo, useState } from 'react'
import { toKey, keyToDate, isUrgent, relativeDue } from '../dateUtils'
import { testMeta } from '../eventMeta'
import { useExitAnimation } from '../useExitAnimation'
import AssignmentModal from './AssignmentModal'
import TestModal from './TestModal'
import DateModal from './DateModal'

// The "what's ahead" card: assignments due soon (next 48h) + every upcoming
// test/date (today onward). Tap a row to edit; tick the box to clear it.
export default function ComingUp({ schedule }) {
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const { mark, leaving } = useExitAnimation()

  const comingUp = useMemo(() => {
    const todayKey = toKey(new Date())
    const items = []
    for (const a of schedule.assignments) {
      if (isUrgent(a.due, a.done)) {
        items.push({ kind: 'assignment', id: a.id, sortAt: new Date(a.due).getTime(), assignment: a })
      }
    }
    for (const e of schedule.events) {
      if (e.done) continue
      const days = Math.round((keyToDate(e.date) - keyToDate(todayKey)) / 86400000)
      if (days >= 0) {
        items.push({ kind: 'event', id: e.id, sortAt: keyToDate(e.date).getTime(), event: e, days })
      }
    }
    return items.sort((x, y) => x.sortAt - y.sortAt)
  }, [schedule.assignments, schedule.events])

  return (
    <>
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Coming up</h2>
            <p className="subtle">Upcoming tests, dates & work due soon</p>
          </div>
        </div>
        {comingUp.length === 0 ? (
          <p className="empty">Nothing coming up.</p>
        ) : (
          <ul className="urgent-list">
            {comingUp.map((it) => {
              if (it.kind === 'assignment') {
                const rel = relativeDue(it.assignment.due)
                return (
                  <li key={it.id} className={`urgent-item ${leaving(it.id) ? 'leaving' : ''}`}>
                    <label className="task-check box-only">
                      <input
                        type="checkbox"
                        checked={leaving(it.id) ? !it.assignment.done : it.assignment.done}
                        onChange={() => mark(it.id, () => schedule.toggleAssignment(it.id))}
                      />
                    </label>
                    <button
                      type="button"
                      className="urgent-tap"
                      onClick={() => setEditingAssignment(it.assignment)}
                    >
                      <span className="task-title">{it.assignment.title}</span>
                    </button>
                    <span className={`due-badge ${rel.overdue ? 'overdue' : ''}`}>{rel.label}</span>
                  </li>
                )
              }
              const meta = testMeta(it.event)
              return (
                <li key={it.id} className={`urgent-item ${leaving(it.id) ? 'leaving' : ''}`}>
                  <label className="task-check box-only">
                    <input
                      type="checkbox"
                      checked={leaving(it.id)}
                      onChange={() => mark(it.id, () => schedule.toggleEvent(it.id))}
                    />
                  </label>
                  <button
                    type="button"
                    className="urgent-tap"
                    onClick={() => setEditingEvent(it.event)}
                  >
                    <span className="event-title-row">
                      <span className="task-title">{it.event.title}</span>
                      {meta && (
                        <span className="type-badge" style={{ background: meta.color }}>{meta.label}</span>
                      )}
                    </span>
                  </button>
                  <span className="due-badge">
                    {it.days === 0 ? 'Today' : it.days === 1 ? 'Tomorrow' : `in ${it.days}d`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {editingAssignment && (
        <AssignmentModal
          initial={editingAssignment}
          onAdd={(fields) => schedule.updateAssignment(editingAssignment.id, fields)}
          onClose={() => setEditingAssignment(null)}
        />
      )}

      {editingEvent && editingEvent.kind === 'test' && (
        <TestModal
          initial={editingEvent}
          onAdd={(fields) => schedule.updateEvent(editingEvent.id, fields)}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {editingEvent && editingEvent.kind !== 'test' && (
        <DateModal
          initial={editingEvent}
          onAdd={(fields) => schedule.updateEvent(editingEvent.id, fields)}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </>
  )
}
