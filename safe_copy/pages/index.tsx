import Link from 'next/link'

export default function Home() {
  return (
    <main style={{padding:40}}>
      <h1>KMB Business Management</h1>
      <p>Welcome — a starter Next.js + Supabase scaffold.</p>
      <p>
        <Link href="/login">Sign in</Link> | <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  )
}
