import { levelInfo } from '../gamify'
import Icon from './Icon'

// Compact progress card: your level (icon + name), an XP bar to the next level,
// and your login streak.
export default function LevelBar({ xp, loginStreak }) {
  const lv = levelInfo(xp)
  const pct = lv.need > 0 ? Math.round((lv.into / lv.need) * 100) : 100

  return (
    <section className="card level-card">
      <div className="level-top">
        <span className="level-badge"><Icon name={lv.icon} size={20} /></span>
        <div className="level-info">
          <span className="level-name">Lv {lv.level} · {lv.name}</span>
          <span className="level-xp">{lv.into} / {lv.need} XP</span>
        </div>
        {loginStreak > 0 && (
          <span className="level-streak" title="Login streak">
            <Icon name="flame" size={15} /> {loginStreak}
          </span>
        )}
      </div>
      <div className="level-bar">
        <div className="level-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}
