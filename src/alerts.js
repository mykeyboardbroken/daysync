// Which reminders are currently "due" — their latest occurrence has arrived and
// hasn't been dismissed. Repeating ones fire every `repeat` minutes until `endDate`.
// The most recent time this reminder should have fired, at or before `now`.
//
// Intervals of a day or more are stepped with CALENDAR arithmetic, not fixed
// milliseconds. A "daily" reminder is 1440 minutes, but a day is not always 1440
// minutes long — when the clocks change, adding a fixed 86,400,000 ms shifts a 7am
// reminder to 6am (or 8am) and it stays wrong forever after. NZ changes the clocks
// twice a year, so this would hit every user. Sub-day intervals ("every 45 min")
// genuinely are fixed durations, so those stay as simple arithmetic.
function lastOccurrence(startMs, repeatMins, now) {
  if (!repeatMins || repeatMins <= 0) return startMs
  if (repeatMins < 1440) {
    const k = Math.floor((now - startMs) / (repeatMins * 60000))
    return startMs + k * repeatMins * 60000
  }
  const stepDays = Math.round(repeatMins / 1440)
  const d = new Date(startMs)
  let occurrence = startMs
  // Walk forward in calendar days, keeping the wall-clock time of day intact.
  // Bounded so a corrupt start date can't spin forever.
  for (let i = 0; i < 4000; i++) {
    const next = new Date(d)
    next.setDate(next.getDate() + stepDays)
    if (next.getTime() > now) break
    d.setDate(d.getDate() + stepDays)
    occurrence = d.getTime()
  }
  return occurrence
}

export function dueAlerts(alerts, now = Date.now()) {
  return (alerts || []).filter((a) => {
    const start = new Date(a.start).getTime()
    if (Number.isNaN(start) || now < start) return false
    if (a.endDate) {
      const end = new Date(`${a.endDate}T23:59`).getTime()
      if (now > end) return false
    }
    const occurrence = lastOccurrence(start, a.repeat, now)
    return (a.ackUntil || 0) < occurrence
  })
}

// Human label for a repeat interval (minutes).
export function repeatLabel(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `every ${minutes} min`
  if (minutes === 60) return 'hourly'
  if (minutes < 1440) return `every ${minutes / 60} hr`
  if (minutes === 1440) return 'daily'
  if (minutes === 10080) return 'weekly'
  return `every ${Math.round(minutes / 1440)} days`
}
