import { WEATHER_LOCATION, weatherAdvice } from '../useWeather'
import Icon from './Icon'

// A one-line "what to wear" weather note for the viewed day. Depends on the
// internet; degrades quietly when the forecast isn't available.
export default function WeatherStrip({ entry, status, note }) {
  if (status === 'loading') {
    return <p className="weather-strip subtle">Checking the weather…</p>
  }
  if (status === 'error') {
    return <p className="weather-strip subtle">Weather unavailable (offline?)</p>
  }
  if (!entry) {
    return <p className="weather-strip subtle">No forecast for this day.</p>
  }

  const a = weatherAdvice(entry)
  return (
    <div className="weather-strip">
      <span className="weather-emoji" aria-hidden="true"><Icon name={a.icon} size={22} /></span>
      <div className="weather-text">
        <div className="weather-line">
          {note && <span className="weather-when">{note}: </span>}
          {a.rain
            ? entry.rainWindow
              ? `Rain likely ${entry.rainWindow.label} (${entry.rainWindow.peak}%)`
              : `Rain likely (${entry.rainChance}%)`
            : 'Little rain expected'}
          {' · '}
          {Math.round(entry.min)}–{Math.round(entry.max)}° in {WEATHER_LOCATION.name}
        </div>
      </div>
    </div>
  )
}
