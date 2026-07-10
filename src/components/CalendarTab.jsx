import { useState, useMemo } from 'react'
import { toKey, keyToDate, addDays, startOfWeek, prettyDate, MONTHS } from '../dateUtils'
import { cycleDay, publicHolidayOn, schoolBreakOn } from '../schoolCalendar'
import { testMeta } from '../eventMeta'
import { subjectColor } from '../subjectColor'
import Icon from './Icon'
import AddMenu from './AddMenu'
import DateModal from './DateModal'
import TaskModal from './TaskModal'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dueKey = (due) => (due ? due.slice(0, 10) : '')

// A month calendar of everything dated: tests/dates, assignments due, tasks due.
// Tap a day to see its items below.
export default function CalendarTab({ schedule }) {
  const todayKey = toKey(new Date())
  const [anchor, setAnchor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(todayKey)
  // Add flow for the selected day: null | 'menu' | 'date' | 'task'.
  const [adding, setAdding] = useState(null)

  // 6 weeks (Mon-start) covering the anchored month.
  const days = useMemo(() => {
    const start = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [anchor])

  // dateKey -> count of dated items, for the little dots.
  const countByDay = useMemo(() => {
    const m = {}
    const bump = (k) => { if (k) m[k] = (m[k] || 0) + 1 }
    for (const a of schedule.assignments) if (!a.done) bump(dueKey(a.due))
    for (const e of schedule.events) if (!e.done) bump(e.date)
    for (const t of schedule.tasks) if (!t.done) bump(dueKey(t.due))
    return m
  }, [schedule.assignments, schedule.events, schedule.tasks])

  const selDate = keyToDate(selectedKey)
  const selCycle = cycleDay(selDate)
  const selPublic = publicHolidayOn(selDate)
  const selBreak = schoolBreakOn(selDate)
  const dayTests = schedule.events.filter((e) => e.date === selectedKey)
  const dayAssignments = schedule.assignments.filter((a) => dueKey(a.due) === selectedKey)
  const dayTasks = schedule.tasks.filter((t) => dueKey(t.due) === selectedKey)
  const nothing = dayTests.length + dayAssignments.length + dayTasks.length === 0

  function shiftMonth(delta) {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1))
  }

  return (
    <div className="tab-content">
      <div className="cal-head">
        <span className="cal-title">{MONTHS[anchor.getMonth()]} {anchor.getFullYear()}</span>
        <div className="cal-nav">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month"><Icon name="chevronLeft" size={18} /></button>
          <button
            className="cal-today-btn"
            onClick={() => {
              const d = new Date()
              setAnchor(new Date(d.getFullYear(), d.getMonth(), 1))
              setSelectedKey(toKey(d))
            }}
          >
            Today
          </button>
          <button onClick={() => shiftMonth(1)} aria-label="Next month"><Icon name="chevronRight" size={18} /></button>
        </div>
      </div>

      <div className="cal-weekdays">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={w} className={`cal-weekday ${i >= 5 ? 'weekend' : ''}`}>{w}</span>
        ))}
      </div>

      <div className="cal-grid">
        {days.map((d) => {
          const key = toKey(d)
          const inMonth = d.getMonth() === anchor.getMonth()
          const count = countByDay[key] || 0
          const pub = publicHolidayOn(d)
          const brk = schoolBreakOn(d)
          const weekend = d.getDay() === 0 || d.getDay() === 6
          const classes = [
            'cal-day',
            inMonth ? '' : 'other',
            weekend ? 'weekend' : '',
            brk ? 'break' : '',
            pub ? 'public' : '',
            key === todayKey ? 'today' : '',
            key === selectedKey ? 'selected' : '',
          ].join(' ')
          return (
            <button key={key} className={classes} onClick={() => setSelectedKey(key)} title={pub || brk || ''}>
              {pub && <span className="cal-pub" aria-hidden="true" />}
              <span className="cal-num">{d.getDate()}</span>
              {count > 0 && (
                <span className="cal-dots">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className="cal-dot" />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="cal-legend">
        <span><span className="cal-legend-break" /> School holidays</span>
        <span><span className="cal-legend-pub" /> Public holiday</span>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>{prettyDate(selDate)}</h2>
            <p className="subtle">
              {selPublic
                ? `${selPublic} · public holiday`
                : selBreak
                  ? selBreak
                  : selCycle
                    ? `Day ${selCycle}`
                    : 'No school'}
            </p>
          </div>
          <button className="cal-add" onClick={() => setAdding('menu')} aria-label="Add to this day">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Add
          </button>
        </div>

        {nothing ? (
          <p className="empty">Nothing on this day.</p>
        ) : (
          <ul className="cal-items">
            {dayTests.map((e) => {
              const meta = testMeta(e)
              return (
                <li key={e.id} className="cal-item">
                  <span className="cal-item-title">{e.title}</span>
                  {meta && <span className="type-badge" style={{ background: meta.color }}>{meta.label}</span>}
                  {e.subject && (
                    <span className="subject-badge" style={{ background: subjectColor(e.subject) }}>{e.subject}</span>
                  )}
                </li>
              )
            })}
            {dayAssignments.map((a) => (
              <li key={a.id} className="cal-item">
                <span className="cal-item-title">{a.title}</span>
                <span className="cal-item-tag">Due</span>
                {a.subject && (
                  <span className="subject-badge" style={{ background: subjectColor(a.subject) }}>{a.subject}</span>
                )}
              </li>
            ))}
            {dayTasks.map((t) => (
              <li key={t.id} className="cal-item">
                <span className="cal-item-title">{t.title}</span>
                <span className="cal-item-tag">Task</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {adding === 'menu' && (
        <AddMenu context="calendar" onPick={setAdding} onClose={() => setAdding(null)} />
      )}
      {adding === 'date' && (
        <DateModal
          onAdd={schedule.addEvent}
          defaultDate={selectedKey}
          onClose={() => setAdding(null)}
        />
      )}
      {adding === 'task' && (
        <TaskModal
          onAdd={schedule.addTask}
          defaultDue={selectedKey}
          showStreaks={schedule.settings?.showStreaks}
          onClose={() => setAdding(null)}
        />
      )}
    </div>
  )
}
