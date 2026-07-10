import { useState } from 'react'
import { dueLabel, toKey } from '../dateUtils'
import { DAY_PARTS } from '../dayParts'
import { habitDueOn, habitDoneOn, habitStreak } from '../habits'
import { categoryMeta } from '../taskCategories'
import ConfirmDelete from './ConfirmDelete'
import Icon from './Icon'
import TaskModal from './TaskModal'

// The day organised by time of day: Morning / Afternoon / Night (+ an Anytime
// catch-all). Tasks drop into their bucket. A task is either one-off (check it
// off once) or repeating (checks off per day and builds a streak). Used on the
// Today tab so the day's plan sits with everything else.
export default function DayPlan({ schedule }) {
  const [editingTask, setEditingTask] = useState(null)
  const { tasks } = schedule
  const todayKey = toKey(new Date())
  const now = new Date()

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

  const renderOneOff = (t) => {
    const due = dueLabel(t.due)
    const cat = categoryMeta(t.category)
    return (
      <li
        key={t.id}
        className={`assignment tappable ${t.done ? 'done' : ''}`}
        onClick={() => setEditingTask(t)}
      >
        <label className="assignment-check" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={t.done} onChange={() => schedule.toggleTask(t.id, todayKey)} />
          <span className="checkmark" />
        </label>
        {cat && <span className="task-cat" title={cat.label}><Icon name={cat.icon} size={15} /></span>}
        <div className="assignment-body">
          <span className="assignment-title">{t.title}</span>
          {t.description && <span className="task-desc">{t.description}</span>}
        </div>
        {!t.done && t.due && <span className={`assignment-due tone-${due.tone}`}>{due.text}</span>}
        <ConfirmDelete
          className="assignment-del"
          label="Delete task"
          onDelete={() => schedule.deleteTask(t.id)}
        />
      </li>
    )
  }

  const showStreaks = schedule.settings?.showStreaks
  const renderRepeating = (t) => {
    // Only rendered on days it's due, so it's always active here.
    const doneToday = habitDoneOn(t, todayKey)
    const streak = showStreaks ? habitStreak(t, now) : 0
    const cat = categoryMeta(t.category)
    return (
      <li key={t.id} className="habit-row tappable" onClick={() => setEditingTask(t)}>
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
          {t.description && <span className="task-desc">{t.description}</span>}
        </div>
        {streak > 0 && (
          <span className="habit-streak"><Icon name="flame" size={13} /> {streak}</span>
        )}
        <ConfirmDelete
          className="assignment-del"
          label="Delete task"
          onDelete={() => schedule.deleteTask(t.id)}
        />
      </li>
    )
  }

  const bucketSection = (key, icon, label, alwaysShow) => {
    const items = tasksIn(key)
    if (!alwaysShow && items.length === 0) return null
    return (
      <div className="plan-section" key={key || 'anytime'}>
        <div className="plan-section-head"><Icon name={icon} size={15} /> {label}</div>
        {items.length === 0 ? (
          <p className="plan-empty">Nothing planned</p>
        ) : (
          <ul className="assignment-list">
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
        {DAY_PARTS.map((p) => bucketSection(p.key, p.icon, p.label, true))}
        {bucketSection('', 'clock', 'Anytime', false)}
      </section>

      {editingTask && (
        <TaskModal
          initial={editingTask}
          onAdd={(fields) => schedule.updateTask(editingTask.id, fields)}
          showStreaks={showStreaks}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  )
}
