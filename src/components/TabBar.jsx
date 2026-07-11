import Icon from './Icon'

const TABS = [
  { key: 'today', label: 'Today', icon: 'sun' },
  { key: 'school', label: 'Academics', icon: 'book' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'focus', label: 'Focus', icon: 'clock' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`tab ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
          aria-label={t.label}
        >
          <Icon name={t.icon} size={20} />
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
