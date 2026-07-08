import { keyToDate, toKey, WEEKDAYS_SHORT, MONTHS } from '../dateUtils'
import { subjectColor } from '../subjectColor'
import { gradeColor } from '../grades'
import { testMeta, isGradable } from '../eventMeta'
import { useExitAnimation } from '../useExitAnimation'
import ConfirmDelete from './ConfirmDelete'

// A short countdown label for a date-only key (handles past dates too).
function countdown(dateKey) {
  const today = keyToDate(toKey(new Date()))
  const target = keyToDate(dateKey)
  const days = Math.round((target - today) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days < 0) return `${-days}d ago`
  return `in ${days}d`
}

function prettyShort(dateKey) {
  const d = keyToDate(dateKey)
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

// Upcoming tests / important dates, soonest first. Checking one off removes it.
export default function UpcomingDates({
  events,
  onDismiss,
  onToggle,
  onEdit,
  onGrade,
  sectionClass = '',
  title = 'Important dates',
  subtitle = 'Tests & days further ahead',
}) {
  const { mark, leaving } = useExitAnimation()
  return (
    <section className={`card ${sectionClass}`}>
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          <p className="subtle">{subtitle}</p>
        </div>
      </div>
      <ul className="urgent-list">
        {events.map((e) => {
          const meta = testMeta(e)
          const gradable = onGrade && isGradable(e)
          const content = (
            <span className="event-text">
              <span className="event-title-row">
                <span className="task-title">{e.title}</span>
                {meta && (
                  <span className="type-badge" style={{ background: meta.color }}>{meta.label}</span>
                )}
                {e.subject && (
                  <span className="subject-badge" style={{ background: subjectColor(e.subject) }}>
                    {e.subject}
                  </span>
                )}
              </span>
              <span className="event-date">{prettyShort(e.date)}</span>
            </span>
          )
          return (
            <li key={e.id} className={`urgent-item ${e.done ? 'done' : ''} ${leaving(e.id) ? 'leaving' : ''}`}>
              {/* Checkbox only — it marks done (moves to Done) or, without
                  onToggle, dismisses. It never covers the title. */}
              <label className="task-check box-only">
                <input
                  type="checkbox"
                  checked={leaving(e.id) ? (onToggle ? !e.done : true) : (onToggle ? !!e.done : false)}
                  onChange={() =>
                    mark(e.id, () => (onToggle ? onToggle(e.id) : onDismiss(e.id)))
                  }
                />
              </label>
              {/* Tapping the row edits (when onEdit is given); otherwise it's
                  just static text — tapping it never toggles done. */}
              {onEdit ? (
                <button type="button" className="urgent-tap" onClick={() => onEdit(e)}>
                  {content}
                </button>
              ) : (
                content
              )}
              {gradable ? (
                e.result ? (
                  <button
                    type="button"
                    className="grade-tag"
                    style={{ background: gradeColor(e.result) }}
                    onClick={() => onGrade(e)}
                  >
                    {e.result}
                  </button>
                ) : (
                  <button type="button" className="grade-tag add" onClick={() => onGrade(e)}>
                    + Grade
                  </button>
                )
              ) : (
                <span className="due-badge">{countdown(e.date)}</span>
              )}
              {onToggle && (
                <ConfirmDelete
                  className="assignment-del"
                  label="Delete"
                  onDelete={() => onDismiss(e.id)}
                />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
