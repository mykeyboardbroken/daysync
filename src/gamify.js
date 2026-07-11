// XP + levels. Completing things earns XP; each level needs more than the last
// (the gap from level L to L+1 is 50·L XP), so it gets harder as you climb.
// Every level has its own name + icon.

export const LEVEL_TIERS = [
  { name: 'Sprout', icon: 'sprout' },
  { name: 'Spark', icon: 'bolt' },
  { name: 'Riser', icon: 'sunrise' },
  { name: 'Star', icon: 'star' },
  { name: 'Climber', icon: 'trendingUp' },
  { name: 'Grinder', icon: 'flame' },
  { name: 'Achiever', icon: 'medal' },
  { name: 'Champion', icon: 'trophy' },
  { name: 'Elite', icon: 'cap' },
  { name: 'Master', icon: 'crown' },
  { name: 'Legend', icon: 'sun' },
  { name: 'Mythic', icon: 'star' },
]

// XP required to REACH level L (0 for level 1). Triangular → each step costs more.
const threshold = (L) => 25 * L * (L - 1)

// Public: total XP needed to reach a given level.
export function xpForLevel(L) {
  return threshold(L)
}

export function levelInfo(xp) {
  const x = Math.max(0, xp || 0)
  let L = 1
  while (threshold(L + 1) <= x) L++
  const base = threshold(L)
  const next = threshold(L + 1)
  const tier = LEVEL_TIERS[Math.min(L, LEVEL_TIERS.length) - 1]
  return {
    level: L,
    name: tier.name,
    icon: tier.icon,
    into: x - base, // XP earned into the current level
    need: next - base, // XP the current level spans
    total: x,
  }
}
