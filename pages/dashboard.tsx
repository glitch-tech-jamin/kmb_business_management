import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../src/lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const s = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    supabase.auth.getSession()
      .then(({ data }) => setUser(data.session?.user ?? null))
      .catch((err: unknown) => console.error('Failed to load session', err))
    return () => s.subscription.unsubscribe()
  }, [])

  if (!user) return <p style={{padding:40}}>Not signed in — go to <a href="/login">login</a>.</p>

  return (
    <main style={{padding:40}}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <p>This is a protected placeholder page.</p>
    </main>
  )
}
