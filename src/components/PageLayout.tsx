import Navbar from './Navbar'
import { ReactNode } from 'react'

interface PageLayoutProps {
  title: string
  children?: ReactNode
}

export default function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div>
      <Navbar />
      <main style={{ padding: 20 }}>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  )
}
