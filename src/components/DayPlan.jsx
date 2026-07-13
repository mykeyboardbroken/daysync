import { useState } from 'react'
import { dueLabel, toKey } from '../dateUtils'
import { DAY_PARTS, BUCKET_OPTIONS } from '../dayParts'
import { habitDueOn, habitDoneOn, habitStreak } from '../habits'
import { categoryMeta } from '../taskCategories'
import { TASK_TEMPLATES } from '../taskTemplates'
import { generateSport, generateGeneral, sportAspects, sportAspectDesc } from '../workouts'
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
  const [showMoreTemplates, setShowMoreTemplates] = useState(false)
  const [dragId, setDragId] = useState(null)

  const { tasks } = schedule
  const todayKey = toKey(new Date())
  const now = new Date()

  // Which part of the day it is right now — that section opens by default, the
  // others sit collapsed so the page is one short scroll instead of a wall.
  const hour = now.getHours()
  const nowPart = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'night'
  // 'Anytime' ('') is open too: it isn't tied to a time, so it'd never open itself.
  const [openBuckets, setOpenBuckets] = useState(() => new Set([nowPart, '']))
  const toggleBucket = (key) =>
    setOpenBuckets((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id))

  // The one calm line under a title. A real description if there is one, otherwise
  // just how many steps are hiding inside — never the steps themselves. A glance
  // should feel effortless; the detail is a tap away.
  const descOf = (t) => {
    if (t.description) return t.description
    const n = t.steps?.length || 0
    return n ? `${n} step${n > 1 ? 's' : ''}` : ''
  }

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
  // A morning workout already starts with a warm-up/stretch, so fold the standalone
  // "Stretch / Move" into it — clearer than showing both.
  const morningWorkout = sportBucket === 'morning' || generalBucket === 'morning'

  const SKILL_LEVELS = [
    { key: 'weak', label: 'Weak' },
    { key: 'okay', label: 'Okay' },
    { key: 'strong', label: 'Strong' },
  ]
  const renderSkillPicker = (sportName) => {
    const focus = profile.sportSkills?.[sportName] || {}
    return (
      <div className="skill-picker" onClick={(e) => e.stopPropagation()}>
        <p className="skill-title">Rate each area — drills focus more on what you're weak at.</p>
        {sportAspects(sportName).map((asp) => {
          const level = focus[asp]
          return (
            <div className="skill-row" key={asp}>
              <div className="skill-info">
                <span className="skill-name">{asp}</span>
                <span className="skill-desc">{sportAspectDesc(sportName, asp)}</span>
              </div>
              <div className="skill-toggle">
                {SKILL_LEVELS.map((lv) => (
                  <button
                    type="button"
                    key={lv.key}
                    className={`skill-btn ${level === lv.key ? lv.key : ''}`}
                    onClick={() => schedule.setSportSkill(sportName, asp, level === lv.key ? null : lv.key)}
                  >
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWorkoutRow = ({ id, title, subtitle, steps, skillSport }) => {
    const expanded = expandedId === id
    const doneKey = `${todayKey}|${id}`
    const done = !!schedule.workoutLog?.[doneKey]
    return (
      <li
        key={id}
        className={`habit-row tappable workout-row ${done ? 'done' : ''} ${expanded ? 'expanded' : ''}`}
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
          <div className="task-drawer">
            <div className="task-drawer-inner">
              <div className="workout-drawer" onClick={(e) => e.stopPropagation()}>
                {skillSport && renderSkillPicker(skillSport)}
                {skillSport && <p className="skill-title recommend-title">Recommended drills</p>}
                <ol className="task-steps workout-steps">
                  {steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                {!skillSport && (
                  <button
                    type="button"
                    className="task-edit-btn"
                    onClick={() => schedule.reshuffleWorkout()}
                  >
                    New workout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <Icon name="chevronRight" size={16} className={`task-chevron ${expanded ? 'open' : ''}`} />
      </li>
    )
  }


  // A task's sort position: an explicit `order` (set by dragging / pins) wins,
  // otherwise pinFirst floats to the top and pinLast sinks to the bottom.
  const orderVal = (t) =>
    typeof t.order === 'number' ? t.order : t.pinFirst ? -1000 : t.pinLast ? 1000 : 0

  // Everything in a bucket, ordered by orderVal, then routines before one-off
  // to-dos (undone before done, earliest due first). Repeating tasks only appear
  // on the days they're actually due.
  const tasksIn = (key) =>
    tasks
      .filter((t) => (t.bucket || '') === key)
      .filter((t) => (t.repeat ? habitDueOn(t, now) : true))
      .filter((t) => !(morningWorkout && t.title === 'Stretch / Move'))
      .sort((a, b) => {
        const d = orderVal(a) - orderVal(b)
        if (d !== 0) return d
        if (!!a.repeat !== !!b.repeat) return a.repeat ? -1 : 1
        if (!a.repeat) {
          if (a.done !== b.done) return a.done ? 1 : -1
          if (!a.due) return 1
          if (!b.due) return -1
          return new Date(a.due) - new Date(b.due)
        }
        return 0
      })

  // Drag-to-reorder within a bucket (edit mode). Reassigns `order` on drop.
  const dropTaskOn = (target) => {
    if (!dragId || dragId === target.id) return
    const list = tasksIn(target.bucket || '')
    const from = list.findIndex((x) => x.id === dragId)
    const to = list.findIndex((x) => x.id === target.id)
    if (from < 0 || to < 0) return
    const arr = [...list]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    arr.forEach((x, i) => schedule.updateTask(x.id, { order: i }))
    setDragId(null)
  }

  // The expanded drawer: steps (if any) + an Edit button. Editing/deleting live
  // here so they're deliberate — no delete button sits on the row itself.
  // Always rendered, so opening/closing can animate its height (see .task-drawer);
  // a conditional mount would just pop.
  const expandedDrawer = (t) => (
    <div className="task-drawer">
      <div className="task-drawer-inner">
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
      </div>
    </div>
  )

  // In edit mode a row is draggable to reorder; a tap no longer expands it.
  const dragProps = (t) =>
    editing
      ? {
          draggable: true,
          onDragStart: () => setDragId(t.id),
          onDragEnd: () => setDragId(null),
          onDragOver: (e) => e.preventDefault(),
          onDrop: () => dropTaskOn(t),
        }
      : {}

  const renderOneOff = (t) => {
    const due = dueLabel(t.due)
    const cat = categoryMeta(t.category)
    const expanded = expandedId === t.id
    return (
      <li
        key={t.id}
        className={`assignment tappable ${t.done ? 'done' : ''} ${expanded ? 'expanded' : ''} ${editing ? 'editing' : ''} ${dragId === t.id ? 'dragging' : ''}`}
        onClick={() => !editing && toggleExpand(t.id)}
        {...dragProps(t)}
      >
        <label className="assignment-check" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={t.done} onChange={() => schedule.toggleTask(t.id, todayKey)} />
          <span className="checkmark" />
        </label>
        {cat && <span className="task-cat" title={cat.label}><Icon name={cat.icon} size={15} /></span>}
        <div className="assignment-body">
          <span className="assignment-title">{t.title}</span>
          <span className="task-desc">{descOf(t)}</span>
          {expandedDrawer(t)}
        </div>
        {!t.done && t.due && <span className={`assignment-due tone-${due.tone}`}>{due.text}</span>}
        {editing ? (
          <span className="edit-controls" onClick={(e) => e.stopPropagation()}>
            <Icon name="grip" size={16} className="drag-grip" />
            <ConfirmDelete className="assignment-del" label="Remove task" onDelete={() => schedule.deleteTask(t.id)} />
          </span>
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
        className={`habit-row tappable ${doneToday ? 'done' : ''} ${expanded ? 'expanded' : ''} ${editing ? 'editing' : ''} ${dragId === t.id ? 'dragging' : ''}`}
        onClick={() => !editing && toggleExpand(t.id)}
        {...dragProps(t)}
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
          {expandedDrawer(t)}
        </div>
        {streak > 0 && (
          <span className="habit-streak"><Icon name="flame" size={13} /> {streak}</span>
        )}
        {editing ? (
          <span className="edit-controls" onClick={(e) => e.stopPropagation()}>
            <Icon name="grip" size={16} className="drag-grip" />
            <ConfirmDelete className="assignment-del" label="Remove task" onDelete={() => schedule.deleteTask(t.id)} />
          </span>
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

    const empty = items.length === 0 && !showSport && !showGeneral
    // While editing, everything is open — you can't drag a task into a section you
    // can't see.
    const open = editing || openBuckets.has(key)
    // Collapsed summary: what's actually still left to do here.
    const left =
      items.filter((t) => (t.repeat ? !habitDoneOn(t, todayKey) : !t.done)).length +
      (showSport && !schedule.workoutLog?.[`${todayKey}|sport`] ? 1 : 0) +
      (showGeneral && !schedule.workoutLog?.[`${todayKey}|general`] ? 1 : 0)

    return (
      <div className={`plan-section ${open ? 'open' : ''}`} key={key || 'anytime'}>
        <button
          type="button"
          className="plan-section-head"
          onClick={() => !editing && toggleBucket(key)}
          aria-expanded={open}
        >
          <Icon name={icon} size={15} />
          <span className="plan-section-label">{label}</span>
          {key === nowPart && <span className="plan-now">now</span>}
          {!open && (
            <span className="plan-section-count">
              {left > 0 ? `${left} left` : empty ? 'Nothing planned' : 'All done'}
            </span>
          )}
          <Icon name="chevronRight" size={15} className={`plan-caret ${open ? 'open' : ''}`} />
        </button>

        <div className="task-drawer">
          <div className="task-drawer-inner">
            {empty ? (
              <p className="plan-empty">Nothing planned</p>
            ) : (
              <ul className="assignment-list">
                {items.map((t) => (t.repeat ? renderRepeating(t) : renderOneOff(t)))}
                {showSport &&
                  renderWorkoutRow({
                    id: 'sport',
                    title: 'Sport training',
                    subtitle: `${sport.label} drills`,
                    steps: sport.steps,
                    skillSport: sport.label,
                  })}
                {showGeneral &&
                  renderWorkoutRow({
                    id: 'general',
                    title: 'Workout',
                    subtitle: general.label,
                    steps: general.steps,
                  })}
              </ul>
            )}
          </div>
        </div>
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
          <button type="button" className="add-step-btn plan-add-templates" onClick={() => { setShowMoreTemplates(false); setShowTemplates(true) }}>
            + Add a default task
          </button>
        )}
      </section>

      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add a default task</h3>
            <p className="modal-sub">Drop one of the built-in routines back into your day.</p>
            <div className="add-menu add-menu-compact">
              {(showMoreTemplates
                ? TASK_TEMPLATES
                : TASK_TEMPLATES.filter((t) => t.essential)
              ).map((tpl) => {
                const already = tasks.some((t) => t.title === tpl.title)
                const slot = BUCKET_OPTIONS.find((b) => b.key === (tpl.bucket || ''))
                return (
                  <button
                    key={tpl.title}
                    type="button"
                    className={`add-menu-item ${already ? 'added' : ''}`}
                    disabled={already}
                    onClick={() => schedule.addTemplateTask(tpl)}
                  >
                    <span className="add-menu-icon" aria-hidden="true">
                      <Icon name={categoryMeta(tpl.category)?.icon || 'dots'} size={20} />
                    </span>
                    <span className="add-menu-label">{tpl.title}</span>
                    {slot && (
                      <span className="add-menu-slot">
                        <Icon name={slot.icon} size={13} />
                        {slot.label}
                      </span>
                    )}
                    {already && <Icon name="checkmark" size={18} className="add-menu-check" />}
                  </button>
                )
              })}
              {!showMoreTemplates && (
                <button
                  type="button"
                  className="add-menu-more"
                  onClick={() => setShowMoreTemplates(true)}
                >
                  + More routines ({TASK_TEMPLATES.filter((t) => !t.essential).length})
                </button>
              )}
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
