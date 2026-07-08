import { useState, useMemo } from 'react'
import { subjectColor } from '../subjectColor'
import { averageGrades, gradeColor } from '../grades'
import PdfImportModal from './PdfImportModal'
import ResultModal from './ResultModal'
import ConfirmDelete from './ConfirmDelete'
import Icon from './Icon'

// The sections a report card can show; each has an on/off toggle.
const SECTIONS = [
  { key: 'grades', label: 'Grades' },
  { key: 'progress', label: 'Progress' },
  { key: 'teacher', label: 'Teacher & email' },
  { key: 'dispositions', label: 'Dispositions' },
  { key: 'extras', label: 'Co-curricular' },
]

const norm = (s) => (s || '').trim().toLowerCase()

// Trend arrow from the first to the last term average.
function trend(termAverages) {
  if (termAverages.length < 2) return ''
  const first = termAverages[0].value
  const last = termAverages[termAverages.length - 1].value
  if (last > first) return '↑'
  if (last < first) return '↓'
  return '→'
}

// One card per subject = its imported report (if any) merged with hand-added
// results (graded events) for that subject. Subjects that only have hand-added
// grades still get a card.
function buildCards(reports, events) {
  const graded = events.filter((e) => e.result && (e.subject || '').trim())
  const cards = reports.map((r) => ({
    id: r.id,
    subject: r.subject,
    report: r,
    manual: graded.filter((e) => norm(e.subject) === norm(r.subject)),
  }))
  const covered = new Set(reports.map((r) => norm(r.subject)))
  const extras = new Map()
  for (const e of graded) {
    const key = norm(e.subject)
    if (covered.has(key)) continue
    if (!extras.has(key)) extras.set(key, { id: `s-${key}`, subject: e.subject.trim(), report: null, manual: [] })
    extras.get(key).manual.push(e)
  }
  return [...cards, ...extras.values()]
}

function ReportCard({ card, settings, editing, onAddResult, onDeleteResult, onDeleteReport }) {
  const { report, subject, manual } = card
  const imported = report ? report.results : []
  const rows = [
    ...imported.map((r, i) => ({ key: `i${i}`, title: r.title, code: r.code, removable: false })),
    ...manual.map((e) => ({ key: e.id, title: e.title, code: e.result, id: e.id, removable: true })),
  ]
  const avg = averageGrades(rows.map((r) => r.code))
  const termAverages = report?.termAverages || []
  const dispositions = report?.dispositions || []
  // Report fills Term 1, 2, … up to now, then an Overall column last. So the
  // last value is Overall and the rest are terms in order.
  const hasOverall = termAverages.length >= 2
  const progTerms = hasOverall ? termAverages.slice(0, -1) : termAverages
  const progOverall = hasOverall ? termAverages[termAverages.length - 1] : null

  return (
    <section className="card report-card">
      <div className="card-header">
        <div className="report-title">
          <span className="subject-badge report-subject" style={{ background: subjectColor(subject) }}>
            {subject}
          </span>
          {settings.grades && avg && (
            <span className="grade-avg-badge" style={{ background: gradeColor(avg.nearest.code) }}>
              {avg.nearest.code}
              <span className="grade-avg-num">avg {avg.avg}</span>
            </span>
          )}
        </div>
        {editing && report && (
          <ConfirmDelete
            className="assignment-del"
            label="Delete report"
            onDelete={() => onDeleteReport(report.id)}
          />
        )}
      </div>

      {settings.teacher && report && (report.teacher || report.email) && (
        <p className="report-meta">
          {report.teacher && <span><Icon name="user" size={15} /> {report.teacher}</span>}
          {report.email && <span><Icon name="mail" size={15} /> {report.email}</span>}
        </p>
      )}

      {settings.progress && termAverages.length > 0 && (
        <div className="report-progress">
          <span className="report-section-label">Progress {trend(progTerms)}</span>
          <div className="report-terms">
            {progTerms.map((t, i) => (
              <span key={i} className="report-term">
                <span className="report-term-label">Term {i + 1}</span>
                <span className="report-term-grade">{t.label}</span>
              </span>
            ))}
            {progOverall && (
              <span className="report-term report-term-overall">
                <span className="report-term-label">Overall</span>
                <span className="report-term-grade">{progOverall.label}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {settings.grades && (
        <>
          {rows.length > 0 ? (
            <ul className="report-results">
              {rows.map((r) => (
                <li key={r.key} className="report-result">
                  <span className="report-result-title">{r.title}</span>
                  <span className="grade-tag" style={{ background: gradeColor(r.code) }}>{r.code}</span>
                  {editing && r.removable && (
                    <ConfirmDelete
                      className="report-result-del"
                      label="Remove result"
                      onDelete={() => onDeleteResult(r.id)}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="subtle report-empty">Not assessed yet.</p>
          )}
          {editing && (
            <button className="add-result-btn" onClick={() => onAddResult(subject)}>+ Add result</button>
          )}
        </>
      )}

      {settings.dispositions && dispositions.length > 0 && (
        <ul className="report-dispositions">
          {dispositions.map((d, i) => (
            <li key={i}>
              <span className="report-disp-name">{d.name}</span>
              <span className="report-disp-value">{d.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function ReportTab({ schedule }) {
  const [importing, setImporting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [addingTo, setAddingTo] = useState(null) // subject name we're adding a result to
  const [addingExtra, setAddingExtra] = useState(null) // 'service' | 'activities' | null
  const [extraText, setExtraText] = useState('')
  const [editing, setEditing] = useState(false)
  const { reports, reportSettings, events, extras } = schedule

  const cards = useMemo(() => buildCards(reports, events), [reports, events])
  const hasExtras = extras && (extras.service.length > 0 || extras.activities.length > 0)

  return (
    <div className="tab-content">
      <header className="today-header">
        <span className="th-date">Report</span>
        <div className="report-header-actions">
          {editing && (reports.length > 0 || hasExtras) && (
            <button className="ghost-btn danger" onClick={() => setConfirmClear(true)}>
              Clear all
            </button>
          )}
          {editing && (
            <button className="ghost-btn" onClick={() => setImporting(true)}>+ Add report</button>
          )}
          <button
            className={editing ? 'primary-btn' : 'ghost-btn'}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </header>

      <div className="report-toggles">
        <span className="subtle">Show:</span>
        {SECTIONS.map((s) => (
          <label key={s.key} className="report-toggle">
            <input
              type="checkbox"
              checked={!!reportSettings[s.key]}
              onChange={(e) => schedule.setReportSetting(s.key, e.target.checked)}
            />
            {s.label}
          </label>
        ))}
      </div>

      {reportSettings.extras && (hasExtras || editing) && (
        <section className="card">
          <div className="card-header"><div><h2>Co-curricular</h2></div></div>
          {[
            { kind: 'service', label: 'Service & Leadership', add: 'Add service' },
            { kind: 'activities', label: 'Activities', add: 'Add activity' },
          ].map(({ kind, label, add }) => {
            if (extras[kind].length === 0 && !editing) return null
            return (
            <div key={kind} className="extras-block">
              <span className="report-section-label">{label}</span>
              {extras[kind].length > 0 && (
                <ul className="extras-list">
                  {extras[kind].map((s, i) => (
                    <li key={i}>
                      <span>{s}</span>
                      {editing && (
                        <ConfirmDelete
                          className="report-result-del"
                          label={`Remove ${s}`}
                          onDelete={() => schedule.deleteExtra(kind, i)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {editing &&
                (addingExtra === kind ? (
                  <form
                    className="extra-add"
                    onSubmit={(e) => {
                      e.preventDefault()
                      schedule.addExtra(kind, extraText)
                      setExtraText('')
                      setAddingExtra(null)
                    }}
                  >
                    <input
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                      placeholder={kind === 'service' ? 'e.g. Community Service — Te Hono' : 'e.g. Basketball Junior Boys'}
                      autoFocus
                    />
                    <button type="submit" className="primary-btn">Add</button>
                  </form>
                ) : (
                  <button
                    className="add-result-btn"
                    onClick={() => { setAddingExtra(kind); setExtraText('') }}
                  >
                    + {add}
                  </button>
                ))}
            </div>
            )
          })}
        </section>
      )}

      {cards.length === 0 && !hasExtras ? (
        <div className="card">
          <p className="empty">
            No grades yet — tap <strong>Edit</strong>, then <strong>+ Add report</strong> to upload your
            report PDF (or add results by hand).
          </p>
        </div>
      ) : (
        cards.map((card) => (
          <ReportCard
            key={card.id}
            card={card}
            settings={reportSettings}
            editing={editing}
            onAddResult={setAddingTo}
            onDeleteResult={schedule.deleteEvent}
            onDeleteReport={schedule.deleteReport}
          />
        ))
      )}

      {importing && (
        <PdfImportModal onImport={schedule.importReports} onClose={() => setImporting(false)} />
      )}

      {addingTo && (
        <ResultModal
          subject={addingTo}
          onAdd={({ title, code }) => schedule.addResult({ subject: addingTo, title, code })}
          onClose={() => setAddingTo(null)}
        />
      )}

      {confirmClear && (
        <div className="modal-overlay" onClick={() => setConfirmClear(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove all reports?</h3>
            <p className="modal-sub">
              This clears{' '}
              {reports.length > 0
                ? `all ${reports.length} imported report${reports.length === 1 ? '' : 's'} and the co-curricular list`
                : 'the co-curricular list'}
              . Grades you added by hand stay. You can upload again afterwards.
            </p>
            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="ghost-btn" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => {
                  schedule.clearReports()
                  schedule.clearExtras()
                  setConfirmClear(false)
                }}
              >
                Remove all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
