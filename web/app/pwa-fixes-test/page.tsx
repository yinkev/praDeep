import { notFound } from 'next/navigation'
import PwaFixesTestClient from './PwaFixesTestClient'

export default function PwaFixesTestPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <PwaFixesTestClient />
}
