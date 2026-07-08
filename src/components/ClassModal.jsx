import { useState } from 'react'
import { PERIODS, CYCLE_DAYS } from '../schoolCalendar'
import { formatTime } from '../dateUtils'

// Add/edit the class in one period slot of a cycle day: subject, room, and
// anything to bring. When `lockSlot` is set (editing a specific row) the day and
// period are fixed; otherwise they're pickable (adding from the + menu).
export default function ClassModal({ lockSlot, initial, onSave, onDelete, onClose }) {
  const [cycleDay, setCycleDay] = useState(initial?.cycleDay ?? CYCLE_DAYS[0])
  const [periodId, setPeriodId] = useState(initial?.periodId ?? PERIODS[0].id)
  const [subject, setSubject] = useState(initial?.subject || '')
  const [room, setRoom] = useState(initial?.room || '')
  const [needs, setNeeds] = useState(initial?.needs || '')

  const period = PERIODS.find((p) => p.id === periodId)
  const needsSubject = !period.noSubject
  // Subject-less slots (Tutor) just need a room; real classes need a subject.
  const valid = needsSubject ? subject.trim() : room.trim()
  const editing = !!(initial && (initial.subject || initial.room || initial.needs))

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    onSave(Number(cycleDay), periodId, {
      subject: needsSubject ? subject.trim() : '',
      room: room.trim(),
      needs: needs.trim(),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editing ? 'Edit class' : 'Add class'}</h3>
        {lockSlot ? (
          <p className="modal-sub">
            {period.shared
              ? `${period.label} · ${formatTime(period.start)}–${formatTime(period.end)} · same room every day`
              : `Day ${cycleDay} · ${period.label} · ${formatTime(period.start)}–${formatTime(period.end)}`}
          </p>
        ) : (
          <p className="modal-sub">Which day and period is it?</p>
        )}

        <form onSubmit={handleSubmit}>
          {!lockSlot && (
            <div className="field-row">
              <label>
                Cycle day
                <select value={cycleDay} onChange={(e) => setCycleDay(e.target.value)}>
                  {CYCLE_DAYS.map((d) => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </label>
              <label>
                Period
                <select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
                  {PERIODS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({formatTime(p.start)}–{formatTime(p.end)})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {needsSubject && (
            <label>
              Subject
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                autoFocus
              />
            </label>
          )}

          <label>
            Room
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder={needsSubject ? 'e.g. B12 (optional)' : 'e.g. B12'}
              autoFocus={!needsSubject}
            />
          </label>

          <label>
            Things you need
            <input
              type="text"
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              placeholder="e.g. laptop, calculator (optional)"
            />
          </label>

          <div className="modal-actions">
            {editing && onDelete && (
              <button type="button" className="danger-btn" onClick={onDelete}>Remove</button>
            )}
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
