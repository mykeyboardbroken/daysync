import { useState, useMemo } from 'react'
import { toKey, keyToDate, addDays, prettyDate, WEEKDAYS } from '../dateUtils'
import { prepDay, buildNeeds } from '../schoolDay'
import {
  publicHolidayOn,
  schoolBreakOn,
  nextSchoolDay,
  calendarNeedsUpdate,
  nextCalendarYear,
} from '../schoolCalendar'
import WeekStrip from './WeekStrip'
import Timetable from './Timetable'
import NeedsSummary from './NeedsSummary'
import Icon from './Icon'

// The School tab's "Classes" view: browse the timetable by day and see the
// packing list for it. After the last bell today it rolls forward to the next
// school day so you can get ready for it.
export default function ClassesTab({ schedule }) {
  const [dayKey, setDayKey] = useState(() => toKey(new Date()))
  const date = keyToDate(dayKey)

  const { rollForward, prepDate, prepCycle } = prepDay(date)
  const prepClasses = prepCycle ? (schedule.timetable[prepCycle] || {}) : {}
  const prepLabel = rollForward
    ? (toKey(prepDate) === toKey(addDays(date, 1)) ? 'Tomorrow' : WEEKDAYS[prepDate.getDay()])
    : null

  const todayKey = toKey(new Date())
  const prepKey = toKey(prepDate)
  const prepIsToday = prepKey === todayKey
  const prepIsTomorrow = prepKey === toKey(addDays(keyToDate(todayKey), 1))
  const prepDayName = prepIsToday ? 'today' : prepIsTomorrow ? 'tomorrow' : WEEKDAYS[prepDate.getDay()]

  const needs = useMemo(
    () => buildNeeds(prepClasses, schedule.bring, prepDate),
    [prepClasses, schedule.bring, prepKey],
  )

  function shiftWeek(delta) {
    setDayKey(toKey(addDays(keyToDate(dayKey), delta * 7)))
  }

  // No cycle day means no school — a weekend, a public holiday, or the term break.
  // The timetable and packing list both hide themselves, which used to leave the
  // page completely blank. Say what's going on instead.
  const noSchool = !prepCycle
  const pub = publicHolidayOn(prepDate)
  const brk = schoolBreakOn(prepDate)
  const weekend = prepDate.getDay() === 0 || prepDate.getDay() === 6
  const reason = pub || brk || (weekend ? 'Weekend' : 'No school')
  const nextUp = noSchool ? nextSchoolDay(prepDate) : null

  // Once we're past the last year we have term dates for, the timetable still works
  // (weekdays are assumed to be school days) but we can't know the holidays — so say so
  // out loud rather than showing a confidently wrong calendar.
  const staleCalendar = calendarNeedsUpdate(prepDate)

  return (
    <div className="tab-content">
      <WeekStrip selectedKey={dayKey} onSelect={setDayKey} onShiftWeek={shiftWeek} />

      {staleCalendar && (
        <section className="card warn-card">
          <div className="warn-head">
            <Icon name="calendar" size={18} /> {nextCalendarYear()} term dates needed
          </div>
          <p className="stale-cal-text">
            Your timetable still works, but DaySync doesn't know this year's term breaks
            or holidays yet — so a holiday might show as a normal school day. Ask whoever
            looks after the app to add them.
          </p>
        </section>
      )}

      {noSchool && (
        <section className="card empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <Icon name="sun" size={26} />
          </span>
          <h2 className="empty-state-title">No school {prepIsToday ? 'today' : 'that day'}</h2>
          <p className="empty-state-sub">{reason}. Enjoy it.</p>
          {nextUp && (
            <p className="empty-state-next">
              Back on {WEEKDAYS[nextUp.getDay()]} · {prettyDate(nextUp)}
            </p>
          )}
        </section>
      )}

      {prepCycle && (
        <NeedsSummary
          items={needs}
          title={`Pack for ${prepDayName}`}
          subtitle={
            prepIsToday
              ? "Pulled from your classes — don't forget anything"
              : `Packing for ${prepDayName} · ${prettyDate(prepDate)}`
          }
          emptyText={rollForward ? 'Nothing to bring.' : 'Nothing to bring today.'}
          onRemove={schedule.deleteBring}
        />
      )}

      <Timetable
        cycleDay={prepCycle}
        classes={prepClasses}
        note={prepLabel}
        onSave={schedule.saveClass}
        onClear={schedule.clearClass}
        onCopyDay={schedule.copyDay}
        onImport={schedule.importTimetable}
      />
    </div>
  )
}
