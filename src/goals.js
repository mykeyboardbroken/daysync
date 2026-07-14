// The user's own goals, in their own words, over three horizons. A goal with no
// timeframe is a wish.
//
// The examples deliberately aren't all about grades. A goal can be about who you want
// to be, not just what you want to score — and the placeholder is the only hint most
// people will ever read, so it has to show that range.
//
// Shared by the survey step, the Today card and the Settings editor, so the three
// can't drift apart.
export const HORIZONS = [
  { key: 'short', label: 'Short term', placeholder: 'e.g. talk to someone new this week' },
  { key: 'medium', label: 'Mid term', placeholder: 'e.g. be more confident speaking up' },
  { key: 'long', label: 'Long term', placeholder: 'e.g. stop caring what people think' },
]

// A goal is { id, text, steps: [{ id, text, done }] }. The steps are what turn a wish
// into something you can act on — "be more confident" is not a thing you can do on a
// Tuesday, but "speak up once in class" is.
export function goalProgress(goal) {
  const steps = goal?.steps || []
  const done = steps.filter((s) => s.done).length
  return {
    done,
    total: steps.length,
    // A goal with no steps yet isn't 100% done — it's just not broken down.
    percent: steps.length ? Math.round((done / steps.length) * 100) : 0,
    complete: steps.length > 0 && done === steps.length,
  }
}

// Everything, flattened, with its horizon attached — for the overview.
export function allGoals(myGoals = {}) {
  return HORIZONS.flatMap((h) =>
    (myGoals[h.key] || []).map((g) => ({ ...g, horizon: h.key, horizonLabel: h.label })),
  )
}
