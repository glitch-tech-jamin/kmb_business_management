import { useEffect, useState } from 'react'

type Customer = {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/customers')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load customers')
        return data as Customer[]
      })
      .then((data) => {
        if (active) setCustomers(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) return <p>Loading customers…</p>
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  if (customers.length === 0) return <p>No customers yet.</p>

  return (
    <ul>
      {customers.map((customer) => (
        <li key={customer.id}>
          {customer.name || 'Unnamed'}
          {customer.email ? ` — ${customer.email}` : ''}
        </li>
      ))}
    </ul>
  )
}
