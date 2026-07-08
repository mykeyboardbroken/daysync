import { useState } from 'react'
import { formatTime } from '../dateUtils'
import { PERIODS, CYCLE_DAYS } from '../schoolCalendar'
import ClassModal from './ClassModal'
import TimetableImportModal from './TimetableImportModal'
import Icon from './Icon'

// The timetable for the current cycle day. Period slots are fixed; each holds a
// class (subject / room / things needed) that you tap to fill or edit. On a
// no-school day there's no cycle, so there's nothing to show.
export default function Timetable({ cycleDay, classes, note, onSave, onClear, onCopyDay, onImport }) {
  const [editing, setEditing] = useState(null) // period being edited, or null
  const [copyFrom, setCopyFrom] = useState('')
  const [importing, setImporting] = useState(false)

  const uploadBtn = onImport && (
    <button className="tt-upload-btn" onClick={() => setImporting(true)}><Icon name="upload" size={15} /> Upload</button>
  )
  const importModal = importing && onImport && (
    <TimetableImportModal onImport={onImport} onClose={() => setImporting(false)} />
  )

  // No school (weekend / holiday) → hide the timetable entirely.
  if (!cycleDay) return null

  const isEmpty = PERIODS.every((p) => !classes[p.id])

  function handleSave(cd, periodId, cls) {
    onSave(cd, periodId, cls)
    setEditing(null)
  }

  function handleCopy(e) {
    const from = e.target.value
    setCopyFrom('')
    if (from === '') return
    onCopyDay(Number(from), cycleDay)
  }

  // Other cycle days you can copy a timetable from.
  const copyable = CYCLE_DAYS.filter((d) => d !== cycleDay)

  return (
    <section className="card timetable">
      <div className="card-header">
        <div>
          <h2>Timetable</h2>
          <p className="subtle">{note ? `${note} · ` : ''}Day {cycleDay}</p>
        </div>
        {uploadBtn}
      </div>

      <ol className="period-list">
        {PERIODS.map((p) => {
          const cls = classes[p.id]
          // Subject-less slots (Tutor) title as "<label> Class" with the room in the
          // meta line, just like a real class shows its subject then room.
          const primary = cls ? (cls.subject || `${p.label} Class`) : ''
          const showRoomInMeta = cls && cls.room
          const addLabel = p.noSubject ? '+ Set room' : '+ Add class'
          return (
            <li key={p.id} className={`period-row ${cls ? '' : 'empty-slot'}`}>
              <div className="period-slot">
                <span className="period-label">{p.label}</span>
                <span className="period-time">{formatTime(p.start)}–{formatTime(p.end)}</span>
              </div>

              {cls ? (
                <button
                  className="period-fill"
                  onClick={() => setEditing(p)}
                  aria-label={`Edit ${p.label}`}
                >
                  <span className="period-subject">{primary}</span>
                  {(showRoomInMeta || cls.needs) && (
                    <span className="period-meta">
                      {showRoomInMeta && <span>Room {cls.room}</span>}
                      {cls.needs && <span className={showRoomInMeta ? 'dot' : ''}>{cls.needs}</span>}
                    </span>
                  )}
                </button>
              ) : (
                <button className="period-add" onClick={() => setEditing(p)}>{addLabel}</button>
              )}
            </li>
          )
        })}
      </ol>

      {isEmpty && onCopyDay && copyable.length > 0 && (
        <label className="copy-row">
          Copy from another day:
          <select value={copyFrom} onChange={handleCopy}>
            <option value="">Choose a day…</option>
            {copyable.map((d) => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>
        </label>
      )}

      {editing && (
        <ClassModal
          lockSlot
          initial={{ cycleDay, periodId: editing.id, ...(classes[editing.id] || {}) }}
          onSave={handleSave}
          onDelete={
            classes[editing.id]
              ? () => {
                  onClear(cycleDay, editing.id)
                  setEditing(null)
                }
              : undefined
          }
          onClose={() => setEditing(null)}
        />
      )}

      {importModal}
    </section>
  )
}
