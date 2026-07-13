import { useState, useRef } from 'react'
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

  // Sub-tabs: show one part of the day at a time, starting on the part you're
  // actually in. (Declared after `now` — reading it above would be a TDZ crash.)
  const hour = now.getHours()
  const nowPart = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'night'
  const [part, setPart] = useState(nowPart)

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

  // Move `draggedId` to sit where `target` currently is, within its bucket, and
  // write the new positions back as `order`.
  const moveTaskOnto = (draggedId, target) => {
    if (!draggedId || draggedId === target.id) return
    const list = tasksIn(target.bucket || '')
    const from = list.findIndex((x) => x.id === draggedId)
    const to = list.findIndex((x) => x.id === target.id)
    if (from < 0 || to < 0) return
    const arr = [...list]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    arr.forEach((x, i) => schedule.updateTask(x.id, { order: i }))
  }

  // Reorder via POINTER events, not HTML5 drag-and-drop — `draggable` simply does
  // not fire on touch screens, so the grip was dead on a phone. Pointer events
  // cover finger, pen and mouse with one path. Dragging is by the grip only, so a
  // stray swipe on the row can't reorder anything.
  const dragging = useRef(null) // id of the task currently being dragged

  const gripDown = (e, t) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = t.id
    setDragId(t.id)
  }

  const gripMove = (e) => {
    const heldId = dragging.current
    if (!heldId) return
    // Pointer capture sends every move here, so ask the document what's under the
    // finger instead of relying on the event target.
    const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-task-id]')
    const overId = row?.getAttribute('data-task-id')
    if (!overId || overId === heldId) return
    const target = tasks.find((x) => x.id === overId)
    const held = tasks.find((x) => x.id === heldId)
    // Reordering is within a bucket; dragging across time-of-day would silently
    // change when a task happens, which isn't what a grip implies.
    if (!target || !held || (target.bucket || '') !== (held.bucket || '')) return
    moveTaskOnto(heldId, target) // live reorder, so the row follows your finger
  }

  const gripUp = (e) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragging.current = null
    setDragId(null)
  }

  const gripProps = (t) => ({
    onPointerDown: (e) => gripDown(e, t),
    onPointerMove: gripMove,
    onPointerUp: gripUp,
    onPointerCancel: gripUp,
  })

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

  // Rows just need to be identifiable under the finger; the grip does the work.
  const dragProps = (t) =>
    editing
      ? {
          'data-task-id': t.id,
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
            <span className="drag-grip" {...gripProps(t)} aria-label="Drag to reorder">
              <Icon name="grip" size={16} />
            </span>
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
            <span className="drag-grip" {...gripProps(t)} aria-label="Drag to reorder">
              <Icon name="grip" size={16} />
            </span>
            <ConfirmDelete className="assignment-del" label="Remove task" onDelete={() => schedule.deleteTask(t.id)} />
          </span>
        ) : (
          <Icon name="chevronRight" size={16} className={`task-chevron ${expanded ? 'open' : ''}`} />
        )}
      </li>
    )
  }

  // How much is still undone in a bucket — shown on its tab so nothing gets
  // forgotten just because it's on another tab.
  const leftIn = (key) =>
    tasksIn(key).filter((t) => (t.repeat ? !habitDoneOn(t, todayKey) : !t.done)).length +
    (sport && sportBucket === key && !schedule.workoutLog?.[`${todayKey}|sport`] ? 1 : 0) +
    (general && generalBucket === key && !schedule.workoutLog?.[`${todayKey}|general`] ? 1 : 0)

  const bucketSection = (key, icon, label, alwaysShow) => {
    const items = tasksIn(key)
    const showSport = sport && sportBucket === key
    const showGeneral = general && generalBucket === key
    if (!alwaysShow && items.length === 0 && !showSport && !showGeneral) return null
    return (
      <div className="plan-section" key={key || 'anytime'}>
        {/* The active tab already names the time bucket, so it passes no label. */}
        {label && (
          <div className="plan-section-head"><Icon name={icon} size={15} /> {label}</div>
        )}
        {items.length === 0 && !showSport && !showGeneral ? (
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
        <div className="plan-tabs" role="tablist">
          {DAY_PARTS.map((p) => {
            const left = leftIn(p.key)
            return (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={part === p.key}
                className={`plan-tab ${part === p.key ? 'active' : ''}`}
                onClick={() => setPart(p.key)}
              >
                <Icon name={p.icon} size={14} />
                <span className="plan-tab-label">{p.label}</span>
                {left > 0 && <span className="plan-tab-count">{left}</span>}
              </button>
            )
          })}
        </div>

        {bucketSection(part, DAY_PARTS.find((p) => p.key === part)?.icon, '', true)}
        {/* Anytime isn't tied to a clock, so it sits under whichever tab you're on
            rather than hiding behind one. Only rendered when it has something. */}
        {bucketSection('', 'clock', 'Anytime', false)}

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
