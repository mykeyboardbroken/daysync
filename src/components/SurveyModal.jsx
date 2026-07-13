import { useState, useEffect } from 'react'

// First-open onboarding — a full-screen flow that steps through the questions
// and hands the collected answers back on Finish.
export default function SurveyModal({ questions, onComplete }) {
  const [step, setStep] = useState(0)
  // Unit-bearing questions start on their first unit, so an untouched toggle
  // still records which unit the typed number is in.
  const [answers, setAnswers] = useState(() => {
    const init = {}
    for (const q of questions) if (q.units) init[`${q.id}Unit`] = q.units[0]
    return init
  })

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

  // A clicked option keeps keyboard focus, which made Enter re-fire its click and
  // toggle the answer instead of advancing. Dropping focus after a pointer click
  // hands Enter back to the "next question" handler below. Keyboard users who
  // *tab* to an option are unaffected: no pointer, so we leave focus alone.
  const pick = (e) => {
    if (e.detail > 0) e.currentTarget.blur() // detail === 0 means it came from the keyboard
  }

  // "Rather not say" — drop any answer for this question and move on, so a value
  // typed then reconsidered isn't left behind.
  function skip() {
    const rest = { ...answers }
    delete rest[q.id]
    setAnswers(rest)
    if (isLast) onComplete(rest)
    else setStep(idx + 1)
  }

  // Enter advances (and finishes on the last question). If an answer option is
  // focused, Enter still picks that option instead — otherwise keyboard users
  // could never select one.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Enter') return
      if (document.activeElement?.classList?.contains('survey-option')) return
      e.preventDefault() // stops the focused button firing its own click too
      next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

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
            <>
              <div className="survey-input-row">
                <input
                  className="survey-input"
                  type="text"
                  value={value || ''}
                  placeholder={q.placeholder || ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  autoFocus
                />
                {q.units && (
                  <div className="survey-units">
                    {q.units.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={`survey-unit ${(answers[`${q.id}Unit`] || q.units[0]) === u ? 'selected' : ''}`}
                        onClick={() => setAnswers((a) => ({ ...a, [`${q.id}Unit`]: u }))}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {q.skipLabel && (
                <button type="button" className="survey-skip" onClick={skip}>
                  {q.skipLabel}
                </button>
              )}
            </>
          )}

          {q.type === 'single' && (
            <div className="survey-options">
              {q.options.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  className={`survey-option ${value === o ? 'selected' : ''}`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                  onClick={(e) => {
                    setAnswer(o)
                    pick(e)
                  }}
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
                  onClick={(e) => {
                    toggleMulti(o)
                    pick(e)
                  }}
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
            <kbd className="survey-kbd" aria-hidden="true">⏎</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}
