import { relativeDue } from '../dateUtils'
import { reminderPending, isRecurring, repeatLabel } from '../reminders'
import ConfirmDelete from './ConfirmDelete'

// Things to do, pinned to the Today tab. One-offs vanish when checked; recurring
// ones (🔁) reset for the next period instead. Completed-this-period recurring
// reminders are hidden until they're due again, so the list only shows what's
// actually pending right now. An optional deadline shows as a countdown.
export default function RemindersList({ reminders, onComplete, onDelete }) {
  const ordered = reminders
    .filter((r) => reminderPending(r))
    .sort((a, b) => {
      if (!a.due && !b.due) return 0
      if (!a.due) return 1
      if (!b.due) return -1
      return new Date(a.due) - new Date(b.due)
    })

  if (ordered.length === 0) return null

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>🔔 Reminders</h2>
          <p className="subtle">Check off when done</p>
        </div>
      </div>
      <ul className="task-list">
        {ordered.map((r) => {
          const rel = r.due ? relativeDue(r.due) : null
          const recurring = isRecurring(r)
          return (
            <li key={r.id} className="task">
              <label className="task-check">
                <input type="checkbox" checked={false} onChange={() => onComplete(r.id)} />
                <span className="task-title">{r.text}</span>
              </label>
              {recurring && <span className="repeat-badge">🔁 {repeatLabel(r.repeat)}</span>}
              {rel && (
                <span className={`due-badge ${rel.overdue ? 'overdue' : ''}`}>{rel.label}</span>
              )}
              {recurring && (
                <ConfirmDelete
                  className="assignment-del"
                  label="Delete reminder"
                  onDelete={() => onDelete(r.id)}
                />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
