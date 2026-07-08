import { useState } from 'react'
import { GRADE_CODES } from '../grades'
import Icon from './Icon'

// Pick a report PDF → extract text in the browser → parse each subject page →
// review & tweak → save. Nothing is stored until you press Import.
export default function PdfImportModal({ onImport, onClose }) {
  const [stage, setStage] = useState('pick') // pick | loading | review | error
  const [error, setError] = useState('')
  const [draft, setDraft] = useState([])
  const [rawText, setRawText] = useState('')
  const [hasExtras, setHasExtras] = useState(false)
  const [extras, setExtras] = useState({ service: '', activities: '' }) // newline-separated

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStage('loading')
    setError('')
    try {
      // Loaded on demand so the ~1 MB pdf.js library stays out of the app's
      // initial bundle — it only downloads when you actually import a report.
      const { extractPdfPages, parseReport, parseExtras } = await import('../pdfImport')
      const pages = await extractPdfPages(file)
      setRawText(pages.map((p, n) => `----- PAGE ${n + 1} -----\n${p.text}`).join('\n\n'))
      const ex = parseExtras(pages)
      if (ex) {
        setHasExtras(true)
        setExtras({ service: ex.service.join('\n'), activities: ex.activities.join('\n') })
      }
      const parsed = parseReport(pages)
      if (parsed.length === 0 && !ex) {
        setError("Couldn't find any grades in that PDF. Make sure it's the report with an \"Assessment Results\" section, and that its text is selectable (not a scan).")
        setStage('error')
        return
      }
      setDraft(
        parsed.map((p) => ({
          ...p,
          results: p.results.map((r) => ({ ...r, include: true })),
        })),
      )
      setStage('review')
    } catch (err) {
      setError(`Could not read that PDF (${err?.message || 'unknown error'}).`)
      setStage('error')
    }
  }

  function edit(i, patch) {
    setDraft((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  function editResult(i, j, patch) {
    setDraft((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? { ...p, results: p.results.map((r, k) => (k === j ? { ...r, ...patch } : r)) }
          : p,
      ),
    )
  }

  function handleImport() {
    const reports = draft.map((p) => ({
      subject: p.subject.trim(),
      teacher: p.teacher,
      email: p.email,
      absent: p.absent,
      dispositions: p.dispositions,
      termAverages: p.termAverages,
      results: p.results.filter((r) => r.include).map(({ title, code }) => ({ title, code })),
    }))
    const toList = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean)
    const extrasObj = hasExtras
      ? { service: toList(extras.service), activities: toList(extras.activities) }
      : undefined
    onImport(reports, extrasObj)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Add report</h3>

        {stage === 'pick' && (
          <>
            <p className="modal-sub">
              Upload your report PDF. It's read on your device — nothing is uploaded anywhere.
            </p>
            <label className="file-drop">
              <input type="file" accept="application/pdf,.pdf" onChange={handleFile} />
              <span><Icon name="file" size={18} /> Choose a PDF…</span>
            </label>
          </>
        )}

        {stage === 'loading' && <p className="modal-sub">Reading your report…</p>}

        {stage === 'error' && (
          <>
            <p className="import-error">{error}</p>
            {rawText && (
              <details className="import-raw">
                <summary>Show the text it read</summary>
                <pre>{rawText}</pre>
              </details>
            )}
            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="ghost-btn" onClick={() => setStage('pick')}>
                Try another file
              </button>
            </div>
          </>
        )}

        {stage === 'review' && (
          <>
            <p className="modal-sub">
              Found {draft.length} subject{draft.length === 1 ? '' : 's'}. Check everything, then import.
            </p>
            <div className="import-review">
              {draft.map((p, i) => (
                <div key={i} className="import-subject">
                  <input
                    className="import-subject-name"
                    value={p.subject}
                    onChange={(e) => edit(i, { subject: e.target.value })}
                    placeholder="Subject"
                  />
                  {p.teacher != null && (
                    <input
                      className="import-teacher"
                      value={p.teacher}
                      onChange={(e) => edit(i, { teacher: e.target.value })}
                      placeholder="Teacher (optional)"
                    />
                  )}

                  {p.results.length > 0 ? (
                    <ul className="import-results">
                      {p.results.map((r, j) => (
                        <li key={j} className={`import-result ${r.include ? '' : 'off'}`}>
                          <input
                            type="checkbox"
                            checked={r.include}
                            onChange={() => editResult(i, j, { include: !r.include })}
                          />
                          <input
                            className="import-result-title"
                            value={r.title}
                            onChange={(e) => editResult(i, j, { title: e.target.value })}
                          />
                          <select
                            className="import-result-grade"
                            value={r.code}
                            onChange={(e) => editResult(i, j, { code: e.target.value })}
                          >
                            {GRADE_CODES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="subtle">No individual results found on this page.</p>
                  )}

                  {(p.termAverages.length > 0 || p.dispositions.length > 0) && (
                    <p className="import-extra">
                      {p.termAverages.length > 0 && (
                        <span>Term avg: {p.termAverages.map((t) => t.label).join(' → ')}. </span>
                      )}
                      {p.dispositions.length > 0 && (
                        <span>{p.dispositions.map((d) => `${d.name}: ${d.value}`).join(' · ')}</span>
                      )}
                    </p>
                  )}
                </div>
              ))}

              {hasExtras && (
                <div className="import-subject">
                  <div className="import-extra-head">Co-curricular</div>
                  <label className="import-extra-label">Service &amp; Leadership</label>
                  <textarea
                    className="import-extra-area"
                    rows={3}
                    value={extras.service}
                    onChange={(e) => setExtras((x) => ({ ...x, service: e.target.value }))}
                    placeholder="One per line"
                  />
                  <label className="import-extra-label">Extra-curricular activities</label>
                  <textarea
                    className="import-extra-area"
                    rows={4}
                    value={extras.activities}
                    onChange={(e) => setExtras((x) => ({ ...x, activities: e.target.value }))}
                    placeholder="One per line"
                  />
                </div>
              )}
            </div>
            {rawText && (
              <details className="import-raw">
                <summary>Show the text it read (for fixing missing items)</summary>
                <pre>{rawText}</pre>
              </details>
            )}
            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
              <button type="button" className="primary-btn" onClick={handleImport}>
                Import {draft.length} subject{draft.length === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
