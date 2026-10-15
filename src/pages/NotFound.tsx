import { Link } from 'react-router'
import { usePageTitle } from '../lib/usePageTitle'

export function NotFound() {
  usePageTitle('Not found')
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">This page doesn't exist</h1>
      <Link to="/" className="btn-primary mt-8">
        Back home
      </Link>
    </div>
  )
}
