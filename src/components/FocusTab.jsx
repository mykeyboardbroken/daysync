import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'

const PRESETS = [30, 60, 120]

// "30 min" / "1 hr" / "1h 30m"
const fmt = (m) => (m % 60 === 0 ? `${m / 60} hr` : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`)

// A focus (Pomodoro-style) timer. A browser can't actually block other apps, so
// this keeps you honest instead: your "avoid" list stays in view, it notices
// when you leave mid-session, and it rewards finishing with XP.
export default function FocusTab({ schedule }) {
  const [minutes, setMinutes] = useState(30)
  const [secondsLeft, setSecondsLeft] = useState(30 * 60)
  const [running, setRunning] = useState(false)
  const [leftCount, setLeftCount] = useState(0)
  const [doneMsg, setDoneMsg] = useState('')
  const [newItem, setNewItem] = useState('')
  const [controls, setControls] = useState(false) // exit button visibility in full screen
  const endRef = useRef(0)
  const hideRef = useRef(null)

  const distractions = schedule.focusDistractions || []
  const total = minutes * 60
  const pct = Math.min(100, Math.max(0, ((total - secondsLeft) / total) * 100))
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  // Tick from a target end-time so background-tab throttling can't drift it.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const left = Math.round((endRef.current - Date.now()) / 1000)
      if (left <= 0) {
        setSecondsLeft(0)
        setRunning(false)
        schedule.completeFocusSession(minutes)
        setDoneMsg(`Nice — ${fmt(minutes)} of focus! +${minutes} XP`)
        setSecondsLeft(minutes * 60)
      } else {
        setSecondsLeft(left)
      }
    }, 250)
    return () => clearInterval(id)
  }, [running, minutes, schedule])

  // Notice when the user leaves the app during a session.
  useEffect(() => {
    if (!running) return
    const onVis = () => document.hidden && setLeftCount((c) => c + 1)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [running])

  function start() {
    setDoneMsg('')
    setLeftCount(0)
    setControls(false)
    endRef.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }

  // Tap the full-screen: briefly show the exit button, then hide it again.
  function revealControls() {
    setControls(true)
    clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => setControls(false), 3000)
  }
  function pause() {
    setRunning(false)
  }
  function reset() {
    setRunning(false)
    setSecondsLeft(minutes * 60)
    setDoneMsg('')
  }
  function pick(m) {
    setMinutes(m)
    setSecondsLeft(m * 60)
    setRunning(false)
    setDoneMsg('')
  }

  function addItem(e) {
    e.preventDefault()
    const t = newItem.trim()
    if (!t) return
    schedule.setFocusDistractions([...distractions, t])
    setNewItem('')
  }
  const removeItem = (i) => schedule.setFocusDistractions(distractions.filter((_, j) => j !== i))

  return (
    <div className="tab-content">
      <section className="card focus-card">
        <div className="focus-ring" style={{ '--pct': pct }}>
          <div className="focus-inner">
            <span className="focus-time">{mm}:{ss}</span>
            <span className="focus-sub">{running ? 'Stay with it' : `${fmt(minutes)} session`}</span>
          </div>
        </div>

        {!running && (
          <div className="focus-setup">
            <div className="focus-presets">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`type-option ${minutes === m ? 'selected' : ''}`}
                  onClick={() => pick(m)}
                >
                  {fmt(m)}
                </button>
              ))}
            </div>
            <div className="focus-slider-row">
              <input
                type="range"
                min="5"
                max="180"
                step="5"
                value={minutes}
                onChange={(e) => pick(Number(e.target.value))}
                className="focus-slider"
                aria-label="Custom focus time"
              />
              <span className="focus-slider-val">{fmt(minutes)}</span>
            </div>
          </div>
        )}

        <div className="focus-actions">
          {!running ? (
            <button type="button" className="primary-btn focus-start" onClick={start}>
              {secondsLeft < total ? 'Resume' : 'Start focusing'}
            </button>
          ) : (
            <>
              <button type="button" className="ghost-btn" onClick={reset}>Give up</button>
              <button type="button" className="primary-btn" onClick={pause}>Pause</button>
            </>
          )}
        </div>

        {running && leftCount > 0 && (
          <p className="focus-warn">You left {leftCount} time{leftCount === 1 ? '' : 's'} — get back to it 👀</p>
        )}
        {doneMsg && <p className="focus-done">{doneMsg}</p>}
        <p className="focus-total">{schedule.focusMinutes || 0} min focused all-time</p>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Stay away from</h2>
            <p className="subtle">The apps &amp; sites you're avoiding this session</p>
          </div>
        </div>

        {distractions.length > 0 ? (
          <ul className="focus-list">
            {distractions.map((d, i) => (
              <li key={i} className="focus-item">
                <span>{d}</span>
                <button
                  type="button"
                  className="focus-del"
                  onClick={() => removeItem(i)}
                  aria-label={`Remove ${d}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Add the apps or sites that usually distract you.</p>
        )}

        <form className="focus-add" onSubmit={addItem}>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="e.g. Instagram, YouTube…"
          />
          <button type="submit" className="primary-btn" disabled={!newItem.trim()}>Add</button>
        </form>

        <p className="focus-note">
          <Icon name="settings" size={13} /> Heads-up: this can't force-close apps — for real blocking use your
          phone's Screen Time / Digital Wellbeing. This keeps you honest and rewards focus.
        </p>
      </section>

      {running && (
        <div className="focus-fullscreen" onClick={revealControls}>
          <span className="focus-fs-time">{mm}:{ss}</span>
          {controls && (
            <button
              type="button"
              className="focus-fs-exit"
              onClick={(e) => {
                e.stopPropagation()
                pause()
              }}
              aria-label="Exit focus"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}
