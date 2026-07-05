import { useState } from 'react'
import { supabase } from '../src/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleMagicLink = async (e: any) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) setMessage(error.message)
      else setMessage('Check your email for the sign-in link.')
    } catch (err) {
      console.error('Sign-in request failed', err)
      setMessage(err instanceof Error ? err.message : 'Sign-in request failed. Please try again.')
    }
  }

  return (
    <main style={{padding:40}}>
      <h1>Sign In</h1>
      <form onSubmit={handleMagicLink}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <button type="submit">Send magic link</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  )
}
