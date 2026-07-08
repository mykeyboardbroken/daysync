const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'school', label: 'Academics' },
  { key: 'calendar', label: 'Calendar' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`tab ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
