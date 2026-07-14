import { useState } from 'react'
import Icon from './Icon'

// Shown once, straight after the survey. A new user otherwise lands on Today, sees a
// task list, and concludes DaySync is a to-do app — never discovering the timetable,
// homework, grades or focus timer sitting one tab away. This is the only moment we
// have their full attention, so it's also where we ask them to install the app.
const CARDS = [
  {
    icon: 'sun',
    title: 'Your day, three parts',
    body: 'Morning, afternoon and night. Tap a task to open its steps, and tick it off when it’s done. Add anything you like with the + button.',
  },
  {
    icon: 'book',
    title: 'Academics knows your timetable',
    body: 'Put your classes in once and DaySync tells you what you’ve got, what to pack for it, and what homework is due. It knows the cycle day, the term breaks and the public holidays.',
  },
  {
    icon: 'clock',
    title: 'Focus, and reminders',
    body: 'A full-screen timer for when you actually need to work, and reminders that pop on Today at the time you set.',
  },
]

// The install step is last, and it is not decoration: iOS deletes a website’s saved
// data after ~7 days of not opening it — UNLESS it’s been added to the Home Screen.
// Skipping this is how a user silently loses everything.
const INSTALL = {
  icon: 'star',
  title: 'Add it to your Home Screen',
  body: 'Tap the Share button in Safari, then “Add to Home Screen”. This keeps your data safe — iPhones clear saved data for websites you haven’t opened in a while, and installed apps are exempt.',
}

// Must outlast the .intro-screen.leaving animation, or the screen would pop away
// mid-dissolve.
const EXIT_MS = 460

export default function IntroTour({ onDone }) {
  // Only worth asking to install if they're in a browser tab, not already installed.
  const installed =
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  const cards = installed || !isIOS ? CARDS : [...CARDS, INSTALL]

  const [i, setI] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const last = i >= cards.length - 1
  const card = cards[i]

  // Dissolve out, then hand over — the app eases in underneath at the same moment
  // (see .app-reveal), so it reads as one handoff rather than an overlay blinking off.
  // Guarded so a double-tap can't fire onDone twice.
  function finish() {
    if (leaving) return
    setLeaving(true)
    setTimeout(onDone, EXIT_MS)
  }

  return (
    <div className={`intro-screen ${leaving ? 'leaving' : ''}`}>
      <div className="intro-inner">
        <button type="button" className="intro-skip-top" onClick={finish}>
          Skip
        </button>

        <div className="intro-body" key={i}>
          <span className="intro-icon" aria-hidden="true">
            <Icon name={card.icon} size={30} />
          </span>
          <h2 className="intro-title">{card.title}</h2>
          <p className="intro-text">{card.body}</p>
        </div>

        <div className="intro-dots" aria-hidden="true">
          {cards.map((_, n) => (
            <span key={n} className={`intro-dot ${n === i ? 'on' : ''}`} />
          ))}
        </div>

        <button
          type="button"
          className="primary-btn intro-next"
          onClick={() => (last ? finish() : setI(i + 1))}
        >
          {last ? 'Start using DaySync' : 'Next'}
        </button>
      </div>
    </div>
  )
}
