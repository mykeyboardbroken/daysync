import { useState, useMemo } from 'react'
import { dueLabel } from '../dateUtils'
import { subjectColor } from '../subjectColor'
import { useExitAnimation } from '../useExitAnimation'
import UpcomingDates from './UpcomingDates'
import GradeModal from './GradeModal'
import AssignmentModal from './AssignmentModal'
import TestModal from './TestModal'
import ConfirmDelete from './ConfirmDelete'

// Reminders/notes live on the Today tab; grades live on the Report tab. This hub
// is just the schoolwork to do: assignments and tests.
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'homework', label: 'Homework' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'tests', label: 'Tests' },
  { key: 'done', label: 'Done' },
]

// A hub for the schoolwork you've added: assignments, tests, and a grades
// summary — with a tag bar at the top to filter by type.
export default function AssignmentsTab({ schedule }) {
  const [filter, setFilter] = useState('all')
  const [gradingTest, setGradingTest] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [editingTest, setEditingTest] = useState(null)
  const { mark, leaving } = useExitAnimation()
  const show = (k) => filter === 'all' || filter === k

  const assignments = useMemo(() => {
    return [...schedule.assignments].sort((a, b) => {
      if (!a.due) return 1
      if (!b.due) return -1
      return new Date(a.due) - new Date(b.due)
    })
  }, [schedule.assignments])

  // Active vs finished, split out so "Done" collects the ticked-off ones and the
  // main lists stay focused on what's still to do. Homework and assignments are
  // the same shape, told apart by `kind`.
  const activeHomework = useMemo(
    () => assignments.filter((a) => !a.done && a.kind === 'homework'),
    [assignments],
  )
  const activeAssignments = useMemo(
    () => assignments.filter((a) => !a.done && a.kind !== 'homework'),
    [assignments],
  )
  const doneAssignments = useMemo(() => assignments.filter((a) => a.done), [assignments])

  const events = useMemo(
    () => [...schedule.events].sort((a, b) => a.date.localeCompare(b.date)),
    [schedule.events],
  )

  // Tests/dates also split active vs done, so checking one off moves it to Done
  // rather than deleting it.
  const activeEvents = useMemo(() => events.filter((e) => !e.done), [events])
  const doneEvents = useMemo(() => events.filter((e) => e.done), [events])

  const hasHomework = show('homework') && activeHomework.length > 0
  const hasAssignments = show('assignments') && activeAssignments.length > 0
  const hasTests = show('tests') && activeEvents.length > 0
  // Done lives only under its own filter — not in "All" — so the hub stays
  // focused on what's still outstanding.
  const hasDone = filter === 'done' && (doneAssignments.length > 0 || doneEvents.length > 0)
  const nothing = !(hasHomework || hasAssignments || hasTests || hasDone)

  // One row renderer shared by the active list and the Done list. Tapping the
  // card edits it; the checkbox (done) and ✕ (delete) stop the click from
  // bubbling up so they keep their own behaviour.
  const renderAssignment = (a) => {
    const due = dueLabel(a.due)
    return (
      <li
        key={a.id}
        className={`assignment tappable ${a.done ? 'done' : ''} ${leaving(a.id) ? 'leaving' : ''}`}
        onClick={() => setEditingAssignment(a)}
      >
        <label className="assignment-check" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={leaving(a.id) ? !a.done : a.done}
            onChange={() => mark(a.id, () => schedule.toggleAssignment(a.id))}
          />
          <span className="checkmark" />
        </label>
        <div className="assignment-body">
          <span className="assignment-title">{a.title}</span>
          {a.subject && (
            <span className="subject-badge" style={{ background: subjectColor(a.subject) }}>
              {a.subject}
            </span>
          )}
        </div>
        {!a.done && <span className={`assignment-due tone-${due.tone}`}>{due.text}</span>}
        <ConfirmDelete
          className="assignment-del"
          label="Delete assignment"
          onDelete={() => schedule.deleteAssignment(a.id)}
        />
      </li>
    )
  }

  return (
    <div className="tab-content">
      <header className="today-header">
        <span className="th-date">Assignments</span>
        <span className="subtle">{schedule.assignments.filter((a) => !a.done).length} to do</span>
      </header>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-tag ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {hasHomework && (
        <section className="card">
          <div className="card-header">
            <div><h2>Homework</h2></div>
          </div>
          <ul className="assignment-list">{activeHomework.map(renderAssignment)}</ul>
        </section>
      )}

      {hasAssignments && (
        <section className="card">
          <div className="card-header">
            <div><h2>Assignments</h2></div>
          </div>
          <ul className="assignment-list">{activeAssignments.map(renderAssignment)}</ul>
        </section>
      )}

      {hasTests && (
        <UpcomingDates
          events={activeEvents}
          onDismiss={schedule.deleteEvent}
          onToggle={schedule.toggleEvent}
          onEdit={setEditingTest}
          onGrade={setGradingTest}
          title="Tests & dates"
          subtitle="Tap to edit · check off when done · tap the grade to record it"
        />
      )}

      {hasDone && doneAssignments.length > 0 && (
        <section className="card done-list">
          <div className="card-header">
            <div>
              <h2>Done</h2>
              <p className="subtle">{doneAssignments.length} completed — untick to bring one back</p>
            </div>
          </div>
          <ul className="assignment-list">{doneAssignments.map(renderAssignment)}</ul>
        </section>
      )}

      {hasDone && doneEvents.length > 0 && (
        <UpcomingDates
          events={doneEvents}
          onDismiss={schedule.deleteEvent}
          onToggle={schedule.toggleEvent}
          onEdit={setEditingTest}
          onGrade={setGradingTest}
          sectionClass="done-list"
          title="Done tests & dates"
          subtitle="Untick to bring one back · tap the grade to record it"
        />
      )}

      {nothing && (
        <div className="card">
          <p className="empty">
            Nothing here yet — tap the + button to add {filter === 'all' ? 'something' : filter}.
          </p>
        </div>
      )}

      {gradingTest && (
        <GradeModal
          test={gradingTest}
          current={gradingTest.result}
          onPick={(code) => schedule.setEventResult(gradingTest.id, code)}
          onClose={() => setGradingTest(null)}
        />
      )}

      {editingAssignment && (
        <AssignmentModal
          initial={editingAssignment}
          onAdd={(fields) => schedule.updateAssignment(editingAssignment.id, fields)}
          onClose={() => setEditingAssignment(null)}
        />
      )}

      {editingTest && (
        <TestModal
          initial={editingTest}
          onAdd={(fields) => schedule.updateEvent(editingTest.id, fields)}
          onClose={() => setEditingTest(null)}
        />
      )}
    </div>
  )
}
