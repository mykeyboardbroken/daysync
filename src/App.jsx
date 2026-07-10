import { useState, useEffect } from 'react'
import { useSchedule } from './useSchedule'
import TabBar from './components/TabBar'
import Icon from './components/Icon'
import SettingsModal from './components/SettingsModal'
import SurveyModal from './components/SurveyModal'
import { SURVEY_QUESTIONS } from './survey'
import TodayTab from './components/TodayTab'
import SchoolTab from './components/SchoolTab'
import CalendarTab from './components/CalendarTab'
import AssignmentModal from './components/AssignmentModal'
import TestModal from './components/TestModal'
import TaskModal from './components/TaskModal'
import DateModal from './components/DateModal'
import NoteModal from './components/NoteModal'
import BringModal from './components/BringModal'
import AddMenu from './components/AddMenu'
import './App.css'

// Darken (factor < 1) a hex colour — used to derive the hover/pressed accent
// shade from the single custom colour the user picks.
function shade(hex, factor) {
  const h = (hex || '').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return hex
  const r = Math.round(((n >> 16) & 255) * factor)
  const g = Math.round(((n >> 8) & 255) * factor)
  const b = Math.round((n & 255) * factor)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export default function App() {
  const schedule = useSchedule()

  const [tab, setTab] = useState('today')
  // null = closed; otherwise the add flow: 'menu' | 'assignment' | 'date' | …
  const [adding, setAdding] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Apply the chosen colour theme to the whole document. A "custom" theme layers
  // the user's own primary/secondary on top via inline CSS variables.
  useEffect(() => {
    const root = document.documentElement
    if (schedule.theme === 'custom' && schedule.customColors) {
      // Sit the custom accent on the light or dark palette; inline vars win over
      // the palette's own --accent. The hover/pressed shade is a darkened primary.
      root.setAttribute('data-theme', schedule.customColors.base === 'bright' ? 'light' : 'indigo')
      root.style.setProperty('--accent', schedule.customColors.primary)
      root.style.setProperty('--accent-hover', shade(schedule.customColors.primary, 0.82))
    } else {
      root.setAttribute('data-theme', schedule.theme || 'indigo')
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-hover')
    }
  }, [schedule.theme, schedule.customColors])

  function closeAdd() {
    setAdding(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>{{ today: 'Today', school: 'Academics', calendar: 'Calendar' }[tab]}</h1>
        <button className="settings-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <Icon name="settings" size={20} />
        </button>
      </header>

      {tab === 'today' && <TodayTab schedule={schedule} />}
      {tab === 'school' && <SchoolTab schedule={schedule} />}
      {tab === 'calendar' && <CalendarTab schedule={schedule} />}

      <button className="fab" onClick={() => setAdding('menu')} aria-label="Add">
        <svg className="fab-plus" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      <TabBar active={tab} onChange={setTab} />

      {!schedule.onboarded && SURVEY_QUESTIONS.length > 0 && (
        <SurveyModal questions={SURVEY_QUESTIONS} onComplete={schedule.finishSurvey} />
      )}

      {settingsOpen && (
        <SettingsModal
          customColors={schedule.customColors}
          onSetCustomColor={schedule.setCustomColor}
          settings={schedule.settings}
          onSetSetting={schedule.setSetting}
          onRestartSurvey={schedule.restartSurvey}
          onExport={schedule.exportData}
          onImport={schedule.importData}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {adding === 'menu' && (
        <AddMenu
          context={tab === 'school' ? 'school' : tab === 'calendar' ? 'calendar' : 'personal'}
          onPick={setAdding}
          onClose={closeAdd}
        />
      )}

      {adding === 'assignment' && (
        <AssignmentModal onAdd={schedule.addAssignment} onClose={closeAdd} />
      )}

      {adding === 'test' && (
        <TestModal onAdd={schedule.addEvent} onClose={closeAdd} />
      )}

      {adding === 'task' && (
        <TaskModal
          onAdd={schedule.addTask}
          showStreaks={schedule.settings?.showStreaks}
          onClose={closeAdd}
        />
      )}

      {adding === 'date' && (
        <DateModal onAdd={schedule.addEvent} onClose={closeAdd} />
      )}

      {adding === 'note' && (
        <NoteModal onAdd={schedule.addNote} onClose={closeAdd} />
      )}

      {adding === 'bring' && (
        <BringModal onAdd={schedule.addBring} onClose={closeAdd} />
      )}

    </div>
  )
}
