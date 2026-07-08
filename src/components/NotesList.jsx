import { relativeDue } from '../dateUtils'
import ConfirmDelete from './ConfirmDelete'

// Quick notes so you don't forget things. A note with a deadline acts as a
// reminder (shows a countdown). They stay put until you delete them.
export default function NotesList({ notes, onDelete }) {
  const ordered = [...notes].sort((a, b) => {
    if (!a.due && !b.due) return 0
    if (!a.due) return 1
    if (!b.due) return -1
    return new Date(a.due) - new Date(b.due)
  })

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Notes</h2>
          <p className="subtle">Quick jots &amp; reminders — delete when done</p>
        </div>
      </div>
      <ul className="task-list">
        {ordered.map((n) => {
          const rel = n.due ? relativeDue(n.due) : null
          return (
            <li key={n.id} className="task note-row">
              <span className="task-title note-text">{n.text}</span>
              {rel && (
                <span className={`due-badge ${rel.overdue ? 'overdue' : ''}`}>{rel.label}</span>
              )}
              <ConfirmDelete className="link-btn danger" label="Delete note" onDelete={() => onDelete(n.id)} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
