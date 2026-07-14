// Free, offline workout generator. Two separate sessions:
//   • Sport training — drills based on the user's sports.
//   • General workout — strength that ROTATES push → pull → legs by day (+ core),
//     using only the equipment they have (or full gym).
// Deterministic per day (+ a reshuffle seed) so it's stable through the day.

// Sport-specific drills grouped by skill aspect. One sport is trained per day
// (rotating through the user's picks); drills weight toward the aspects they've
// marked as weak (see profile.sportSkills).
// Each aspect: a short description (so the user knows what it means) + drills.
const SPORT_SKILLS = {
  'Football / Soccer': {
    Passing: { desc: 'Accuracy and weight of your passes.', drills: ['Passing against a wall — 5 min each foot', 'Long-ball accuracy — 20 reps', 'One-touch passing — 10 min'] },
    Dribbling: { desc: 'Close control and beating defenders.', drills: ['Dribbling through cones — 5 rounds', '1-v-1 close control — 10 min', 'Juggling practice — 5 min'] },
    Shooting: { desc: 'Finishing and power in front of goal.', drills: ['Shooting drills — 20 shots', 'Finishing under pressure — 15 reps', 'Volleys — 15 reps'] },
    Fitness: { desc: 'Speed, agility and stamina on the pitch.', drills: ['Sprint & change of direction — 6 × 20 m', 'Shuttle runs — 8 × 40 m', 'Interval run — 6 × 1 min'] },
  },
  Basketball: {
    Shooting: { desc: 'Form, free throws and range.', drills: ['Shooting form & free throws — 50 shots', 'Catch-and-shoot — 30 makes', 'Three-point routine — 40 shots'] },
    'Ball-handling': { desc: 'Dribbling control and moves.', drills: ['Crossover & between-legs — 10 min', 'Figure-8 dribbling — 5 min', 'Stationary handling combos — 8 min'] },
    Defense: { desc: 'Staying in front and rebounding.', drills: ['Defensive slides — 4 × 30 s', 'Closeouts — 10 reps', 'Box-out & rebound — 10 min'] },
    Conditioning: { desc: 'Endurance to run the whole game.', drills: ['Suicides — 6 rounds', 'Full-court sprints — 8', 'Layup lines (continuous) — 5 min'] },
  },
  Rugby: {
    Passing: { desc: 'Spin, pop and long passes.', drills: ['Spin-pass drills — 10 min', 'Pop passes — 10 min', 'Long-pass accuracy — 20 reps'] },
    Tackling: { desc: 'Safe, effective tackle technique.', drills: ['Tackle technique on a bag — 20 reps', 'Ruck & body position — 10 min'] },
    Handling: { desc: 'Catching and offloading under pressure.', drills: ['Catch under pressure — 10 min', 'Offload practice — 10 min'] },
    Fitness: { desc: 'Footwork, speed and stamina.', drills: ['Footwork & sidestep — 6 × 20 m', 'Sprints — 8 × 40 m', 'Interval run — 6 × 1 min'] },
  },
  Netball: {
    Passing: { desc: 'Sharp, accurate passes.', drills: ['Chest & shoulder passes — 10 min', 'Passing on the move — 10 min'] },
    Footwork: { desc: 'Landing, pivots and getting free.', drills: ['Pivots & landings — 10 min', 'Dodging & leading — 5 min'] },
    Shooting: { desc: 'Accuracy in the circle.', drills: ['Shooting practice — 40 shots', 'Shooting under pressure — 20 shots'] },
    Defense: { desc: 'Marking and intercepting.', drills: ['Defensive marking — 10 min', 'Intercept timing — 10 min'] },
  },
  'Running / Athletics': {
    Speed: { desc: 'Top-end pace and acceleration.', drills: ['Sprint intervals — 8 × 100 m', 'Hill sprints — 6 × 30 s', 'Strides — 6 × 100 m'] },
    Endurance: { desc: 'Holding pace over distance.', drills: ['Steady run — 25 min', 'Tempo run — 3 × 3 min', 'Long run — 30–40 min'] },
    Technique: { desc: 'Running form and efficiency.', drills: ['Drills (A-skips, high knees) — 10 min', 'Stride form work — 6 × 80 m'] },
  },
  Cricket: {
    Batting: { desc: 'Shot-making and footwork at the crease.', drills: ['Batting in the nets — 20 min', 'Shadow batting footwork — 10 min'] },
    Bowling: { desc: 'Line, length and variations.', drills: ['Bowling line & length — 30 balls', 'Yorker practice — 20 balls'] },
    Fielding: { desc: 'Catching, throwing and stopping runs.', drills: ['Catching practice — 15 min', 'Throwing accuracy — 20 throws', 'Ground fielding — 10 min'] },
  },
  Swimming: {
    Technique: { desc: 'Stroke efficiency and form.', drills: ['Drills (catch & kick) — 400 m', 'Single-arm drill — 200 m'] },
    Endurance: { desc: 'Holding pace over long sets.', drills: ['Steady swim — 800 m', 'Pull-buoy set — 400 m'] },
    Speed: { desc: 'Sprint power off the wall.', drills: ['Sprint set — 8 × 25 m', 'Interval set — 8 × 50 m'] },
  },
  Tennis: {
    Groundstrokes: { desc: 'Forehand and backhand consistency.', drills: ['Groundstroke rally — 15 min', 'Cross-court drills — 15 min'] },
    Serve: { desc: 'Power and reliability on serve.', drills: ['Serve practice — 40 serves', 'Second-serve consistency — 20 serves'] },
    'Net play': { desc: 'Volleys and finishing at the net.', drills: ['Volleys at the net — 10 min', 'Approach & volley — 10 min'] },
    Footwork: { desc: 'Movement and court coverage.', drills: ['Footwork ladder — 5 min', 'Split-step & recovery — 10 min'] },
  },
  Volleyball: {
    Passing: { desc: 'Platform control on digs and receives.', drills: ['Wall passing — 10 min', 'Partner digs — 10 min', 'Serve receive — 20 reps'] },
    Setting: { desc: 'Clean, consistent hands.', drills: ['Wall setting — 8 min', 'Setting to target — 30 reps'] },
    Serving: { desc: 'Getting the serve in, then getting it tough.', drills: ['Serve practice — 30 serves', 'Serve to zones — 20 serves'] },
    Hitting: { desc: 'Approach, timing and the swing.', drills: ['Approach footwork — 15 reps', 'Hitting off a toss — 20 swings'] },
  },
  Badminton: {
    Clears: { desc: 'Depth and control to the back court.', drills: ['Overhead clears — 10 min', 'Clear-to-clear rally — 10 min'] },
    'Net play': { desc: 'Soft hands at the net.', drills: ['Net shots — 10 min', 'Net kill reactions — 5 min'] },
    Smash: { desc: 'Power and steepness on the attack.', drills: ['Smash practice — 30 reps', 'Jump smash technique — 15 reps'] },
    Footwork: { desc: 'Covering the court in six directions.', drills: ['Shadow footwork — 6 × 1 min', 'Corner-to-corner movement — 10 min'] },
  },
  Hockey: {
    Passing: { desc: 'Push passes and receiving cleanly.', drills: ['Push-pass against a wall — 10 min', 'Receiving on the move — 10 min'] },
    Dribbling: { desc: 'Close stick control and beating a defender.', drills: ['Indian dribble — 8 min', 'Dribble through cones — 5 rounds'] },
    Shooting: { desc: 'Finishing from the circle.', drills: ['Shooting practice — 20 shots', 'Deflections — 15 reps'] },
    Fitness: { desc: 'Speed and stamina over a full game.', drills: ['Shuttle runs — 8 × 40 m', 'Interval run — 6 × 1 min'] },
  },
  Dance: {
    Technique: { desc: 'Clean lines, control and placement.', drills: ['Technique drill — 15 min', 'Isolations & control — 10 min'] },
    Flexibility: { desc: 'Range of motion, safely built.', drills: ['Guided stretch flow — 15 min', 'Active mobility — 10 min'] },
    Choreography: { desc: 'Learning and retaining sequences.', drills: ['Learn 8 counts — 15 min', 'Run the routine — 5 rounds'] },
    Stamina: { desc: 'Holding quality through a full piece.', drills: ['Full-out run-through — 3 rounds', 'Cardio intervals — 10 min'] },
  },
}

// The skill aspects for a sport (for the strong/weak picker).
export function sportAspects(sport) {
  return Object.keys(SPORT_SKILLS[sport] || {})
}

// A short description of what a sport aspect means.
export function sportAspectDesc(sport, aspect) {
  return SPORT_SKILLS[sport]?.[aspect]?.desc || ''
}

// General strength by body part; each exercise tags the equipment it needs. The
// day's rotation picks one part; only exercises whose gear you have are used.
const GENERAL = {
  push: [
    'Push-ups — 4 × 12',
    'Incline push-ups (hands on a chair) — 3 × 15',
    'Pike push-ups — 3 × 10',
    'Diamond push-ups — 3 × 10',
    'Wide push-ups — 3 × 12',
    'Tricep dips off a chair — 3 × 12',
    'Wall handstand hold — 3 × 20 s',
  ],
  pull: [
    'Towel rows under a table — 3 × 12',
    'Superman holds — 3 × 20 s',
    'Reverse snow angels — 3 × 15',
    'Doorway rows (grip the frame, lean back) — 3 × 12',
    'Towel curls (pull against your own arm) — 3 × 15',
    'Backpack rows (load it with books) — 3 × 12 each side',
    'Prone Y-T-W raises — 3 × 10',
  ],
  legs: [
    'Bodyweight squats — 4 × 15',
    'Walking lunges — 3 × 12 each leg',
    'Glute bridges — 3 × 15',
    'Bulgarian split squats (back foot on a chair) — 3 × 10 each leg',
    'Wall sit — 3 × 45 s',
    'Calf raises on a step — 3 × 20',
    'Step-ups on a chair — 3 × 12 each leg',
    'Single-leg glute bridge — 3 × 12 each side',
  ],
  core: [
    'Plank — 3 × 45 s',
    'Bicycle crunches — 3 × 20',
    'Russian twists — 3 × 20',
    'Leg raises — 3 × 15',
    'Dead bugs — 3 × 12 each side',
    'Side plank — 3 × 30 s each side',
  ],
  cardio: [
    'Easy run — 25 min',
    'Interval run — 8 × 1 min hard / 1 min easy',
    'Hill sprints — 6 × 30 s',
    'Shuttle runs — 8 × 40 m',
    'Stair sprints — 8 rounds',
    'Tempo run — 3 × 5 min',
    'Skipping — 10 × 1 min',
    'Brisk walk — 35 min',
  ],
  // Short, sharp finishers to close a cardio day out.
  burner: [
    'Burpees — 5 × 10',
    'Mountain climbers — 4 × 30 s',
    'Jump squats — 3 × 15',
    'High knees — 4 × 30 s',
  ],
}

// The rotation, one day at a time. Cardio is a day of its own rather than a finisher
// bolted onto every session, and REST is a real day — training every single day with
// no recovery isn't a programme, it's a treadmill.
const ROTATION = [
  { key: 'push', label: 'Push day' },
  { key: 'pull', label: 'Pull day' },
  { key: 'legs', label: 'Legs day' },
  { key: 'rest', label: 'Rest day' },
  { key: 'cardio', label: 'Cardio day' },
  { key: 'core', label: 'Core day' },
  { key: 'rest', label: 'Rest day' },
]

const RESTS = [
  'Rest today — that\'s when you actually get stronger.',
  'Nothing scheduled. Go for a walk if you feel like moving.',
  'Recovery day. Stretch if you want, or do nothing at all.',
]

const WARMUPS = [
  'Warm-up: 5 min light jog + dynamic stretches',
  'Warm-up: 5 min brisk walk + mobility drills',
  'Warm-up: arm & leg swings + 20 jumping jacks',
  'Warm-up: 2 min marching on the spot + shoulder circles',
]
const COOLDOWNS = [
  'Cool-down: 5 min easy walk + stretching',
  'Cool-down: full-body stretch, 5 min',
  'Cool-down: light stretch + deep breathing',
]

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickSome(pool, n, rand, seen) {
  const out = []
  let guard = 0
  while (out.length < n && guard < 60) {
    const x = pool[Math.floor(rand() * pool.length)]
    if (x && !seen.has(x)) {
      seen.add(x)
      out.push(x)
    }
    guard++
  }
  return out
}

function dayNumber(date) {
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
}

function pickWarmup(rand) {
  return WARMUPS[Math.floor(rand() * WARMUPS.length)]
}

// Right-size the session by age. College age (the app's main audience) gets the
// full workout; younger and older get something shorter/easier.
function intensityForAge(age) {
  const a = parseInt(age, 10)
  if (!a || (a >= 16 && a <= 34)) return { main: 3, sport: 4 } // full (incl. unknown)
  if (a < 16 || a >= 50) return { main: 2, sport: 3 } // shorter & easier
  return { main: 3, sport: 3 } // 35–49 — slightly shorter
}

// Whether a workout applies at all (they told us when they train).
export function hasWorkout(profile) {
  return !!profile && !!profile.workoutTime
}

// Sport-specific session — one sport per day, rotating through the user's picks.
// Drills weight toward the aspects marked "weak" (and away from "strong").
// Returns { steps, label } (label = today's sport), or null if they play none.
export function generateSport(profile = {}, date = new Date(), seed = 0) {
  const sports = profile.sports || []
  if (!sports.length) return null
  const today = sports[(dayNumber(date) + seed) % sports.length]
  const skills = SPORT_SKILLS[today]
  if (!skills) return null
  const focus = (profile.sportSkills && profile.sportSkills[today]) || {}
  const rand = mulberry32(dayNumber(date) + seed * 131 + 7)
  const seen = new Set()
  const count = intensityForAge(profile.age).sport

  // Aspects ordered weak → okay/neutral → strong. Do a full cycle first (so every
  // area still gets a look), then feature the weak ones extra — weighted toward
  // weak, not limited to it.
  const rank = (a) => (focus[a] === 'weak' ? 0 : focus[a] === 'strong' ? 2 : 1)
  const aspects = Object.keys(skills).sort((a, b) => rank(a) - rank(b))
  const weakAspects = aspects.filter((a) => focus[a] === 'weak')
  const sequence = [...aspects, ...weakAspects]

  const steps = [pickWarmup(rand)]
  let i = 0
  while (steps.length < count + 1 && i < sequence.length * 3) {
    const drill = pickSome(skills[sequence[i % sequence.length]].drills, 1, rand, seen)[0]
    if (drill) steps.push(drill)
    i++
  }
  steps.push(COOLDOWNS[Math.floor(rand() * COOLDOWNS.length)])
  return { steps, label: today }
}

// The workout: a 7-day rotation of push / pull / legs / rest / cardio / core / rest.
// Everything is BODYWEIGHT — no gym, no gear, no "do you own dumbbells?" question.
// That means it works for everyone, anywhere, and it can't hand a 13-year-old a
// barbell it never taught them to use.
// Returns { steps, label }.
export function generateGeneral(profile = {}, date = new Date(), seed = 0) {
  const rand = mulberry32(dayNumber(date) + seed * 197 + 13)
  const seen = new Set()
  const rot = ROTATION[(dayNumber(date) + seed) % ROTATION.length]

  if (rot.key === 'rest') {
    return { steps: [RESTS[Math.floor(rand() * RESTS.length)]], label: rot.label, rest: true }
  }

  const steps = [pickWarmup(rand)]
  if (rot.key === 'cardio') {
    // A cardio session is ONE main effort — nobody does three separate runs — so it's
    // a single piece of work plus a short burner, rather than a list of them.
    steps.push(...pickSome(GENERAL.cardio, 1, rand, seen))
    steps.push(...pickSome(GENERAL.burner, 1, rand, seen))
  } else {
    steps.push(...pickSome(GENERAL[rot.key], intensityForAge(profile.age).main, rand, seen))
  }
  // Core day already IS core — don't tack another one on the end of it.
  if (rot.key !== 'core') steps.push(...pickSome(GENERAL.core, 1, rand, seen))
  steps.push(COOLDOWNS[Math.floor(rand() * COOLDOWNS.length)])
  return { steps, label: rot.label }
}
