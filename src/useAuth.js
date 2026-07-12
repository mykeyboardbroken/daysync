import { useState, useEffect, useCallback } from 'react'
import { supabase, isCloudEnabled } from './supabase'

// Auth state for the app. When cloud is disabled this reports "ready, no session"
// and the app skips the login screen entirely (local-only mode).
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isCloudEnabled)

  useEffect(() => {
    if (!isCloudEnabled) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Each of these resolves to an error message string, or null on success.
  const signUp = useCallback(async (email, password, username) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    return error?.message ?? null
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  // Drop the local cache too, so the next person to open the app on this device
  // doesn't see the previous account's data. Everything is safe in the cloud.
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    try {
      localStorage.removeItem('schedule-app.data')
    } catch {
      /* ignore */
    }
    window.location.reload()
  }, [])

  const username = session?.user?.user_metadata?.username || ''

  return {
    enabled: isCloudEnabled,
    session,
    loading,
    userId: session?.user?.id ?? null,
    username,
    signUp,
    signIn,
    signOut,
  }
}
