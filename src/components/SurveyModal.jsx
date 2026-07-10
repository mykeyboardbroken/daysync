import { useState } from 'react'

// First-open onboarding survey — steps through the questions and hands the
// collected answers back on Finish. Can't be dismissed by tapping outside.
export default function SurveyModal({ questions, onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})

  // Only questions whose showIf currently passes are part of the flow.
  const visible = questions.filter((q) => !q.showIf || q.showIf(answers))
  const idx = Math.min(step, visible.length - 1)
  const q = visible[idx]
  const isLast = idx >= visible.length - 1
  const value = answers[q.id]

  const setAnswer = (v) => setAnswers((a) => ({ ...a, [q.id]: v }))
  const toggleMulti = (opt) =>
    setAnswers((a) => {
      const cur = a[q.id] || []
      return { ...a, [q.id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] }
    })

  function next() {
    if (isLast) onComplete(answers)
    else setStep(idx + 1)
  }

  return (
    <div className="modal-overlay">
      <div className="modal survey-modal">
        {idx === 0 && <p className="survey-eyebrow">Welcome 👋</p>}
        <p className="survey-progress">Question {idx + 1} of {visible.length}</p>
        <h3>{q.question}</h3>
        {q.hint && <p className="modal-sub">{q.hint}</p>}

        {q.type === 'text' && (
          <input
            className="survey-input"
            type="text"
            value={value || ''}
            placeholder={q.placeholder || ''}
            onChange={(e) => setAnswer(e.target.value)}
            autoFocus
          />
        )}

        {q.type === 'single' && (
          <div className="survey-options">
            {q.options.map((o) => (
              <button
                key={o}
                type="button"
                className={`survey-option ${value === o ? 'selected' : ''}`}
                onClick={() => setAnswer(o)}
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {q.type === 'multi' && (
          <div className="survey-options">
            {q.options.map((o) => (
              <button
                key={o}
                type="button"
                className={`survey-option ${(value || []).includes(o) ? 'selected' : ''}`}
                onClick={() => toggleMulti(o)}
              >
                {o}
              </button>
            ))}
          </div>
        )}

        <div className="modal-actions">
          {idx > 0 ? (
            <button type="button" className="ghost-btn" onClick={() => setStep(idx - 1)}>Back</button>
          ) : (
            <span className="spacer" />
          )}
          <span className="spacer" />
          <button type="button" className="primary-btn" onClick={next}>
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
