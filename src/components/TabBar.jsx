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
          {/* Inner span so the label can animate to its OWN width (see .tab-label). */}
          <span className="tab-label"><span>{t.label}</span></span>
        </button>
      ))}
    </nav>
  )
}
