import { isToday } from './dateUtils'
import { isSchoolDay, nextSchoolDay, cycleDay, PERIODS } from './schoolCalendar'

// Which day to actually prep for. Once the last bell has gone on a school day
// you're viewing today, roll forward to the next school day so the timetable +
// packing list get you ready for it.
export function prepDay(date, now = new Date()) {
  const lastEnd = PERIODS[PERIODS.length - 1].end.split(':').map(Number)
  const pastLastBell = now.getHours() * 60 + now.getMinutes() >= lastEnd[0] * 60 + lastEnd[1]
  const rollForward = isToday(date) && isSchoolDay(date) && pastLastBell
  const prepDate = rollForward ? nextSchoolDay(date) : date
  return { rollForward, prepDate, prepCycle: cycleDay(prepDate) }
}

// Roll every class's "things you need" into one de-duplicated packing list,
// tracking which classes need each item, then fold in the user's extra "to
// bring" items (a repeating item only shows on its weekdays).
export function buildNeeds(prepClasses, bring, prepDate) {
  const map = new Map()
  for (const [periodId, cls] of Object.entries(prepClasses)) {
    if (!cls?.needs) continue
    const source = cls.subject || PERIODS.find((p) => p.id === periodId)?.label || ''
    cls.needs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((item) => {
        const key = item.toLowerCase()
        if (!map.has(key)) map.set(key, { label: item, sources: [], bringId: null })
        const entry = map.get(key)
        if (source && !entry.sources.includes(source)) entry.sources.push(source)
      })
  }
  const prepWeekday = prepDate.getDay()
  for (const b of bring) {
    if (b.days && b.days.length > 0 && !b.days.includes(prepWeekday)) continue
    const key = b.item.toLowerCase()
    if (!map.has(key)) {
      map.set(key, { label: b.item, sources: b.subject ? [b.subject] : [], bringId: b.id })
    } else {
      const entry = map.get(key)
      entry.bringId = b.id
      if (b.subject && !entry.sources.includes(b.subject)) entry.sources.push(b.subject)
    }
  }
  return [...map.values()]
}
