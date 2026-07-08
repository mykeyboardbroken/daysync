import { toKey, addDays, prettyDate, isToday } from '../dateUtils'
import { cycleDay } from '../schoolCalendar'
import { useWeather } from '../useWeather'
import { trainingWarnings } from '../trainingAlert'
import Icon from './Icon'
import DayPlan from './DayPlan'
import WeatherStrip from './WeatherStrip'
import NotesList from './NotesList'

// The day-focused view: today's date (+ cycle day), your plan for the day,
// notes, and the weather. Classes, packing & what's-due live on the School tab.
export default function TodayTab({ schedule }) {
  const date = new Date()
  const cycle = cycleDay(date)

  // Weather: after 8pm, switch to tomorrow's so you can plan the next day.
  const showTomorrowWeather = date.getHours() >= 20
  const weatherDate = showTomorrowWeather ? addDays(date, 1) : date

  const { byDate, status: weatherStatus } = useWeather()

  // Free heads-up: a training today that clashes with likely rain.
  const warnings = trainingWarnings(schedule, byDate?.[toKey(date)], date)

  return (
    <div className="tab-content">
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
    </div>
  )
}
