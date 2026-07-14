import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'

// Slide the hue, keep saturation/lightness fixed → always a pleasant accent.
function hslToHex(h, s, l) {
  const sN = s / 100
  const lN = l / 100
  const a = sN * Math.min(lN, 1 - lN)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const c = lN - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Recover the hue (0–360) from a hex colour, to position the slider.
function hexToHue(hex) {
  const h = (hex || '').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return 240
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return 240
  let hue
  if (max === r) hue = ((g - b) / d) % 6
  else if (max === g) hue = (b - r) / d + 2
  else hue = (r - g) / d + 4
  hue *= 60
  return ((Math.round(hue) % 360) + 360) % 360 // always 0–359
}

// Curated accent colours — tap-to-pick so they always look
// good, no fiddling with the OS colour dialog.
const PALETTE = [
  '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#22c55e',
  '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7',
]

// Top-level settings categories. Add more here; each opens its own panel.
const SECTIONS = [
  { key: 'appearance', label: 'Appearance', icon: 'palette' },
  { key: 'today', label: 'Today screen', icon: 'sun' },
  { key: 'tasks', label: 'Tasks', icon: 'check' },
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'exercise', label: 'Exercise', icon: 'activity' },
  { key: 'feedback', label: 'Feedback', icon: 'mail' },
  { key: 'backup', label: 'Backup', icon: 'file' },
  { key: 'about', label: 'About', icon: 'star' },
]

export const APP_VERSION = '1.0'

// Where feedback emails go (the app maker).
const FEEDBACK_EMAIL = 'briankimnz@gmail.com'

const SPORT_OPTIONS = [
  'Football / Soccer',
  'Basketball',
  'Rugby',
  'Netball',
  'Running / Athletics',
  'Cricket',
  'Swimming',
  'Tennis',
  'Volleyball',
  'Badminton',
  'Hockey',
  'Dance',
]
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Night', 'Anytime', "I don't"]

export default function SettingsModal({
  customColors,
  onSetCustomColor,
  settings,
  onSetSetting,
  profile = {},
  onSetProfile,
  onExport,
  onImport,
  onReset,
  account = null,
  onSignOut,
}) {
  const toggleProfileArr = (key, opt) => {
    const cur = profile[key] || []
    onSetProfile(key, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt])
  }

  // One switch row. `fallback` is what the setting means when it's never been set —
  // the show/hide options default to ON, so an existing user doesn't suddenly lose
  // their weather or greeting when this ships.
  const toggleRow = (key, label, hint, fallback = false) => {
    const on = settings?.[key] ?? fallback
    return (
      <button type="button" className="toggle-row" onClick={() => onSetSetting(key, !on)}>
        <span className="toggle-text">
          <span className="toggle-label">{label}</span>
          <span className="toggle-hint">{hint}</span>
        </span>
        <span className={`toggle ${on ? 'on' : ''}`}>
          <span className="toggle-knob" />
        </span>
      </button>
    )
  }
  const [section, setSection] = useState(null)
  const [backupMsg, setBackupMsg] = useState('')
  const [feedback, setFeedback] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef(null)

  function sendFeedback() {
    const body = encodeURIComponent(feedback.trim())
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('DaySync feedback')}&body=${body}`
  }

  // The hue slider tracks its own position so dragging is smooth (deriving it
  // from the colour each render makes the thumb snap, since 0° and 360° are the
  // same red). The effect only re-syncs on EXTERNAL colour changes (e.g. a preset
  // swatch); slider-driven changes are ignored so they never interrupt a drag.
  const [hue, setHue] = useState(() => hexToHue(customColors?.primary))
  const hueFromSlider = useRef(false)
  useEffect(() => {
    if (hueFromSlider.current) {
      hueFromSlider.current = false
      return
    }
    setHue(hexToHue(customColors?.primary))
  }, [customColors?.primary])

  const current = SECTIONS.find((s) => s.key === section)

  function handleExport() {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const d = new Date()
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const filename = `daysync-backup-${stamp}.json`

    // On iOS, a share sheet is the only thing that reliably gets a file OUT of an
    // installed PWA — a plain <a download> often does nothing there. Use it when the
    // browser says it can share files, and fall back to a normal download elsewhere.
    const file = new File([blob], filename, { type: 'application/json' })
    if (navigator.canShare?.({ files: [file] })) {
      navigator
        .share({ files: [file], title: 'DaySync backup' })
        .then(() => setBackupMsg('Backup shared. Keep it somewhere safe.'))
        .catch(() => setBackupMsg('')) // user cancelled the sheet — say nothing
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    // The anchor must be IN the document for the click to count in some browsers, and
    // the object URL must outlive the click — revoking it on the next line (as this
    // used to) cancels the download in Safari.
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    setBackupMsg('Backup saved to your downloads.')
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file later
    if (!file) return
    if (!window.confirm('Replace ALL current data with this backup? This cannot be undone.')) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = onImport(String(reader.result))
      setBackupMsg(ok ? 'Backup restored.' : "Couldn't read that file — is it a valid backup?")
    }
    reader.onerror = () => setBackupMsg("Couldn't read that file.")
    reader.readAsText(file)
  }

  return (
    <div className="tab-content settings-tab">
      {current ? (
        <>
          <div className="settings-head">
            <button className="settings-back" onClick={() => setSection(null)} aria-label="Back">
              <Icon name="chevronLeft" size={20} />
            </button>
            <h3>{current.label}</h3>
          </div>

            {section === 'appearance' && (
              <div className="color-pickers">
                <p className="settings-field-label">Background</p>
                <div className="type-select repeat-select habit-days">
                  {[
                    { key: 'dark', label: 'Dark' },
                    { key: 'bright', label: 'Bright' },
                  ].map((b) => (
                    <button
                      type="button"
                      key={b.key}
                      className={`type-option ${(customColors?.base || 'dark') === b.key ? 'selected' : ''}`}
                      onClick={() => onSetCustomColor('base', b.key)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <p className="settings-field-label">Accent colour</p>
                <div className="swatch-grid">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`swatch ${customColors?.primary === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => onSetCustomColor('primary', c)}
                      aria-label={`Accent ${c}`}
                    />
                  ))}
                </div>

                <p className="settings-field-label">Custom colour</p>
                <div className="hue-row">
                  <span className="hue-preview" style={{ background: customColors?.primary }} />
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    className="hue-slider"
                    value={hue}
                    onChange={(e) => {
                      const h = Number(e.target.value)
                      hueFromSlider.current = true
                      setHue(h)
                      onSetCustomColor('primary', hslToHex(h, 72, 58))
                    }}
                    aria-label="Accent hue"
                  />
                </div>

                <p className="settings-section-head">Display</p>
                <div className="settings-menu">
                  {toggleRow('clock24', '24-hour time', 'Show 14:30 instead of 2:30 PM')}
                  {toggleRow(
                    'reduceMotion',
                    'Reduce motion',
                    'Turn off the sliding and fading animations',
                  )}
                </div>
              </div>
            )}

            {section === 'tasks' && (
              <button
                type="button"
                className="toggle-row"
                onClick={() => onSetSetting('showStreaks', !settings?.showStreaks)}
              >
                <span className="toggle-text">
                  <span className="toggle-label">Show streaks</span>
                  <span className="toggle-hint">Count days in a row on repeating tasks</span>
                </span>
                <span className={`toggle ${settings?.showStreaks ? 'on' : ''}`}>
                  <span className="toggle-knob" />
                </span>
              </button>
            )}

            {section === 'today' && (
              <div className="settings-menu">
                {toggleRow(
                  'showGreeting',
                  'Greeting',
                  'The "Morning, Brian" line at the top',
                  true,
                )}
                {toggleRow(
                  'showLevel',
                  'Level & XP',
                  'The level chip and your day streak',
                  true,
                )}
                {toggleRow(
                  'showWeather',
                  'Weather',
                  "Today's forecast under the date",
                  true,
                )}
              </div>
            )}

            {section === 'about' && (
              <div className="color-pickers">
                <div className="about-mark" aria-hidden="true">
                  <Icon name="checkmark" size={26} />
                </div>
                <h3 className="about-name">DaySync</h3>
                <p className="about-version">Version {APP_VERSION}</p>
                <p className="settings-field-label about-blurb">
                  Your school day and your life in one place — timetable, homework, grades,
                  routines, reminders and a focus timer.
                </p>
                <p className="settings-field-label">
                  Everything lives on your own device. No tracking, no ads, and nothing is
                  sent anywhere unless you export it yourself.
                </p>
                <button
                  type="button"
                  className="settings-row"
                  onClick={() => setSection('feedback')}
                >
                  <span className="settings-row-icon"><Icon name="mail" size={17} /></span>
                  <span className="settings-row-label">Send feedback</span>
                  <Icon name="chevronRight" size={18} className="settings-chevron" />
                </button>
              </div>
            )}

            {section === 'profile' && (
              <div className="color-pickers">
                {account && (
                  <>
                    <p className="settings-field-label">Account</p>
                    <div className="account-card">
                      <span className="account-avatar" aria-hidden="true">
                        <Icon name="user" size={18} />
                      </span>
                      <span className="account-meta">
                        <span className="account-name">{account.username || 'Signed in'}</span>
                        <span className="account-email">{account.email}</span>
                      </span>
                    </div>
                    <p className="settings-field-label">
                      Your data syncs to this account, so it follows you to any device you sign in on.
                    </p>
                    <button type="button" className="ghost-btn auth-signout" onClick={onSignOut}>
                      Sign out
                    </button>
                  </>
                )}

                <p className="settings-field-label">Personal information</p>
                <label className="study-field">
                  Name
                  <input
                    type="text"
                    value={profile.name || ''}
                    placeholder="First name or nickname"
                    onChange={(e) => onSetProfile('name', e.target.value)}
                  />
                </label>

                <p className="settings-field-label">Gender</p>
                <div className="type-select repeat-select habit-days">
                  {['Male', 'Female', 'Other', 'Rather not say'].map((g) => (
                    <button
                      type="button"
                      key={g}
                      className={`type-option ${profile.gender === g ? 'selected' : ''}`}
                      onClick={() => onSetProfile('gender', g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <label className="study-field">
                  Age
                  <input
                    type="number"
                    value={profile.age || ''}
                    placeholder="Your age"
                    onChange={(e) => onSetProfile('age', e.target.value)}
                  />
                </label>

                {[
                  { key: 'weight', label: 'Weight', units: ['kg', 'lb'], ph: 'e.g. 70' },
                  { key: 'height', label: 'Height', units: ['cm', 'ft'], ph: 'e.g. 175' },
                ].map((f) => (
                  <label className="study-field" key={f.key}>
                    {f.label}
                    <span className="field-with-unit">
                      <input
                        type="text"
                        value={profile[f.key] || ''}
                        placeholder={f.ph}
                        onChange={(e) => onSetProfile(f.key, e.target.value)}
                      />
                      <span className="survey-units">
                        {f.units.map((u) => (
                          <button
                            key={u}
                            type="button"
                            className={`survey-unit ${(profile[`${f.key}Unit`] || f.units[0]) === u ? 'selected' : ''}`}
                            onClick={() => onSetProfile(`${f.key}Unit`, u)}
                          >
                            {u}
                          </button>
                        ))}
                      </span>
                    </span>
                  </label>
                ))}

              </div>
            )}

            {/* Exercise: workout AND sport training in one place. Both are opt-in —
                nothing appears on your day until a time is picked below. */}
            {section === 'exercise' && (
              <div className="color-pickers">
                <p className="settings-field-label">
                  All optional. Nothing shows on your day until you pick a time — leave
                  this alone and DaySync stays a plain planner.
                </p>

                <p className="settings-section-head">Workout</p>
                <p className="settings-field-label">Off by default.</p>

                {/* The whole workout lives behind this one switch. Off, and it does not
                    exist anywhere in the app — no task, no time picker, nothing. */}
                <div className="settings-menu">
                  <button
                    type="button"
                    className="toggle-row"
                    onClick={() =>
                      onSetProfile('workoutTime', profile.workoutTime ? '' : 'Night')
                    }
                  >
                    <span className="toggle-text">
                      <span className="toggle-label">Show a workout on my day</span>
                      <span className="toggle-hint">Adds a daily bodyweight session</span>
                    </span>
                    <span className={`toggle ${profile.workoutTime ? 'on' : ''}`}>
                      <span className="toggle-knob" />
                    </span>
                  </button>
                </div>

                {profile.workoutTime && (
                  <>
                    <p className="settings-field-label">When</p>
                    <div className="type-select repeat-select habit-days">
                      {['Morning', 'Afternoon', 'Night', 'Anytime'].map((o) => (
                        <button
                          type="button"
                          key={o}
                          className={`type-option ${profile.workoutTime === o ? 'selected' : ''}`}
                          onClick={() => onSetProfile('workoutTime', o)}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="settings-section-head">Sport training</p>
                <p className="settings-field-label">
                  Drills for the sports you play, one sport a day. Rate your skills on the
                  task itself and the drills lean toward what you're weak at.
                </p>

                <p className="settings-field-label">Sports you play</p>
                <div className="type-select repeat-select habit-days">
                  {SPORT_OPTIONS.map((o) => (
                    <button
                      type="button"
                      key={o}
                      className={`type-option ${(profile.sports || []).includes(o) ? 'selected' : ''}`}
                      onClick={() => toggleProfileArr('sports', o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>

                {/* Always shown. Hiding this until a sport was picked made the option
                    look like it didn't exist — you'd open Exercise, see a "When" for the
                    workout and none for sport, and assume it was missing. */}
                <p className="settings-field-label">
                  When{' '}
                  {(profile.sports || []).length === 0 && (
                    <span className="label-optional">— pick a sport above to use this</span>
                  )}
                </p>
                <div className="type-select repeat-select habit-days">
                  {TIME_OPTIONS.map((o) => (
                    <button
                      type="button"
                      key={o}
                      className={`type-option ${profile.sportTime === o ? 'selected' : ''}`}
                      onClick={() => onSetProfile('sportTime', o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {section === 'feedback' && (
              <div className="color-pickers">
                <p className="settings-field-label">
                  What do you like, what's missing, any bugs? This opens your email app to send it.
                </p>
                <textarea
                  className="feedback-input"
                  rows={5}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Your feedback…"
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={sendFeedback}
                  disabled={!feedback.trim()}
                >
                  Send feedback
                </button>
              </div>
            )}

            {section === 'backup' && (
              <div className="settings-menu">
                <button type="button" className="settings-row" onClick={handleExport}>
                  <span className="settings-row-icon"><Icon name="file" size={17} /></span>
                  <span className="settings-row-label">Export backup</span>
                  <Icon name="chevronRight" size={18} className="settings-chevron" />
                </button>
                <button type="button" className="settings-row" onClick={() => fileRef.current?.click()}>
                  <span className="settings-row-icon"><Icon name="upload" size={17} /></span>
                  <span className="settings-row-label">Import backup</span>
                  <Icon name="chevronRight" size={18} className="settings-chevron" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportFile}
                  hidden
                />
                <p className="settings-field-label">
                  {backupMsg || 'Export saves all your data as a file. Import replaces everything with a backup.'}
                </p>

                <button
                  type="button"
                  className="settings-row settings-row-danger"
                  onClick={() => setConfirmReset(true)}
                >
                  <span className="settings-row-icon"><Icon name="trash" size={17} /></span>
                  <span className="settings-row-label">Reset everything</span>
                  <Icon name="chevronRight" size={18} className="settings-chevron" />
                </button>
                <p className="settings-field-label">
                  Erases all your tasks, grades, timetable and settings on this device, and starts
                  you back at the intro survey. Export a backup first if you want to keep anything.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="settings-menu">
            {SECTIONS.map((s) => (
              <button key={s.key} className="settings-row" onClick={() => setSection(s.key)}>
                <span className="settings-row-icon"><Icon name={s.icon} size={17} /></span>
                <span className="settings-row-label">{s.label}</span>
                <Icon name="chevronRight" size={18} className="settings-chevron" />
              </button>
            ))}
          </div>
        )}

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reset everything?</h3>
            <p className="modal-sub">
              This erases every task, grade, timetable entry, reminder and setting on this device,
              and takes you back to the intro survey. It can't be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <span className="spacer" />
              <button type="button" className="danger-btn" onClick={onReset}>
                Reset everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
