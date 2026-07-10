// Free, offline workout generator. A curated exercise library — no AI, no cost.
// A session blends sport-specific drills (from the user's sports) with general
// strength/conditioning that fits their gym access / home equipment. Sessions
// are deterministic per day (+ a reshuffle seed) so they vary but stay stable
// through the day.

// Sport → training focuses that drive the sport-specific drills.
const SPORT_FOCUS = {
  'Football / Soccer': ['agility', 'power', 'endurance'],
  Basketball: ['jump', 'agility', 'power'],
  Rugby: ['power', 'agility', 'endurance'],
  Netball: ['jump', 'agility'],
  'Running / Athletics': ['endurance', 'intervals'],
  Cricket: ['power', 'agility'],
  Swimming: ['endurance', 'power'],
  Tennis: ['agility', 'power'],
}

// Sport-specific drills — bodyweight / field based, no equipment needed.
const DRILLS = {
  agility: [
    'Ladder drills — 4 rounds',
    'Cone shuttle runs — 6 × 20 m',
    'Lateral bounds — 3 × 12',
    'High-knee sprints — 4 × 20 m',
  ],
  jump: [
    'Box / step jumps — 4 × 8',
    'Tuck jumps — 3 × 10',
    'Broad jumps — 4 × 8',
    'Pogo hops — 3 × 20',
  ],
  power: [
    'Squat jumps — 4 × 10',
    'Jump lunges — 3 × 10 each leg',
    'Explosive push-ups — 3 × 8',
    'Med-ball / backpack slams — 4 × 10',
  ],
  endurance: [
    'Steady run — 20 min',
    'Shuttle runs — 8 × 40 m',
    'Skipping — 5 × 2 min',
    'Bike or row — 15 min',
  ],
  intervals: [
    'Sprint intervals — 8 × 100 m',
    'Hill sprints — 6 × 30 s',
    'Tempo run — 3 × 3 min',
  ],
}

// General strength / conditioning by available equipment. Bodyweight & core are
// always in the pool; the rest unlock from gym access or home gear.
const GENERAL = {
  bodyweight: [
    'Push-ups — 4 × 12',
    'Bodyweight squats — 4 × 15',
    'Walking lunges — 3 × 12 each leg',
    'Glute bridges — 3 × 15',
    'Mountain climbers — 3 × 30 s',
    'Burpees — 3 × 10',
  ],
  core: [
    'Plank — 3 × 45 s',
    'Bicycle crunches — 3 × 20',
    'Russian twists — 3 × 20',
    'Leg raises — 3 × 15',
    'Side plank — 3 × 30 s each side',
  ],
  dumbbells: [
    'Dumbbell goblet squats — 4 × 12',
    'Dumbbell shoulder press — 3 × 10',
    'Dumbbell rows — 3 × 10 each side',
    'Dumbbell lunges — 3 × 10 each leg',
    'Dumbbell curls — 3 × 12',
  ],
  bands: [
    'Band squats — 3 × 15',
    'Band rows — 3 × 15',
    'Band pull-aparts — 3 × 20',
    'Band shoulder press — 3 × 12',
  ],
  pullupBar: ['Pull-ups — 4 × max', 'Chin-ups — 3 × 8', 'Hanging leg raises — 3 × 12'],
  kettlebell: [
    'Kettlebell swings — 4 × 15',
    'Kettlebell goblet squat — 4 × 12',
    'Kettlebell deadlift — 3 × 10',
  ],
  skippingRope: ['Skipping — 5 × 2 min'],
  gym: [
    'Barbell squats — 4 × 8',
    'Bench press — 4 × 8',
    'Lat pulldown — 3 × 10',
    'Leg press — 4 × 12',
    'Deadlifts — 3 × 6',
    'Cable rows — 3 × 12',
  ],
}

const EQUIPMENT_KEY = {
  Dumbbells: 'dumbbells',
  'Resistance bands': 'bands',
  'Pull-up bar': 'pullupBar',
  Kettlebell: 'kettlebell',
  'Skipping rope': 'skippingRope',
}

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

// Deterministic PRNG so a given (day + seed) always yields the same session.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Pick up to n distinct items from a pool using rand().
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

// Whether a workout applies at all (they told us when they train).
export function hasWorkout(profile) {
  return !!profile && !!profile.workoutTime
}

// Build today's session as a flat list of steps (warm-up → sport drills →
// general strength → core → cool-down).
export function generateWorkout(profile = {}, date = new Date(), seed = 0) {
  const dayNum = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  const rand = mulberry32(dayNum + seed * 101 + 1)
  const seen = new Set()

  const sports = profile.sports || []
  const focuses = [...new Set(sports.flatMap((s) => SPORT_FOCUS[s] || []))]

  // General pool: always bodyweight; add gym or the specific home equipment.
  const generalPool = [...GENERAL.bodyweight]
  if (profile.gym === 'Yes') generalPool.push(...GENERAL.gym)
  else {
    for (const label of profile.equipment || []) {
      const key = EQUIPMENT_KEY[label]
      if (key && GENERAL[key]) generalPool.push(...GENERAL[key])
    }
  }

  const steps = []
  steps.push(WARMUPS[Math.floor(rand() * WARMUPS.length)])

  // Sport-specific block (skipped if no sports).
  if (focuses.length) {
    for (const f of pickSome(focuses.slice().sort(() => rand() - 0.5), Math.min(3, focuses.length), () => rand(), new Set())) {
      const drill = pickSome(DRILLS[f] || [], 1, rand, seen)[0]
      if (drill) steps.push(drill)
    }
  }

  // General strength / conditioning — more if there's no sport block.
  steps.push(...pickSome(generalPool, focuses.length ? 2 : 4, rand, seen))
  // One core finisher.
  steps.push(...pickSome(GENERAL.core, 1, rand, seen))

  steps.push(COOLDOWNS[Math.floor(rand() * COOLDOWNS.length)])
  return steps
}
