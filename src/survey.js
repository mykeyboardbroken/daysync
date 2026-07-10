// The first-open onboarding survey. Add / edit questions here — the modal renders
// them in order and stores answers by `id` into the user's profile.
//
// Question types:
//   { id, type: 'text',   question, hint?, placeholder? }
//   { id, type: 'single', question, hint?, options: ['A', 'B', ...] }
//   { id, type: 'multi',  question, hint?, options: ['A', 'B', ...] }
export const SURVEY_QUESTIONS = [
  { id: 'name', type: 'text', question: "What's your name?", placeholder: 'Your name' },
]
