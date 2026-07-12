import { useState, useEffect } from 'react'
import { toKey, addDays, prettyDate, isToday } from '../dateUtils'
import { cycleDay } from '../schoolCalendar'
import { bannerLine } from '../greeting'
import { dueAlerts, repeatLabel } from '../alerts'
import { useWeather } from '../useWeather'
import { trainingWarnings } from '../trainingAlert'
import Icon from './Icon'
import DayPlan from './DayPlan'
import WeatherStrip from './WeatherStrip'
import NotesList from './NotesList'
import LevelBar from './LevelBar'
import AlertModal from './AlertModal'

// The day-focused view: today's date (+ cycle day), your plan for the day,
// notes, and the weather. Classes, packing & what's-due live on the School tab.
export default function TodayTab({ schedule }) {
  const date = new Date()
  const cycle = cycleDay(date)
  const banner = bannerLine(date, schedule.profile?.name)

  // Re-check due reminders every 20s while the tab is open.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20000)
    return () => clearInterval(id)
  }, [])
  const [editingAlert, setEditingAlert] = useState(null)
  const due = dueAlerts(schedule.alerts, Date.now())

  // Weather: after 8pm, switch to tomorrow's so you can plan the next day.
  const showTomorrowWeather = date.getHours() >= 20
  const weatherDate = showTomorrowWeather ? addDays(date, 1) : date

  const { byDate, status: weatherStatus } = useWeather()

  // Free heads-up: a training that clashes with likely rain. After 8pm this
  // looks ahead to tomorrow (same as the weather line) so you can pack tonight.
  const warnings = trainingWarnings(
    schedule,
    byDate?.[toKey(weatherDate)],
    weatherDate,
    showTomorrowWeather,
  )

  return (
    <div className="tab-content">
      {due.length > 0 && (
        <div className="reminders">
          {due.map((a) => (
            <div key={a.id} className="reminder-banner">
              <Icon name="clock" size={17} className="reminder-icon" />
              <button type="button" className="reminder-text" onClick={() => setEditingAlert(a)}>
                <span className="reminder-title">{a.text}</span>
                {a.repeat > 0 && <span className="reminder-repeat">{repeatLabel(a.repeat)}</span>}
              </button>
              <button
                type="button"
                className="reminder-x"
                onClick={() => schedule.dismissAlert(a.id)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="today-top-row">
        <h1 className="greeting-main">{banner}</h1>
        <LevelBar xp={schedule.xp} loginStreak={schedule.loginStreak} />
      </div>

      <header className="today-header">
        <div className="th-left">
          <span className="th-date">{prettyDate(date)}</span>
          {isToday(date) && <span className="today-pill">Today</span>}
        </div>
        {cycle ? (
          <span className="cycle-badge">
            <span className="cycle-label">Day</span>
            <span className="cycle-num">{cycle}</span>
          </span>
        ) : (
          <span className="cycle-badge off">No school</span>
        )}
      </header>

      <WeatherStrip
        entry={byDate?.[toKey(weatherDate)]}
        status={weatherStatus}
        note={showTomorrowWeather ? 'Tomorrow' : null}
      />

      {warnings.length > 0 && (
        <section className="card warn-card">
          <div className="warn-head"><Icon name="cloudRain" size={18} /> Weather heads-up</div>
          <ul className="warn-list">
            {warnings.map((w, i) => (
              <li key={i}>
                <strong>{w.title}</strong> {w.when} — rain likely {w.label} ({w.peak}%). Take a raincoat.
              </li>
            ))}
          </ul>
        </section>
      )}

      <DayPlan schedule={schedule} />

      {schedule.notes.length > 0 && (
        <NotesList notes={schedule.notes} onDelete={schedule.deleteNote} />
      )}

      {editingAlert && (
        <AlertModal
          initial={editingAlert}
          onAdd={(fields) => schedule.updateAlert(editingAlert.id, fields)}
          onDelete={() => {
            schedule.deleteAlert(editingAlert.id)
            setEditingAlert(null)
          }}
          onClose={() => setEditingAlert(null)}
        />
      )}
    </div>
  )
}
