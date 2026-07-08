import { useState, useMemo } from 'react'
import { getApiKey, setApiKey, buildStudyContext, suggestStudy } from '../ai'
import Icon from './Icon'

// AI study coach: looks at your grades/subjects and suggests what to study.
// Calls Claude straight from the browser with your own Anthropic key.
export default function StudyTab({ schedule }) {
  const [apiKey, setKey] = useState(() => getApiKey())
  const [keyInput, setKeyInput] = useState('')
  const [editingKey, setEditingKey] = useState(false)
  const [focus, setFocus] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const context = useMemo(() => buildStudyContext(schedule), [schedule])
  const subjectCount = context ? context.split('\n').filter(Boolean).length : 0

  function saveKey() {
    const k = keyInput.trim()
    if (!k) return
    setApiKey(k)
    setKey(k)
    setKeyInput('')
    setEditingKey(false)
  }

  function removeKey() {
    setApiKey('')
    setKey('')
    setResult('')
    setError('')
  }

  async function getIdeas() {
    setLoading(true)
    setError('')
    setResult('')
    const res = await suggestStudy({ apiKey, context, focus: focus.trim() })
    setLoading(false)
    if (res.ok) setResult(res.text)
    else setError(res.error)
  }

  // --- No key yet (or re-entering): show the setup card ---
  if (!apiKey || editingKey) {
    return (
      <div className="tab-content">
        <section className="card">
          <div className="card-header"><div><h2><Icon name="cap" /> Study coach</h2></div></div>
          <p className="subtle" style={{ marginTop: 0 }}>
            This uses AI to suggest what to study from your grades. It needs your own Anthropic API
            key. It's stored only on this device and is never included in backups.
          </p>
          <label className="study-field">
            Anthropic API key
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-…"
              autoFocus
            />
          </label>
          <p className="subtle study-hint">
            Get one at console.anthropic.com → API keys. Usage is billed to your Anthropic account.
          </p>
          <div className="modal-actions">
            <span className="spacer" />
            {editingKey && (
              <button className="ghost-btn" onClick={() => setEditingKey(false)}>Cancel</button>
            )}
            <button className="primary-btn" onClick={saveKey} disabled={!keyInput.trim()}>Save key</button>
          </div>
        </section>
      </div>
    )
  }

  // --- Key set: the coach ---
  return (
    <div className="tab-content">
      <section className="card">
        <div className="card-header">
          <div>
            <h2><Icon name="cap" /> Study coach</h2>
            <p className="subtle">
              {subjectCount > 0
                ? `Looking at ${subjectCount} subject${subjectCount === 1 ? '' : 's'} from your grades`
                : 'No grades yet — add a report in Grades for better ideas'}
            </p>
          </div>
        </div>

        <label className="study-field">
          Anything specific? <span className="label-optional">(optional)</span>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. upcoming maths test on algebra"
          />
        </label>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="link-btn" onClick={() => setEditingKey(true)}>Change API key</button>
          <span className="spacer" />
          <button className="primary-btn" onClick={getIdeas} disabled={loading}>
            {loading ? 'Thinking…' : 'Suggest what to study'}
          </button>
        </div>
      </section>

      {error && (
        <section className="card">
          <p className="empty">{error}</p>
        </section>
      )}

      {result && (
        <section className="card">
          <div className="card-header"><div><h2>Study ideas</h2></div></div>
          <div className="study-output">{result}</div>
        </section>
      )}

      <button className="link-btn study-remove" onClick={removeKey}>Remove key from this device</button>
    </div>
  )
}
