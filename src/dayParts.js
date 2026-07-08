// Time-of-day buckets that organise the Life tab. An item's `bucket` is one of
// these keys, or '' for "Anytime" (no particular time).
export const DAY_PARTS = [
  { key: 'morning', label: 'Morning', icon: 'sunrise' },
  { key: 'afternoon', label: 'Afternoon', icon: 'sun' },
  { key: 'night', label: 'Night', icon: 'moon' },
]

// Choices shown in the add/edit modals (includes Anytime).
export const BUCKET_OPTIONS = [...DAY_PARTS, { key: '', label: 'Anytime', icon: 'clock' }]
