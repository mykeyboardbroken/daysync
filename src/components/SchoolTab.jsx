import { useState } from 'react'
import ComingUp from './ComingUp'
import ClassesTab from './ClassesTab'
import AssignmentsTab from './AssignmentsTab'
import ReportTab from './ReportTab'

// The school hub: what's coming up, then a sub-toggle between "Classes" (today's
// timetable & packing), "Work" (assignments & tests) and "Grades" (report card).
export default function SchoolTab({ schedule }) {
  const [sub, setSub] = useState('classes')
  return (
    <div className="school-tab">
      <div className="school-coming">
        <ComingUp schedule={schedule} />
      </div>
      <div className="sub-tabs">
        <button
          className={`sub-tab ${sub === 'classes' ? 'active' : ''}`}
          onClick={() => setSub('classes')}
        >
          Classes
        </button>
        <button
          className={`sub-tab ${sub === 'work' ? 'active' : ''}`}
          onClick={() => setSub('work')}
        >
          Work
        </button>
        <button
          className={`sub-tab ${sub === 'grades' ? 'active' : ''}`}
          onClick={() => setSub('grades')}
        >
          Grades
        </button>
      </div>
      {sub === 'classes' && <ClassesTab schedule={schedule} />}
      {sub === 'work' && <AssignmentsTab schedule={schedule} />}
      {sub === 'grades' && <ReportTab schedule={schedule} />}
    </div>
  )
}
