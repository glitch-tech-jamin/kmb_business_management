import Navbar from '../src/components/Navbar'
import CustomerList from '../src/components/CustomerList'
import { useState } from 'react'

export default function CustomersPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const create = async (e: any) => {
    e.preventDefault()
    const res = await fetch('/api/customers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email }) })
    const data = await res.json()
    if (!res.ok) setMessage(data.error || 'Error')
    else setMessage('Created: ' + data.id)
  }

  return (
    <div>
      <Navbar />
      <main style={{padding:20}}>
        <h1>Customers</h1>
        <form onSubmit={create} style={{marginBottom:20}}>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <button type="submit">Create</button>
        </form>
        {message && <p>{message}</p>}
        <CustomerList />
      </main>
    </div>
  )
}
