import { useState } from 'react'
import Icon from './Icon'

// "Netball", "Netball and Dance", "Netball, Dance and Hockey" — reads like a person
// wrote it, not like a database dumped an array.
function listSports(list) {
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

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

export default function IntroTour({ onDone, schedule, canSignIn, signedIn }) {
  const profile = schedule?.profile || {}
  const sports = profile.sports || []

  // Only worth asking to install if they're in a browser tab, not already installed.
  const installed =
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  // The sport card only exists if they told us they play something — there's nothing
  // to introduce otherwise. It's ON already (the survey set it), so the switch is
  // there to turn it OFF; tapping Next without touching it keeps it on, which is what
  // they implied by naming a sport in the first place.
  const sportCard = sports.length
    ? {
        icon: 'activity',
        title: 'Drills for your sport',
        body: `You said you play ${listSports(sports)}. DaySync can put a short drill session in your day — one sport at a time, leaning toward whatever you rate yourself weakest at. Leave it on, or switch it off here.`,
        toggle: true,
      }
    : null

  // Just tell them backup exists and where to find it — don't ask them to sign up
  // mid-tour. Only shown if the cloud is configured and they haven't already.
  const backupCard =
    canSignIn && !signedIn
      ? {
          icon: 'cloud',
          title: "Back up your stuff",
          body: 'Everything lives on this device by default. If you want it saved — so it survives a new phone and syncs to your laptop — make a free account any time in Settings › Backup. Totally optional.',
        }
      : null

  const cards = [
    ...CARDS,
    ...(sportCard ? [sportCard] : []),
    ...(backupCard ? [backupCard] : []),
    ...(installed || !isIOS ? [] : [INSTALL]),
  ]

  const sportOn = !!profile.sportTime && profile.sportTime !== "I don't"
  const toggleSport = () =>
    schedule.setProfile('sportTime', sportOn ? "I don't" : 'Afternoon')

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

          {/* A switch you can just walk past. Next keeps whatever it's set to. */}
          {card.toggle && (
            <button type="button" className="toggle-row intro-toggle" onClick={toggleSport}>
              <span className="toggle-text">
                <span className="toggle-label">Sport training on my day</span>
                <span className="toggle-hint">
                  {sportOn ? 'In your afternoon — change it in Settings' : 'Off'}
                </span>
              </span>
              <span className={`toggle ${sportOn ? 'on' : ''}`}>
                <span className="toggle-knob" />
              </span>
            </button>
          )}

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
