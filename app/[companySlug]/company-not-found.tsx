import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function CompanyNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Company Not Found</h1>
        <p className="text-slate-500 text-sm mb-6">The company you're looking for doesn't exist or is no longer available.</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}
