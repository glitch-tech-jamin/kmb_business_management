import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../src/lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    return () => authListener.subscription.unsubscribe()
  }, [])

  if (!user) return <p style={{padding:40}}>Not signed in — go to <Link href="/login">login</Link>.</p>

  return (
    <main style={{padding:40}}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <p>This is a protected placeholder page.</p>
    </main>
  )
}
