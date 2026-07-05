import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{ padding: '10px 20px', borderBottom: '1px solid #ccc', display: 'flex', gap: 16 }}>
      <Link href="/">Home</Link>
      <Link href="/customers">Customers</Link>
      <Link href="/products">Products</Link>
      <Link href="/invoices">Invoices</Link>
      <Link href="/dashboard">Dashboard</Link>
    </nav>
  )
}
