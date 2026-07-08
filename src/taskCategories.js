// What a task is for. Chosen when adding a task and shown as a small icon on
// each row. `other` is the catch-all / default for older tasks.
export const TASK_CATEGORIES = [
  { key: 'academic', label: 'Academic', icon: 'book' },
  { key: 'development', label: 'Development', icon: 'trendingUp' },
  { key: 'cocurricular', label: 'Co-curricular', icon: 'star' },
  { key: 'health', label: 'Health & Fitness', icon: 'heart' },
  { key: 'lifestyle', label: 'Lifestyle', icon: 'home' },
  { key: 'other', label: 'Other', icon: 'dots' },
]

export function categoryMeta(key) {
  return TASK_CATEGORIES.find((c) => c.key === key) || null
}
