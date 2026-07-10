import { useState } from 'react'
import { dueLabel, toKey } from '../dateUtils'
import { DAY_PARTS } from '../dayParts'
import { habitDueOn, habitDoneOn, habitStreak } from '../habits'
import { categoryMeta } from '../taskCategories'
import { generateSport, generateGeneral } from '../workouts'
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
  const { tasks } = schedule
  const todayKey = toKey(new Date())
  const now = new Date()

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id))

  // Fall back to "Routine for <category>" when there's no description.
  const descOf = (t) => t.description || `Routine for ${categoryMeta(t.category)?.label || 'this'}`

  // Generated workouts (free, offline). Two sessions — sport-specific + general
  // (general rotates push/pull/legs by day) — shown in the bucket they picked.
  const profile = schedule.profile || {}
  const workoutBucket = profile.workoutTime ? WORKOUT_BUCKET[profile.workoutTime] ?? '' : null
  const seed = schedule.workoutSeed || 0
  const sport =
    workoutBucket !== null && profile.sports?.length ? generateSport(profile, now, seed) : null
  const general = workoutBucket !== null ? generateGeneral(profile, now, seed) : null
  const hasWorkouts = !!(sport || general)

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

  const renderWorkouts = () => (
    <>
      {sport &&
        renderWorkoutRow({
          id: 'sport',
          title: 'Sport training',
          subtitle: `${sport.label} drills`,
          steps: sport.steps,
        })}
      {general &&
        renderWorkoutRow({
          id: 'general',
          title: 'Workout',
          subtitle: general.label,
          steps: general.steps,
        })}
    </>
  )

  // Everything in a bucket, repeating routines first, then one-off to-dos
  // (undone before done, earliest due first). Repeating tasks only appear on the
  // days they're actually due.
  const tasksIn = (key) =>
    tasks
      .filter((t) => (t.bucket || '') === key)
      .filter((t) => (t.repeat ? habitDueOn(t, now) : true))
      .sort((a, b) => {
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
        <Icon name="chevronRight" size={16} className={`task-chevron ${expanded ? 'open' : ''}`} />
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
        <Icon name="chevronRight" size={16} className={`task-chevron ${expanded ? 'open' : ''}`} />
      </li>
    )
  }

  const bucketSection = (key, icon, label, alwaysShow) => {
    const items = tasksIn(key)
    const showWorkout = hasWorkouts && workoutBucket === key
    if (!alwaysShow && items.length === 0 && !showWorkout) return null
    return (
      <div className="plan-section" key={key || 'anytime'}>
        <div className="plan-section-head"><Icon name={icon} size={15} /> {label}</div>
        {items.length === 0 && !showWorkout ? (
          <p className="plan-empty">Nothing planned</p>
        ) : (
          <ul className="assignment-list">
            {showWorkout && renderWorkouts()}
            {items.map((t) => (t.repeat ? renderRepeating(t) : renderOneOff(t)))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <>
      <section className="day-plan">
        <div className="card-header"><div><h2>Today's plan</h2></div></div>
        {bucketSection('', 'clock', 'Anytime', false)}
        {DAY_PARTS.map((p) => bucketSection(p.key, p.icon, p.label, true))}
      </section>

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
