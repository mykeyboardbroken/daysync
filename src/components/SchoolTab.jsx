import { useState } from 'react'
import ComingUp from './ComingUp'
import ClassesTab from './ClassesTab'
import AssignmentsTab from './AssignmentsTab'
import ReportTab from './ReportTab'

// The school hub: what's coming up, then a sub-toggle between Classes (today's
// timetable & packing), Work (assignments & tests) and Grades (report card).
const SUBS = [
  { key: 'classes', label: 'Classes' },
  { key: 'work', label: 'Work' },
  { key: 'grades', label: 'Grades' },
]

export default function SchoolTab({ schedule }) {
  const [sub, setSub] = useState('classes')
  return (
    <div className="school-tab">
      <div className="school-coming">
        <ComingUp schedule={schedule} />
      </div>
      <div className="sub-tabs">
        {SUBS.map((s) => (
          <button
            key={s.key}
            className={`sub-tab ${sub === s.key ? 'active' : ''}`}
            onClick={() => setSub(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sub === 'classes' && <ClassesTab schedule={schedule} />}
      {sub === 'work' && <AssignmentsTab schedule={schedule} />}
      {sub === 'grades' && <ReportTab schedule={schedule} />}
    </div>
  )
}
