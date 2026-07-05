import { useEffect, useState } from 'react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCustomers(data) })
      .catch(() => {})
  }, [])

  if (!customers.length) return <p>No customers yet.</p>

  return (
    <ul>
      {customers.map(c => (
        <li key={c.id}>{c.name} — {c.email}</li>
      ))}
    </ul>
  )
}
