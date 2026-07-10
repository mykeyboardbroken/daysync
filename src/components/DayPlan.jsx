import { useState } from 'react'
import { dueLabel, toKey } from '../dateUtils'
import { DAY_PARTS } from '../dayParts'
import { habitDueOn, habitDoneOn, habitStreak } from '../habits'
import { categoryMeta } from '../taskCategories'
import { TASK_TEMPLATES } from '../taskTemplates'
import { generateSport, generateGeneral } from '../workouts'
import ConfirmDelete from './ConfirmDelete'
import Icon from './Icon'
import TaskModal from './TaskModal'

// Which bucket the user's chosen workout time maps to ('' = Anytime).
const WORKOUT_BUCKET = { Morning: 'morning', Afternoon: 'afternoon', Night: 'night', Anytime: '' }

// The day organised by time of day: Morning / Afternoon / Night (+ an Anytime
// catch-all). Tasks drop into their bucket. A task is either one-off (check it
// off once) or repeating (checks off per day and builds a streak). Tap a task to
// expand its steps + Edit; the checkbox stays the only thing that completes it.
export default function DayPlan({ schedule }) {
  const [editingTask, setEditingTask] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const { tasks } = schedule
  const todayKey = toKey(new Date())
  const now = new Date()

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id))

  // Fall back to "Routine for <category>" when there's no description.
  const descOf = (t) => t.description || `Routine for ${categoryMeta(t.category)?.label || 'this'}`

  // Generated workouts (free, offline). Sport training and the general workout
  // each sit in their own chosen bucket (they can differ, or be "I don't").
  const profile = schedule.profile || {}
  const bucketForTime = (t) =>
    Object.prototype.hasOwnProperty.call(WORKOUT_BUCKET, t) ? WORKOUT_BUCKET[t] : null
  const sportBucket = profile.sports?.length ? bucketForTime(profile.sportTime) : null
  const generalBucket = bucketForTime(profile.workoutTime)
  const seed = schedule.workoutSeed || 0
  const sport = sportBucket !== null ? generateSport(profile, now, seed) : null
  const general = generalBucket !== null ? generateGeneral(profile, now, seed) : null

  const renderWorkoutRow = ({ id, title, subtitle, steps }) => {
    const expanded = expandedId === id
    const doneKey = `${todayKey}|${id}`
    const done = !!schedule.workoutLog?.[doneKey]
    return (
      <li
        key={id}
        className={`habit-row tappable ${done ? 'done' : ''} ${expanded ? 'expanded' : ''}`}
        onClick={() => toggleExpand(id)}
      >
        <label className="assignment-check" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={done} onChange={() => schedule.toggleWorkout(doneKey)} />
          <span className="checkmark" />
        </label>
        <span className="task-cat" title="Health & Fitness"><Icon name="activity" size={15} /></span>
        <div className="habit-body">
          <span className="habit-title">{title}</span>
          <span className="task-desc">{subtitle}</span>
          {expanded && (
            <>
              <ol className="task-steps">
                {steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <button
                type="button"
                className="task-edit-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  schedule.reshuffleWorkout()
                }}
              >
                New workout
              </button>
            </>
          )}
        </div>
        <Icon name="chevronRight" size={16} className={`task-chevron ${expanded ? 'open' : ''}`} />
      </li>
    )
  }


  // Everything in a bucket, repeating routines first, then one-off to-dos
  // (undone before done, earliest due first). Repeating tasks only appear on the
  // days they're actually due.
  const tasksIn = (key) =>
    tasks
      .filter((t) => (t.bucket || '') === key)
      .filter((t) => (t.repeat ? habitDueOn(t, now) : true))
      .sort((a, b) => {
        if (!!a.pinFirst !== !!b.pinFirst) return a.pinFirst ? -1 : 1
        if (!!a.repeat !== !!b.repeat) return a.repeat ? -1 : 1
        if (!a.repeat) {
          if (a.done !== b.done) return a.done ? 1 : -1
          if (!a.due) return 1
          if (!b.due) return -1
          return new Date(a.due) - new Date(b.due)
        }
        return 0
      })

  // The expanded drawer: steps (if any) + an Edit button. Editing/deleting live
  // here so they're deliberate — no delete button sits on the row itself.
  const expandedDrawer = (t) => (
    <>
      {t.steps?.length > 0 && (
        <ol className="task-steps">
          {t.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
      <button
        type="button"
        className="task-edit-btn"
        onClick={(e) => {
          e.stopPropagation()
          setEditingTask(t)
        }}
      >
        Edit
      </button>
    </>
  )

  const renderOneOff = (t) => {
    const due = dueLabel(t.due)
    const cat = categoryMeta(t.category)
    const expanded = expandedId === t.id
    return (
      <li
        key={t.id}
        className={`assignment tappable ${t.done ? 'done' : ''} ${expanded ? 'expanded' : ''}`}
        onClick={() => toggleExpand(t.id)}
      >
        <label className="assignment-check" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={t.done} onChange={() => schedule.toggleTask(t.id, todayKey)} />
          <span className="checkmark" />
        </label>
        {cat && <span className="task-cat" title={cat.label}><Icon name={cat.icon} size={15} /></span>}
        <div className="assignment-body">
          <span className="assignment-title">{t.title}</span>
          <span className="task-desc">{descOf(t)}</span>
          {expanded && expandedDrawer(t)}
        </div>
        {!t.done && t.due && <span className={`assignment-due tone-${due.tone}`}>{due.text}</span>}
        {editing ? (
          <ConfirmDelete className="assignment-del" label="Remove task" onDelete={() => schedule.deleteTask(t.id)} />
        ) : (
          <Icon name="chevronRight" size={16} className={`task-chevron ${expanded ? 'open' : ''}`} />
        )}
      </li>
    )
  }

  const showStreaks = schedule.settings?.showStreaks
  const renderRepeating = (t) => {
    // Only rendered on days it's due, so it's always active here.
    const doneToday = habitDoneOn(t, todayKey)
    const streak = showStreaks ? habitStreak(t, now) : 0
    const cat = categoryMeta(t.category)
    const expanded = expandedId === t.id
    return (
      <li
        key={t.id}
        className={`habit-row tappable ${doneToday ? 'done' : ''} ${expanded ? 'expanded' : ''}`}
        onClick={() => toggleExpand(t.id)}
      >
        <label className="assignment-check" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={doneToday}
            onChange={() => schedule.toggleTask(t.id, todayKey)}
          />
          <span className="checkmark" />
        </label>
        {cat && <span className="task-cat" title={cat.label}><Icon name={cat.icon} size={15} /></span>}
        <div className="habit-body">
          <span className="habit-title">{t.title}</span>
          <span className="task-desc">{descOf(t)}</span>
          {expanded && expandedDrawer(t)}
        </div>
        {streak > 0 && (
          <span className="habit-streak"><Icon name="flame" size={13} /> {streak}</span>
        )}
        {editing ? (
          <ConfirmDelete className="assignment-del" label="Remove task" onDelete={() => schedule.deleteTask(t.id)} />
        ) : (
          <Icon name="chevronRight" size={16} className={`task-chevron ${expanded ? 'open' : ''}`} />
        )}
      </li>
    )
  }

  const bucketSection = (key, icon, label, alwaysShow) => {
    const items = tasksIn(key)
    const showSport = sport && sportBucket === key
    const showGeneral = general && generalBucket === key
    if (!alwaysShow && items.length === 0 && !showSport && !showGeneral) return null
    return (
      <div className="plan-section" key={key || 'anytime'}>
        <div className="plan-section-head"><Icon name={icon} size={15} /> {label}</div>
        {items.length === 0 && !showSport && !showGeneral ? (
          <p className="plan-empty">Nothing planned</p>
        ) : (
          <ul className="assignment-list">
            {showSport &&
              renderWorkoutRow({
                id: 'sport',
                title: 'Sport training',
                subtitle: `${sport.label} drills`,
                steps: sport.steps,
              })}
            {showGeneral &&
              renderWorkoutRow({
                id: 'general',
                title: 'Workout',
                subtitle: general.label,
                steps: general.steps,
              })}
            {items.map((t) => (t.repeat ? renderRepeating(t) : renderOneOff(t)))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <>
      <section className="day-plan">
        <div className="card-header">
          <div><h2>Today's plan</h2></div>
          <button type="button" className="plan-edit-btn" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
        {bucketSection('', 'clock', 'Anytime', false)}
        {DAY_PARTS.map((p) => bucketSection(p.key, p.icon, p.label, true))}
        {editing && (
          <button type="button" className="add-step-btn plan-add-templates" onClick={() => setShowTemplates(true)}>
            + Add a default task
          </button>
        )}
      </section>

      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add a default task</h3>
            <p className="modal-sub">Drop one of the built-in routines back into your day.</p>
            <div className="add-menu">
              {TASK_TEMPLATES.map((tpl) => {
                const already = tasks.some((t) => t.title === tpl.title)
                const hint = tpl.description || (tpl.steps || []).join(' · ')
                return (
                  <button
                    key={tpl.title}
                    type="button"
                    className="add-menu-item"
                    disabled={already}
                    onClick={() => schedule.addTemplateTask(tpl)}
                  >
                    <span className="add-menu-icon" aria-hidden="true">
                      <Icon name={categoryMeta(tpl.category)?.icon || 'dots'} size={22} />
                    </span>
                    <span className="add-menu-text">
                      <span className="add-menu-label">{tpl.title}{already ? ' · added' : ''}</span>
                      <span className="add-menu-hint">{hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="primary-btn" onClick={() => setShowTemplates(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <TaskModal
          initial={editingTask}
          onAdd={(fields) => schedule.updateTask(editingTask.id, fields)}
          onDelete={() => {
            schedule.deleteTask(editingTask.id)
            setEditingTask(null)
          }}
          showStreaks={showStreaks}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  )
}
