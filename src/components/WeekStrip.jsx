import { weekDays, keyToDate, toKey, isToday, WEEKDAYS_SHORT } from '../dateUtils'

// A one-week selector: 7 circles (Mon–Sun) for the week containing
// `selectedKey`. The chevrons flip to the previous/next week so you're never
// locked into a single week, without ever rendering a full-year calendar.
export default function WeekStrip({ selectedKey, onSelect, onShiftWeek }) {
  const days = weekDays(keyToDate(selectedKey))

  return (
    <div className="week-strip">
      <button className="week-arrow" onClick={() => onShiftWeek(-1)} aria-label="Previous week">‹</button>
      <div className="week-days">
        {days.map((day) => {
          const key = toKey(day)
          const classes = [
            'day-circle',
            key === selectedKey ? 'selected' : '',
            isToday(day) ? 'today' : '',
          ].filter(Boolean).join(' ')
          return (
            <button key={key} className={classes} onClick={() => onSelect(key)}>
              <span className="dc-date">{day.getDate()}</span>
              <span className="dc-weekday">{WEEKDAYS_SHORT[day.getDay()].charAt(0)}</span>
            </button>
          )
        })}
      </div>
      <button className="week-arrow" onClick={() => onShiftWeek(1)} aria-label="Next week">›</button>
    </div>
  )
}
