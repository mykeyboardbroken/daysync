import { useMemo } from 'react'
import { subjectColor } from '../subjectColor'
import { averageGrades, gradeColor } from '../grades'

// Rolls up every graded test into a per-subject average. Only tests that have a
// `result` count; a subject with no grades never appears. Pure derived data —
// nothing new is stored.
export default function GradesSummary({ events }) {
  const subjects = useMemo(() => {
    const bySubject = {}
    for (const e of events) {
      if (!e.result) continue
      const key = e.subject?.trim() || 'Other'
      ;(bySubject[key] ??= []).push(e.result)
    }
    return Object.entries(bySubject)
      .map(([subject, codes]) => ({ subject, ...averageGrades(codes) }))
      .sort((a, b) => b.avg - a.avg)
  }, [events])

  if (!subjects.length) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h2>📊 Grades</h2>
            <p className="subtle">Your average grade per subject</p>
          </div>
        </div>
        <p className="empty">
          No grades yet — open the <strong>Tests</strong> filter and tap a test to record how it went.
        </p>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>📊 Grades</h2>
          <p className="subtle">Average per subject, best first</p>
        </div>
      </div>
      <ul className="grades-list">
        {subjects.map((s) => (
          <li key={s.subject} className="grade-row">
            <span className="subject-badge" style={{ background: subjectColor(s.subject) }}>
              {s.subject}
            </span>
            <span className="grade-row-count">
              {s.count} {s.count === 1 ? 'grade' : 'grades'}
            </span>
            <span className="grade-avg-badge" style={{ background: gradeColor(s.nearest.code) }}>
              {s.nearest.code}
              <span className="grade-avg-num">avg {s.avg}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
