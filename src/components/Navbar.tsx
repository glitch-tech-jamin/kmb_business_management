import Link from 'next/link'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Customers' },
  { href: '/products', label: 'Products' },
  { href: '/invoices', label: 'Invoices' },
]

export default function Navbar() {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 16,
        padding: '12px 20px',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb',
      }}
    >
      <Link href="/" style={{ fontWeight: 700 }}>
        KMB
      </Link>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
