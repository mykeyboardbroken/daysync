import { useState, useMemo } from 'react'
import { toKey, keyToDate, addDays, prettyDate, WEEKDAYS } from '../dateUtils'
import { prepDay, buildNeeds } from '../schoolDay'
import WeekStrip from './WeekStrip'
import Timetable from './Timetable'
import NeedsSummary from './NeedsSummary'

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

  return (
    <div className="tab-content">
      <WeekStrip selectedKey={dayKey} onSelect={setDayKey} onShiftWeek={shiftWeek} />

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
