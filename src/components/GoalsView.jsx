import { useState } from 'react'
import { HORIZONS, goalProgress } from '../goals'
import Icon from './Icon'
import ConfirmDelete from './ConfirmDelete'

// Goals, as a place you can actually do something in.
//
// A goal on its own is a wish — "be more confident" is not a thing you can do on a
// Tuesday. Breaking it into steps is what makes it real, so steps are the heart of
// this screen: tick them off, watch the bar fill, see the goal finish.
export default function GoalsView({ schedule }) {
  const myGoals = schedule.profile?.myGoals || {}
  const [openId, setOpenId] = useState(null)

  const total = HORIZONS.reduce((n, h) => n + (myGoals[h.key] || []).length, 0)

  return (
    <div className="goals-view">
      {total === 0 && (
        <section className="card empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <Icon name="trendingUp" size={26} />
          </span>
          <h2 className="empty-state-title">No goals yet</h2>
          <p className="empty-state-sub">
            Write down what you're working on — anything, not just school. Then break it
            into steps you can actually do.
          </p>
        </section>
      )}

      {HORIZONS.map((h) => {
        const list = myGoals[h.key] || []
        return (
          <section className="card goal-section" key={h.key}>
            <div className="card-header">
              <div>
                <h2>{h.label}</h2>
              </div>
              <span className="goal-count">{list.length || ''}</span>
            </div>

            {list.map((goal) => {
              const p = goalProgress(goal)
              const open = openId === goal.id
              return (
                <div className={`goal-row ${p.complete ? 'complete' : ''}`} key={goal.id}>
                  <button
                    type="button"
                    className="goal-main"
                    onClick={() => setOpenId(open ? null : goal.id)}
                  >
                    <span className="goal-row-top">
                      <span className="goal-text">{goal.text}</span>
                      {p.complete ? (
                        <Icon name="checkmark" size={16} className="goal-done-tick" />
                      ) : (
                        <Icon
                          name="chevronRight"
                          size={15}
                          className={`goal-caret ${open ? 'open' : ''}`}
                        />
                      )}
                    </span>

                    {/* No steps yet = no bar. An empty bar reads as "0% — you're failing",
                        when really you just haven't broken it down. */}
                    {p.total > 0 && (
                      <span className="goal-bar-row">
                        <span className="goal-bar">
                          <span className="goal-bar-fill" style={{ width: `${p.percent}%` }} />
                        </span>
                        <span className="goal-bar-label">
                          {p.done}/{p.total}
                        </span>
                      </span>
                    )}
                  </button>

                  {open && (
                    <div className="goal-steps">
                      {(goal.steps || []).map((s) => (
                        <div className="goal-step" key={s.id}>
                          <label className="assignment-check">
                            <input
                              type="checkbox"
                              checked={!!s.done}
                              onChange={() => schedule.toggleGoalStep(h.key, goal.id, s.id)}
                            />
                            <span className="checkmark" />
                          </label>
                          <span className={`goal-step-text ${s.done ? 'done' : ''}`}>{s.text}</span>
                          <button
                            type="button"
                            className="goal-step-del"
                            onClick={() => schedule.deleteGoalStep(h.key, goal.id, s.id)}
                            aria-label={`Remove step ${s.text}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <input
                        type="text"
                        className="goalset-input goal-step-input"
                        placeholder="Add a step you could actually do…"
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return
                          e.preventDefault()
                          schedule.addGoalStep(h.key, goal.id, e.currentTarget.value)
                          e.currentTarget.value = ''
                        }}
                        onBlur={(e) => {
                          schedule.addGoalStep(h.key, goal.id, e.currentTarget.value)
                          e.currentTarget.value = ''
                        }}
                      />

                      <ConfirmDelete
                        className="goal-delete"
                        label="Delete goal"
                        onDelete={() => schedule.deleteGoal(h.key, goal.id)}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            <input
              type="text"
              className="goalset-input"
              placeholder={h.placeholder}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                schedule.addGoal(h.key, e.currentTarget.value)
                e.currentTarget.value = ''
              }}
              onBlur={(e) => {
                schedule.addGoal(h.key, e.currentTarget.value)
                e.currentTarget.value = ''
              }}
            />
          </section>
        )
      })}
    </div>
  )
}
