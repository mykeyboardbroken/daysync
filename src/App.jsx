import { useState, useEffect, useRef } from 'react'
import { setClock24 } from './dateUtils'
import { useSchedule } from './useSchedule'
import { useAuth } from './useAuth'
import AuthScreen from './components/AuthScreen'
import TabBar from './components/TabBar'
import SettingsModal from './components/SettingsModal'
import SurveyModal from './components/SurveyModal'
import IntroTour from './components/IntroTour'
import { SURVEY_QUESTIONS } from './survey'
import TodayTab from './components/TodayTab'
import SchoolTab from './components/SchoolTab'
import CalendarTab from './components/CalendarTab'
import FocusTab from './components/FocusTab'
import AssignmentModal from './components/AssignmentModal'
import TestModal from './components/TestModal'
import TaskModal from './components/TaskModal'
import AlertModal from './components/AlertModal'
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
  const auth = useAuth()
  const schedule = useSchedule(auth.userId)

  const [tab, setTab] = useState('today')
  // null = closed; otherwise the add flow: 'menu' | 'assignment' | 'date' | …
  const [adding, setAdding] = useState(null)

  // Ease the app in the moment the INTRO finishes — that's the last thing covering it.
  // (This used to key off the survey, but the intro then sat on top of the app while
  // its reveal animation played underneath, so nobody ever saw it.)
  const wasIntroDone = useRef(schedule.introDone)
  const [justOnboarded, setJustOnboarded] = useState(false)
  useEffect(() => {
    if (!wasIntroDone.current && schedule.introDone) {
      setJustOnboarded(true)
      const t = setTimeout(() => setJustOnboarded(false), 900)
      wasIntroDone.current = true
      return () => clearTimeout(t)
    }
    wasIntroDone.current = schedule.introDone
  }, [schedule.introDone])

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
    // Keep the browser/OS chrome colour in step with the theme. It's hardcoded dark in
    // index.html, which is wrong the moment someone picks the bright base.
    const bright = schedule.theme === 'custom' && schedule.customColors?.base === 'bright'
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', bright ? '#f6f8fb' : '#0f172a')
  }, [schedule.theme, schedule.customColors])

  // Display preferences that apply app-wide.
  const { clock24, reduceMotion } = schedule.settings || {}
  // Applied during render, not in an effect: an effect runs AFTER the render that
  // already formatted the times, so the clock would lag a render behind the toggle.
  // It's idempotent, so re-running it on every render is harmless.
  setClock24(clock24)
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', !!reduceMotion)
  }, [reduceMotion])

  function closeAdd() {
    setAdding(null)
  }

  // With accounts enabled, nothing loads until we know who you are.
  if (auth.enabled && auth.loading) return <div className="auth-screen" />
  if (auth.enabled && !auth.session) {
    return <AuthScreen onSignIn={auth.signIn} onSignUp={auth.signUp} />
  }

  return (
    <div className="app">
      {/* The post-survey reveal animates a TRANSFORM, and a transformed element
          becomes the containing block for its position:fixed descendants. So it has
          to wrap the page content only — put the tab bar or the FAB inside it and
          they'd stop being pinned to the viewport and slide up with the animation. */}
      <div className={justOnboarded ? 'app-reveal' : undefined}>
        <header className="app-header">
          <h1>{{ today: 'Today', school: 'Academics', calendar: 'Calendar', focus: 'Focus', settings: 'Settings' }[tab]}</h1>
        </header>

        {tab === 'today' && <TodayTab schedule={schedule} />}
        {tab === 'school' && <SchoolTab schedule={schedule} />}
        {tab === 'calendar' && <CalendarTab schedule={schedule} />}
        {tab === 'focus' && <FocusTab schedule={schedule} />}
        {tab === 'settings' && (
          <SettingsModal
            customColors={schedule.customColors}
            onSetCustomColor={schedule.setCustomColor}
            settings={schedule.settings}
            onSetSetting={schedule.setSetting}
            profile={schedule.profile}
            onSetProfile={schedule.setProfile}
            onExport={schedule.exportData}
            onImport={schedule.importData}
            onReset={schedule.resetAll}
            goalProgress={schedule.goalProgress}
            account={auth.enabled ? { email: auth.session?.user?.email, username: auth.username } : null}
            onSignOut={auth.signOut}
          />
        )}
      </div>

      {tab !== 'settings' && tab !== 'focus' && (
        <button className="fab" onClick={() => setAdding('menu')} aria-label="Add">
          <svg className="fab-plus" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <TabBar active={tab} onChange={setTab} />

      {!schedule.onboarded && SURVEY_QUESTIONS.length > 0 && (
        <SurveyModal questions={SURVEY_QUESTIONS} onComplete={schedule.finishSurvey} />
      )}

      {/* Straight after the survey, once. Without it a new user meets a task list and
          never finds the timetable, homework or focus timer — and never installs the
          app, which is how iOS quietly eats their data. */}
      {schedule.onboarded && !schedule.introDone && (
        <IntroTour onDone={schedule.finishIntro} />
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

      {adding === 'homework' && (
        <AssignmentModal onAdd={schedule.addAssignment} defaultKind="homework" onClose={closeAdd} />
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

      {adding === 'reminder' && (
        <AlertModal onAdd={schedule.addAlert} onClose={closeAdd} />
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
