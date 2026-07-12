// The first-open onboarding survey. Add / edit questions here — the modal renders
// them in order and stores answers by `id` into the user's profile.
//
// Question types:
//   { id, type: 'text',   question, hint?, placeholder?, skipLabel? }
// `skipLabel` on a text question adds a button that clears the answer and moves
// on (e.g. "Rather not say"), so nobody has to type something they'd rather not.
//   { id, type: 'single', question, hint?, options: ['A', 'B', ...] }
//   { id, type: 'multi',  question, hint?, options: ['A', 'B', ...] }
// A question may also carry `showIf: (answers) => bool` to appear conditionally.
export const SURVEY_QUESTIONS = [
  { id: 'name', type: 'text', question: "What's your name?", placeholder: 'Your name' },
  {
    id: 'gender',
    type: 'single',
    question: 'What gender are you?',
    hint: 'Kept private on your device. Optional — skip if you like.',
    options: ['Male', 'Female', 'Other'],
  },
  {
    id: 'age',
    type: 'text',
    question: 'How old are you?',
    hint: 'Used to right-size your workout — shorter/easier or a bit longer.',
    placeholder: 'e.g. 19',
  },
  {
    id: 'weight',
    type: 'text',
    question: 'What do you weigh?',
    hint: 'Sharing this helps personalise your training. Private — kept on your device.',
    placeholder: 'e.g. 70 kg',
    skipLabel: 'Rather not say',
  },
  {
    id: 'height',
    type: 'text',
    question: 'How tall are you?',
    hint: 'Sharing this helps personalise your training. Private — kept on your device.',
    placeholder: 'e.g. 175 cm',
    skipLabel: 'Rather not say',
  },
  {
    id: 'sports',
    type: 'multi',
    question: 'What sports do you play?',
    hint: 'Your workout gets sport-specific drills for these. Skip if none.',
    options: [
      'Football / Soccer',
      'Basketball',
      'Rugby',
      'Netball',
      'Running / Athletics',
      'Cricket',
      'Swimming',
      'Tennis',
    ],
  },
  {
    id: 'gym',
    type: 'single',
    question: 'Do you have access to a gym?',
    options: ['Yes', 'No'],
  },
  {
    id: 'equipment',
    type: 'multi',
    question: 'What equipment do you have at home?',
    hint: 'Just so workouts fit what you’ve got. Pick any.',
    options: ['Dumbbells', 'Resistance bands', 'Pull-up bar', 'Kettlebell', 'Skipping rope', 'Just bodyweight'],
    showIf: (a) => a.gym === 'No',
  },
  {
    id: 'sportTime',
    type: 'single',
    question: 'When do you do sport training?',
    hint: 'Your sport drills will sit in this part of your day.',
    options: ['Morning', 'Afternoon', 'Night', 'Anytime', "I don't"],
    showIf: (a) => (a.sports || []).length > 0,
  },
  {
    id: 'workoutTime',
    type: 'single',
    question: 'When do you do a general workout?',
    hint: 'Your strength workout will sit in this part of your day.',
    options: ['Morning', 'Afternoon', 'Night', 'Anytime', "I don't"],
  },
]
