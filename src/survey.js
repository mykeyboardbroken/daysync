import { HORIZONS } from './goals'
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
// KEEP THIS SHORT. DaySync is a school planner — that's what a new person should
// meet on first open. Everything optional (training, sports, body metrics) lives in
// Settings → Profile and is OFF until someone deliberately turns it on. We do not
// ask for gender or titles: every user is just an ambitious student.
export const SURVEY_QUESTIONS = [
  {
    id: 'name',
    type: 'text',
    question: 'What should we call you?',
    placeholder: 'First name or nickname',
  },
  {
    id: 'gender',
    type: 'single',
    question: 'What gender are you?',
    hint: "Kept private on your device. It doesn't change your tasks or workouts.",
    options: ['Male', 'Female', 'Other', 'Rather not say'],
  },
  {
    id: 'age',
    type: 'text',
    question: 'How old are you?',
    hint: 'Only used to size a session if you turn training on.',
    placeholder: 'e.g. 14',
    skipLabel: 'Rather not say',
  },
  // Sport IS a school thing — half a year group plays one — so it earns its place in
  // onboarding in a way a gym question never would. One question, skippable, and it
  // powers the drills. Training time defaults to the afternoon (see finishSurvey),
  // because that's when school sport actually happens.
  // What they're actually aiming at, in their own words. Three horizons, because a
  // goal with no timeframe is a wish. All optional — the Next button never blocks.
  {
    id: 'myGoals',
    type: 'goals',
    question: 'What are you working on?',
    hint: 'Write as many or as few as you like. You can change them any time.',
    horizons: HORIZONS,
  },
  {
    id: 'sports',
    type: 'multi',
    question: 'Do you play any sports?',
    hint: 'You get drills for these. Pick any, or skip — plenty of people don’t.',
    options: [
      'Football / Soccer',
      'Basketball',
      'Netball',
      'Rugby',
      'Volleyball',
      'Hockey',
      'Dance',
      'Running / Athletics',
      'Swimming',
      'Tennis',
      'Badminton',
      'Cricket',
    ],
  },
]
