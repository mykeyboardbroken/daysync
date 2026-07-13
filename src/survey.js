// The first-open onboarding survey. Add / edit questions here — the modal renders
// them in order and stores answers by `id` into the user's profile.
//
// Question types:
//   { id, type: 'text',   question, hint?, placeholder?, skipLabel?, units? }
// `skipLabel` on a text question adds a button that clears the answer and moves
// on (e.g. "Rather not say"), so nobody has to type something they'd rather not.
// `units` adds a unit toggle beside the input (first one is the default); the
// choice is stored alongside the answer as `<id>Unit` — e.g. weight + weightUnit.
//   { id, type: 'single', question, hint?, options: ['A', 'B', ...] }
//   { id, type: 'multi',  question, hint?, options: ['A', 'B', ...] }
// A question may also carry `showIf: (answers) => bool` to appear conditionally.
//
// Every user is treated the same: an ambitious student optimising their time.
// We do NOT ask for gender, titles, or body metrics — none of it would change what
// the app does, so asking is just friction (and, for some people, pressure).
//
// Training is OPT-IN and asked, never assumed: "do you work out?" and "do you play
// sports?" gate everything downstream. Say no to both and the app simply never
// mentions training again — no nagging, no goals, no body metrics.
export const SURVEY_QUESTIONS = [
  { id: 'name', type: 'text', question: 'What should we call you?', placeholder: 'First name or nickname' },
  {
    id: 'age',
    type: 'text',
    question: 'How old are you?',
    hint: 'Used to right-size your workout — shorter/easier or a bit longer.',
    placeholder: 'e.g. 19',
  },

  // ---- Workout (entirely optional) ----
  {
    id: 'worksOut',
    type: 'single',
    question: 'Do you work out?',
    hint: "Totally fine either way — say no and we'll leave workouts out of your day.",
    options: ['Yes', 'No'],
  },
  {
    id: 'gym',
    type: 'single',
    question: 'Do you have access to a gym?',
    options: ['Yes', 'No'],
    showIf: (a) => a.worksOut === 'Yes',
  },
  {
    id: 'equipment',
    type: 'multi',
    question: 'What equipment do you have at home?',
    hint: 'Just so workouts fit what you’ve got. Pick any.',
    options: ['Dumbbells', 'Resistance bands', 'Pull-up bar', 'Kettlebell', 'Skipping rope', 'Just bodyweight'],
    showIf: (a) => a.worksOut === 'Yes' && a.gym === 'No',
  },
  {
    id: 'workoutTime',
    type: 'single',
    question: 'When do you work out?',
    hint: 'Your workout will sit in this part of your day.',
    options: ['Morning', 'Afternoon', 'Night', 'Anytime'],
    showIf: (a) => a.worksOut === 'Yes',
  },

  // ---- Sport (entirely optional) ----
  {
    id: 'playsSport',
    type: 'single',
    question: 'Do you play any sports?',
    options: ['Yes', 'No'],
  },
  {
    id: 'sports',
    type: 'multi',
    question: 'Which ones?',
    hint: 'You get drills specific to these.',
    options: [
      'Football / Soccer',
      'Basketball',
      'Rugby',
      'Netball',
      'Running / Athletics',
      'Cricket',
      'Swimming',
      'Tennis',
      'Volleyball',
      'Badminton',
      'Hockey',
      'Dance',
    ],
    showIf: (a) => a.playsSport === 'Yes',
  },
  {
    id: 'sportTime',
    type: 'single',
    question: 'When do you train for it?',
    hint: 'Your sport drills will sit in this part of your day.',
    options: ['Morning', 'Afternoon', 'Night', 'Anytime'],
    showIf: (a) => a.playsSport === 'Yes' && (a.sports || []).length > 0,
  },
]
