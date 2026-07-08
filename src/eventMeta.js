// Dated events come in two kinds: a `test` (graded, has an importance level) or a
// plain `date` (just a day to remember). Tests are either an assessment or an
// exam — exams are the higher-importance of the two.
// Kept mostly-monochrome: assessment is a neutral chip, exam a muted red so the
// higher-importance one still reads at a glance.
export const TEST_TYPES = {
  assessment: { label: 'Assessment', color: '#3a4556', rank: 1 },
  exam: { label: 'Exam', color: '#9a4444', rank: 2 },
}

// The importance badge for an event, or null if it's a plain date.
export function testMeta(e) {
  return e && e.kind === 'test' ? TEST_TYPES[e.testType] || null : null
}

// Can a grade be recorded on this? Tests always; plus any legacy event that was
// already graded before tests/dates were split (so no old grade is lost).
export function isGradable(e) {
  return !!e && (e.kind === 'test' || !!e.result)
}
