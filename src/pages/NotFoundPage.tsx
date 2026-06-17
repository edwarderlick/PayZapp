import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bgBase flex flex-col items-center justify-center p-6 text-center space-y-6">
      <h1 className="text-[120px] font-display font-light text-textPrimary leading-none mb-4 italic tracking-tight">404</h1>
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="text-textSecondary max-w-sm mx-auto">
        The feature or page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button className="mt-4 gap-2">
          <Home className="w-5 h-5" />
          Back to Home
        </Button>
      </Link>
    </div>
  )
}
