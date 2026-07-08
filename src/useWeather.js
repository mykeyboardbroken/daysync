import { useState, useEffect } from 'react'

// Where to fetch weather for. Change these to your city (find lat/long by
// searching "<city> latitude longitude"). Default: Auckland, New Zealand.
export const WEATHER_LOCATION = {
  name: 'Auckland',
  latitude: -36.8485,
  longitude: 174.7633,
}

// Fetches a multi-day daily forecast once (Open-Meteo — free, no API key) and
// returns it keyed by local "YYYY-MM-DD" so a day can be looked up by dayKey.
export function useWeather() {
  const [byDate, setByDate] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    const { latitude, longitude } = WEATHER_LOCATION
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&hourly=precipitation_probability' +
      '&timezone=auto&forecast_days=16'

    let cancelled = false
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('weather request failed')
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        // Group hourly rain-chance by day so we can find WHEN it'll rain.
        const hoursByDay = {}
        const h = data.hourly
        if (h && h.time) {
          h.time.forEach((t, i) => {
            const date = t.slice(0, 10)
            const hour = parseInt(t.slice(11, 13), 10)
            ;(hoursByDay[date] ||= []).push({ hour, prob: h.precipitation_probability[i] })
          })
        }

        const d = data.daily
        const map = {}
        d.time.forEach((date, i) => {
          map[date] = {
            code: d.weather_code[i],
            max: d.temperature_2m_max[i],
            min: d.temperature_2m_min[i],
            rainChance: d.precipitation_probability_max[i],
            rainWindow: rainWindow(hoursByDay[date] || []),
          }
        })
        setByDate(map)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { byDate, status }
}

// Format an hour window like "2–5pm" (collapses am/pm when they match).
function fmtHour12(h) {
  return { hh: h % 12 || 12, p: h >= 12 ? 'pm' : 'am' }
}
function fmtWindow(start, end) {
  const s = fmtHour12(start)
  const e = fmtHour12(end)
  return s.p === e.p ? `${s.hh}–${e.hh}${e.p}` : `${s.hh}${s.p}–${e.hh}${e.p}`
}

// From a day's hourly rain chances, find WHEN rain is likely: the longest run of
// hours at/above 50%, returned as { label: "2–5pm", peak }. Null if it's dry.
function rainWindow(hours) {
  const wet = hours.filter((x) => x.prob >= 50).sort((a, b) => a.hour - b.hour)
  if (!wet.length) return null
  const runs = [[wet[0]]]
  for (let i = 1; i < wet.length; i++) {
    if (wet[i].hour - wet[i - 1].hour <= 1) runs[runs.length - 1].push(wet[i])
    else runs.push([wet[i]])
  }
  runs.sort((a, b) => b.length - a.length)
  const run = runs[0]
  return {
    label: fmtWindow(run[0].hour, run[run.length - 1].hour + 1),
    peak: Math.max(...run.map((x) => x.prob)),
    start: run[0].hour,
    end: run[run.length - 1].hour + 1,
  }
}

// An Icon name for a WMO weather code (grouped roughly).
export function weatherIcon(code) {
  if (code === 0) return 'sun'
  if (code <= 3) return 'cloud'
  if (code <= 48) return 'cloudFog'
  if (code <= 67) return 'cloudRain'
  if (code <= 77) return 'cloudSnow'
  if (code <= 82) return 'cloudRain'
  if (code <= 86) return 'cloudSnow'
  return 'cloudLightning'
}

// Just the bits the strip shows: is it rainy, and which icon.
export function weatherAdvice(entry) {
  return { rain: entry.rainChance >= 50, icon: weatherIcon(entry.code) }
}
