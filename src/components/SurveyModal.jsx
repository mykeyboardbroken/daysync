import { useState } from 'react'

// First-open onboarding — a full-screen flow that steps through the questions
// and hands the collected answers back on Finish.
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
    <div className="survey-screen">
      <div className="survey-inner">
        <div className="survey-top">
          <div className="survey-bar">
            <div
              className="survey-bar-fill"
              style={{ width: `${((idx + 1) / visible.length) * 100}%` }}
            />
          </div>
          <p className="survey-progress">Question {idx + 1} of {visible.length}</p>
        </div>

        <div className="survey-body" key={idx}>
          {idx === 0 && <p className="survey-eyebrow">Welcome 👋</p>}
          <h2 className="survey-question">{q.question}</h2>
          {q.hint && <p className="survey-hint">{q.hint}</p>}

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
              {q.options.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  className={`survey-option ${value === o ? 'selected' : ''}`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                  onClick={() => setAnswer(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          )}

          {q.type === 'multi' && (
            <div className="survey-options">
              {q.options.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  className={`survey-option ${(value || []).includes(o) ? 'selected' : ''}`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                  onClick={() => toggleMulti(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="survey-nav">
          {idx > 0 ? (
            <button type="button" className="ghost-btn" onClick={() => setStep(idx - 1)}>Back</button>
          ) : (
            <span className="spacer" />
          )}
          <span className="spacer" />
          <button type="button" className="primary-btn survey-next" onClick={next}>
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
