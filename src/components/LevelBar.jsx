import { useState } from 'react'
import { levelInfo, LEVEL_TIERS } from '../gamify'
import Icon from './Icon'

// Compact top-right chip; tap to open a details modal (progress, streak, tiers).
export default function LevelBar({ xp, loginStreak }) {
  const [open, setOpen] = useState(false)
  const lv = levelInfo(xp)
  const pct = lv.need > 0 ? Math.min(100, Math.round((lv.into / lv.need) * 100)) : 100
  const remaining = Math.max(0, lv.need - lv.into)
  const maxed = lv.level >= LEVEL_TIERS.length
  const nextName = maxed ? null : LEVEL_TIERS[lv.level].name
  const currentTier = Math.min(lv.level, LEVEL_TIERS.length)

  return (
    <>
      <button
        type="button"
        className="level-chip"
        onClick={() => setOpen(true)}
        title={`Lv ${lv.level} ${lv.name}`}
      >
        <span className="level-chip-badge" style={{ '--pct': pct }}>
          <Icon name={lv.icon} size={13} />
        </span>
        <span className="level-chip-lv">Lv {lv.level}</span>
        {loginStreak > 0 && (
          <span className="level-chip-streak"><Icon name="flame" size={12} /> {loginStreak}</span>
        )}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="level-modal-head">
              <span className="level-modal-badge" style={{ '--pct': pct }}>
                <Icon name={lv.icon} size={30} />
              </span>
              <div>
                <h3>Level {lv.level} · {lv.name}</h3>
                <p className="modal-sub" style={{ margin: 0 }}>
                  {maxed ? 'Max tier reached 🎉' : `${remaining} XP to Lv ${lv.level + 1} · ${nextName}`}
                </p>
              </div>
            </div>

            <div className="level-bar">
              <div className="level-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="level-modal-stats">
              {lv.into} / {lv.need} XP this level · {lv.total} XP total
              {loginStreak > 0 && <> · <Icon name="flame" size={13} /> {loginStreak}-day streak</>}
            </p>

            <p className="settings-field-label">Levels</p>
            <div className="tier-ladder">
              {LEVEL_TIERS.map((t, i) => {
                const lvl = i + 1
                const unlocked = lv.level >= lvl
                const current = currentTier === lvl
                return (
                  <div key={t.name} className={`tier-row ${unlocked ? 'unlocked' : ''} ${current ? 'current' : ''}`}>
                    <span className="tier-icon"><Icon name={t.icon} size={16} /></span>
                    <span className="tier-name">{t.name}</span>
                    <span className="tier-lv">Lv {lvl}</span>
                  </div>
                )
              })}
            </div>

            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="primary-btn" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
