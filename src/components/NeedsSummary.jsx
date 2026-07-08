import ConfirmDelete from './ConfirmDelete'

// A packing list for a day: every "things you need" entry from that day's
// classes, split on commas, de-duplicated, with the classes that need each item.
export default function NeedsSummary({
  items,
  title = 'Things I need today',
  subtitle = "Pulled from today's classes — don't forget anything",
  emptyText = 'Nothing to bring today.',
  onRemove,
}) {
  // Roll all the "… Books" items into one combined line listing the subjects.
  const isBook = (label) => /books?\b/i.test(label)
  const bookItems = items.filter((it) => isBook(it.label))
  const otherItems = items.filter((it) => !isBook(it.label))
  const bookSubjects = bookItems
    .map((it) => it.label.replace(/\s*books?\b/i, '').trim())
    .filter(Boolean)

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          <p className="subtle">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <ul className="needs-list">
          {bookItems.length > 0 && (
            <li className="need-item">
              <span className="need-label">
                {bookItems.length} book{bookItems.length === 1 ? '' : 's'}
              </span>
              {bookSubjects.length > 0 && (
                <span className="need-right">
                  <span className="need-sources">{bookSubjects.join(' · ')}</span>
                </span>
              )}
            </li>
          )}
          {otherItems.map((it) => (
            <li key={it.label} className="need-item">
              <span className="need-label">{it.label}</span>
              <span className="need-right">
                {it.sources.length > 0 && (
                  <span className="need-sources">{it.sources.join(' · ')}</span>
                )}
                {it.bringId && onRemove && (
                  <ConfirmDelete
                    className="link-btn danger"
                    label={`Remove ${it.label}`}
                    onDelete={() => onRemove(it.bringId)}
                  />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
