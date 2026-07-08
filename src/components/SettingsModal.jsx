import { useState, useRef } from 'react'
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
  return Math.round(hue < 0 ? hue + 360 : hue)
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
  { key: 'tasks', label: 'Tasks', icon: 'check' },
  { key: 'backup', label: 'Backup', icon: 'file' },
]

export default function SettingsModal({
  customColors,
  onSetCustomColor,
  settings,
  onSetSetting,
  onExport,
  onImport,
  onClose,
}) {
  const [section, setSection] = useState(null)
  const [backupMsg, setBackupMsg] = useState('')
  const fileRef = useRef(null)

  const current = SECTIONS.find((s) => s.key === section)

  function handleExport() {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const d = new Date()
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMsg('Backup downloaded.')
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                    className="hue-slider"
                    value={hexToHue(customColors?.primary)}
                    onChange={(e) => onSetCustomColor('primary', hslToHex(Number(e.target.value), 72, 58))}
                    aria-label="Accent hue"
                  />
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

            {section === 'backup' && (
              <div className="color-pickers">
                <button type="button" className="settings-row" onClick={handleExport}>
                  <Icon name="file" size={18} />
                  <span className="settings-row-label">Export backup</span>
                  <Icon name="chevronRight" size={18} className="settings-chevron" />
                </button>
                <button type="button" className="settings-row" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={18} />
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
              </div>
            )}
          </>
        ) : (
          <>
            <h3>Settings</h3>
            <div className="settings-menu">
              {SECTIONS.map((s) => (
                <button key={s.key} className="settings-row" onClick={() => setSection(s.key)}>
                  <Icon name={s.icon} size={18} />
                  <span className="settings-row-label">{s.label}</span>
                  <Icon name="chevronRight" size={18} className="settings-chevron" />
                </button>
              ))}
            </div>
          </>
        )}

        <div className="modal-actions">
          <span className="spacer" />
          <button type="button" className="primary-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
