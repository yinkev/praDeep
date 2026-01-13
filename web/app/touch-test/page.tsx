import { notFound } from 'next/navigation'
import TouchTestClient from './TouchTestClient'

export default function TouchTestPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <TouchTestClient />
}

