import { useState, useRef, useEffect } from 'react'

// A delete button that needs two taps: the first arms it (shows "Sure?"), the
// second within a few seconds actually deletes — so a single accidental tap
// can't remove anything. Auto-disarms after 3s. Keeps whatever button class it's
// given (so it sits where the old ✕ did) and stops clicks from bubbling (e.g.
// to a row's tap-to-edit).
export default function ConfirmDelete({ onDelete, className = '', label = 'Delete', armedLabel = 'Sure?' }) {
  const [armed, setArmed] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function handleClick(e) {
    e.stopPropagation()
    if (armed) {
      clearTimeout(timer.current)
      setArmed(false)
      onDelete()
    } else {
      setArmed(true)
      timer.current = setTimeout(() => setArmed(false), 3000)
    }
  }

  return (
    <button
      type="button"
      className={`${className} confirm-del ${armed ? 'armed' : ''}`}
      onClick={handleClick}
      aria-label={armed ? `Tap again to confirm — ${label}` : label}
    >
      {armed ? armedLabel : '✕'}
    </button>
  )
}
