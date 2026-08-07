'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, LogIn } from 'lucide-react'

interface Props {
  companySlug: string
  primaryColor: string
}

export function CompanySignInForm({ companySlug, primaryColor }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      loginType: 'company',
      companySlug,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid credentials or access denied')
      setLoading(false)
    } else {
      // Fetch session to determine redirect
      const res = await fetch('/api/auth/session')
      const session = await res.json()
      const userType = session?.user?.userType
      if (userType === 'customer') {
        router.replace(`/${companySlug}/my`)
      } else {
        router.replace(`/${companySlug}/dashboard`)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email" required
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:border-blue-500 outline-none"
            style={{ '--tw-ring-color': primaryColor } as any}
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="password" required
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:border-blue-500 outline-none"
            placeholder="Enter your password"
          />
        </div>
      </div>
      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 text-white font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        <LogIn className="h-4 w-4" />
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <p className="text-center text-sm text-slate-500">
        Need portal access?{' '}
        <Link href={`/${companySlug}/register`} className="font-medium hover:underline" style={{ color: primaryColor }}>
          Claim your service address
        </Link>
      </p>
    </form>
  )
}
