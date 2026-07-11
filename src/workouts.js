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
    { name: 'Push-ups — 4 × 12', eq: 'bodyweight' },
    { name: 'Pike push-ups — 3 × 10', eq: 'bodyweight' },
    { name: 'Diamond push-ups — 3 × 10', eq: 'bodyweight' },
    { name: 'Dumbbell shoulder press — 3 × 10', eq: 'dumbbells' },
    { name: 'Dumbbell floor press — 3 × 12', eq: 'dumbbells' },
    { name: 'Band shoulder press — 3 × 12', eq: 'bands' },
    { name: 'Bench press — 4 × 8', eq: 'gym' },
    { name: 'Overhead press — 3 × 8', eq: 'gym' },
  ],
  pull: [
    { name: 'Superman holds — 3 × 20 s', eq: 'bodyweight' },
    { name: 'Reverse snow angels — 3 × 15', eq: 'bodyweight' },
    { name: 'Towel rows under a table — 3 × 12', eq: 'bodyweight' },
    { name: 'Pull-ups — 4 × max', eq: 'pullupBar' },
    { name: 'Chin-ups — 3 × 8', eq: 'pullupBar' },
    { name: 'Dumbbell rows — 3 × 10 each side', eq: 'dumbbells' },
    { name: 'Dumbbell curls — 3 × 12', eq: 'dumbbells' },
    { name: 'Band rows — 3 × 15', eq: 'bands' },
    { name: 'Band pull-aparts — 3 × 20', eq: 'bands' },
    { name: 'Lat pulldown — 3 × 10', eq: 'gym' },
    { name: 'Cable rows — 3 × 12', eq: 'gym' },
  ],
  legs: [
    { name: 'Bodyweight squats — 4 × 15', eq: 'bodyweight' },
    { name: 'Walking lunges — 3 × 12 each leg', eq: 'bodyweight' },
    { name: 'Glute bridges — 3 × 15', eq: 'bodyweight' },
    { name: 'Bulgarian split squats — 3 × 10 each leg', eq: 'bodyweight' },
    { name: 'Dumbbell goblet squats — 4 × 12', eq: 'dumbbells' },
    { name: 'Dumbbell lunges — 3 × 10 each leg', eq: 'dumbbells' },
    { name: 'Kettlebell swings — 4 × 15', eq: 'kettlebell' },
    { name: 'Kettlebell deadlift — 3 × 10', eq: 'kettlebell' },
    { name: 'Band squats — 3 × 15', eq: 'bands' },
    { name: 'Barbell squats — 4 × 8', eq: 'gym' },
    { name: 'Leg press — 4 × 12', eq: 'gym' },
    { name: 'Romanian deadlifts — 3 × 8', eq: 'gym' },
  ],
  core: [
    { name: 'Plank — 3 × 45 s', eq: 'bodyweight' },
    { name: 'Bicycle crunches — 3 × 20', eq: 'bodyweight' },
    { name: 'Russian twists — 3 × 20', eq: 'bodyweight' },
    { name: 'Leg raises — 3 × 15', eq: 'bodyweight' },
    { name: 'Hanging leg raises — 3 × 12', eq: 'pullupBar' },
  ],
}

const EQUIPMENT_KEY = {
  Dumbbells: 'dumbbells',
  'Resistance bands': 'bands',
  'Pull-up bar': 'pullupBar',
  Kettlebell: 'kettlebell',
  'Skipping rope': 'skippingRope',
}

// The push/pull/legs rotation the general workout cycles through.
const ROTATION = [
  { key: 'push', label: 'Push day' },
  { key: 'pull', label: 'Pull day' },
  { key: 'legs', label: 'Legs day' },
]

const WARMUPS = [
  'Warm-up: 5 min light jog + dynamic stretches',
  'Warm-up: 3 min skipping + arm & leg swings',
  'Warm-up: 5 min brisk walk + mobility drills',
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

// Equipment the user can train with (bodyweight always available).
function availableEquip(profile) {
  const set = new Set(['bodyweight'])
  if (profile.gym === 'Yes') set.add('gym')
  else for (const label of profile.equipment || []) {
    const key = EQUIPMENT_KEY[label]
    if (key) set.add(key)
  }
  return set
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

  const steps = [WARMUPS[Math.floor(rand() * WARMUPS.length)]]
  let i = 0
  while (steps.length < count + 1 && i < sequence.length * 3) {
    const drill = pickSome(skills[sequence[i % sequence.length]].drills, 1, rand, seen)[0]
    if (drill) steps.push(drill)
    i++
  }
  steps.push(COOLDOWNS[Math.floor(rand() * COOLDOWNS.length)])
  return { steps, label: today }
}

// General strength — rotates push/pull/legs by day, plus a core finisher.
// Returns { steps, label } where label is e.g. "Push day".
export function generateGeneral(profile = {}, date = new Date(), seed = 0) {
  const rand = mulberry32(dayNumber(date) + seed * 197 + 13)
  const seen = new Set()
  const avail = availableEquip(profile)
  const rot = ROTATION[(dayNumber(date) + seed) % ROTATION.length]
  const pool = (part) => GENERAL[part].filter((e) => avail.has(e.eq)).map((e) => e.name)

  const steps = [WARMUPS[Math.floor(rand() * WARMUPS.length)]]
  steps.push(...pickSome(pool(rot.key), intensityForAge(profile.age).main, rand, seen))
  steps.push(...pickSome(pool('core'), 1, rand, seen))
  steps.push(COOLDOWNS[Math.floor(rand() * COOLDOWNS.length)])
  return { steps, label: rot.label }
}
