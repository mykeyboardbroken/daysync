import { levelInfo } from '../gamify'
import Icon from './Icon'

// A small top-right chip: level icon (with an XP-progress ring), "Lv N", and the
// login streak — compact so it stays out of the way of the plan.
export default function LevelBar({ xp, loginStreak }) {
  const lv = levelInfo(xp)
  const pct = lv.need > 0 ? Math.min(100, Math.round((lv.into / lv.need) * 100)) : 100

  return (
    <div className="level-chip" title={`Lv ${lv.level} ${lv.name} — ${lv.into}/${lv.need} XP`}>
      <span className="level-chip-badge" style={{ '--pct': pct }}>
        <Icon name={lv.icon} size={13} />
      </span>
      <span className="level-chip-lv">Lv {lv.level}</span>
      {loginStreak > 0 && (
        <span className="level-chip-streak"><Icon name="flame" size={12} /> {loginStreak}</span>
      )}
    </div>
  )
}
