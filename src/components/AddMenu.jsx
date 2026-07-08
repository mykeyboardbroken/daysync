import Icon from './Icon'

// The "+" entry point. The options shown depend on which tab you're on: school
// things on the School tab, personal things on Today/Life.
const OPTIONS = {
  assignment: { icon: 'book', label: 'Assignment', hint: 'Schoolwork with a deadline' },
  test: { icon: 'cap', label: 'Test', hint: 'An assessment or exam — track its grade' },
  bring: { icon: 'bag', label: 'To bring', hint: 'Extra items for your packing list' },
  task: { icon: 'check', label: 'Task', hint: 'A to-do — set it to repeat for a routine' },
  date: { icon: 'calendar', label: 'Date', hint: 'An important day to remember' },
  note: { icon: 'note', label: 'Note', hint: 'A quick jot — add a deadline for a reminder' },
}

// Which kinds show per context.
const MENUS = {
  school: ['assignment', 'test', 'bring'],
  personal: ['task', 'date', 'note'],
  calendar: ['date', 'task'], // only things that land on a day
}

export default function AddMenu({ context = 'personal', onPick, onClose }) {
  const kinds = MENUS[context] || MENUS.personal
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add</h3>
        <p className="modal-sub">
          {context === 'school' ? 'Academics' : context === 'calendar' ? 'Calendar' : 'Personal'} — what do
          you want to add?
        </p>

        <div className="add-menu">
          {kinds.map((kind) => {
            const o = OPTIONS[kind]
            return (
              <button key={kind} className="add-menu-item" onClick={() => onPick(kind)}>
                <span className="add-menu-icon" aria-hidden="true"><Icon name={o.icon} size={22} /></span>
                <span className="add-menu-text">
                  <span className="add-menu-label">{o.label}</span>
                  <span className="add-menu-hint">{o.hint}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="modal-actions">
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
