// Free, offline workout generator. Two separate sessions:
//   • Sport training — drills based on the user's sports.
//   • General workout — strength that ROTATES push → pull → legs by day (+ core),
//     using only the equipment they have (or full gym).
// Deterministic per day (+ a reshuffle seed) so it's stable through the day.

// Actual sport-specific drills (skills + conditioning for that sport). One sport
// is trained per day, rotating through the ones the user picked.
const SPORT_DRILLS = {
  'Football / Soccer': [
    'Dribbling through cones — 5 rounds',
    'Passing against a wall — 5 min each foot',
    'Shooting drills — 20 shots',
    'Sprint & change of direction — 6 × 20 m',
    '1-v-1 close control — 10 min',
    'Juggling practice — 5 min',
  ],
  Basketball: [
    'Ball-handling (crossovers, between legs) — 10 min',
    'Shooting form & free throws — 50 shots',
    'Layup lines — 20 each side',
    'Defensive slides — 4 × 30 s',
    'Figure-8 dribbling — 5 min',
    'Suicides / court sprints — 6 rounds',
  ],
  Rugby: [
    'Spin-pass drills — 10 min',
    'Tackling technique on a bag — 20 reps',
    'Rucking & body position — 10 min',
    'Footwork & sidestep — 6 × 20 m',
    'Catch under pressure — 10 min',
  ],
  Netball: [
    'Passing (chest & shoulder) drills — 10 min',
    'Footwork & pivots — 10 min',
    'Shooting practice — 40 shots',
    'Dodging & leading — 5 min',
    'Defensive marking — 10 min',
  ],
  'Running / Athletics': [
    'Interval run — 6 × 400 m',
    'Tempo run — 20 min',
    'Hill repeats — 8 × 30 s',
    'Strides — 6 × 100 m',
    'Long easy run — 30–40 min',
  ],
  Cricket: [
    'Batting in the nets — 20 min',
    'Bowling line & length — 30 balls',
    'Fielding & catching — 15 min',
    'Throwing accuracy — 20 throws',
    'Footwork drills — 10 min',
  ],
  Swimming: [
    'Warm-up laps — 200 m',
    'Technique drills (catch & kick) — 400 m',
    'Interval set — 8 × 50 m',
    'Pull-buoy set — 300 m',
    'Sprint set — 4 × 25 m',
  ],
  Tennis: [
    'Groundstroke rally — 15 min',
    'Serve practice — 40 serves',
    'Volleys at the net — 10 min',
    'Footwork ladder — 5 min',
    'Cross-court drills — 15 min',
  ],
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
// Returns { steps, label } (label = today's sport), or null if they play none.
export function generateSport(profile = {}, date = new Date(), seed = 0) {
  const sports = profile.sports || []
  if (!sports.length) return null
  const today = sports[(dayNumber(date) + seed) % sports.length]
  const pool = SPORT_DRILLS[today] || []
  if (!pool.length) return null
  const rand = mulberry32(dayNumber(date) + seed * 131 + 7)
  const seen = new Set()
  const steps = [WARMUPS[Math.floor(rand() * WARMUPS.length)]]
  steps.push(...pickSome(pool, intensityForAge(profile.age).sport, rand, seen))
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
