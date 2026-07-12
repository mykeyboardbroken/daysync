import { createClient } from '@supabase/supabase-js'

// Accounts + cloud sync are OPTIONAL. With no keys set the app runs exactly as it
// always has — fully local, no login screen — so the deployed site keeps working
// before Supabase is configured (and if the keys are ever removed).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCloudEnabled = Boolean(url && anonKey)

export const supabase = isCloudEnabled ? createClient(url, anonKey) : null

// The single row per user that holds their whole schedule blob.
export const DATA_TABLE = 'user_data'
