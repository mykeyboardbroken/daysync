import { useState, useRef, useCallback, useEffect } from 'react'

// Lets a checked-off item play a short "leave" animation before it actually
// toggles/removes, instead of vanishing instantly. Call `mark(id, commit)` when
// the user checks something: it flags the row as leaving, then runs `commit`
// (the real toggle) after `delay`ms. Use `leaving(id)` to render the exit state.
export function useExitAnimation(delay = 300) {
  const [ids, setIds] = useState(() => new Set())
  const timers = useRef([])

  // Cancel any pending timers if the component unmounts mid-animation.
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const mark = useCallback(
    (id, commit) => {
      setIds((prev) => new Set(prev).add(id))
      const t = setTimeout(() => {
        commit()
        setIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, delay)
      timers.current.push(t)
    },
    [delay],
  )

  const leaving = useCallback((id) => ids.has(id), [ids])

  return { mark, leaving }
}
