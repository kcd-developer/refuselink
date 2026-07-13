import { PlatformSignInForm } from './sign-in-form'
import { Truck } from 'lucide-react'
import Link from 'next/link'

export default function PlatformSignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-slate-950">
      {/* Ambient gradient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Truck className="h-8 w-8 text-blue-400" />
            <span className="font-display font-bold text-2xl text-white">RefuseLink</span>
          </Link>
          <h1 className="font-display text-xl font-semibold text-white mb-2">Platform Administration</h1>
          <p className="text-sm text-slate-400">Sign in to manage the platform</p>
        </div>
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
          <PlatformSignInForm />
        </div>
      </div>
    </div>
  )
}
