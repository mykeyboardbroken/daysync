// Which reminders are currently "due" — their latest occurrence has arrived and
// hasn't been dismissed. Repeating ones fire every `repeat` minutes until `endDate`.
export function dueAlerts(alerts, now = Date.now()) {
  return (alerts || []).filter((a) => {
    const start = new Date(a.start).getTime()
    if (Number.isNaN(start) || now < start) return false
    if (a.endDate) {
      const end = new Date(`${a.endDate}T23:59`).getTime()
      if (now > end) return false
    }
    let occurrence = start
    if (a.repeat && a.repeat > 0) {
      const k = Math.floor((now - start) / (a.repeat * 60000))
      occurrence = start + k * a.repeat * 60000
    }
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
