'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Home, Loader2, Lock, Mail, MapPin, Phone, UserPlus } from 'lucide-react'

interface Props {
  companySlug: string
  primaryColor: string
}

interface AddressSuggestion {
  id: string
  address: string
  address2: string | null
  city: string
  state: string
  zipCode: string | null
  community: string | null
  label: string
}

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
}

export function CompanyRegisterForm({ companySlug, primaryColor }: Props) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const addressSuggestionRequest = useRef(0)
  const router = useRouter()

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const applyAddressSuggestion = (suggestion: AddressSuggestion) => {
    setForm((current) => ({
      ...current,
      address: suggestion.address,
      address2: suggestion.address2 ?? '',
      city: suggestion.city,
      state: suggestion.state,
      zipCode: suggestion.zipCode ?? current.zipCode,
    }))
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  useEffect(() => {
    const address = form.address.trim()

    if (address.length < 1 || !/^\d/.test(address)) {
      setAddressSuggestions([])
      setSuggestionLoading(false)
      return
    }

    const controller = new AbortController()
    const requestId = addressSuggestionRequest.current + 1
    addressSuggestionRequest.current = requestId
    setSuggestionLoading(true)

    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({ address })
      if (form.city.trim()) params.set('city', form.city.trim())
      if (form.state.trim()) params.set('state', form.state.trim())
      if (form.zipCode.trim()) params.set('zipCode', form.zipCode.trim())

      try {
        const response = await fetch(`/api/company/${companySlug}/address-suggestions?${params.toString()}`, {
          signal: controller.signal,
        })
        const result = await response.json().catch(() => ({ suggestions: [] }))

        if (addressSuggestionRequest.current === requestId) {
          setAddressSuggestions(Array.isArray(result?.suggestions) ? result.suggestions : [])
        }
      } catch (fetchError) {
        if (!controller.signal.aborted && addressSuggestionRequest.current === requestId) {
          setAddressSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted && addressSuggestionRequest.current === requestId) {
          setSuggestionLoading(false)
        }
      }
    }, 220)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [companySlug, form.address, form.city, form.state, form.zipCode])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/company/${companySlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(result?.error ?? 'We could not create your account. Please check the form and try again.')
        setLoading(false)
        return
      }

      const signInResult = await signIn('credentials', {
        email: form.email,
        password: form.password,
        loginType: 'company',
        companySlug,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Your account was created, but we could not sign you in automatically. Please return to sign in.')
        setLoading(false)
        return
      }

      router.replace(`/${companySlug}/my`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              required
              value={form.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2"
              placeholder="Full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2"
              placeholder="Phone number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2"
              placeholder="Minimum 8 characters"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(event) => updateField('confirmPassword', event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2"
              placeholder="Confirm password"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Service address</label>
          <div className="relative">
            <Home className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              required
              value={form.address}
              onChange={(event) => {
                updateField('address', event.target.value)
                setShowAddressSuggestions(true)
              }}
              onFocus={() => setShowAddressSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowAddressSuggestions(false), 150)}
              autoComplete="street-address"
              aria-autocomplete="list"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2"
              placeholder="Start typing your street address"
            />

            {showAddressSuggestions && (addressSuggestions.length > 0 || suggestionLoading) && (
              <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                {suggestionLoading && (
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Looking for matching service addresses...
                  </div>
                )}

                {addressSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      applyAddressSuggestion(suggestion)
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
                    <span>
                      <span className="block font-medium text-slate-900">{suggestion.address}</span>
                      <span className="block text-xs text-slate-500">
                        {[suggestion.address2, suggestion.city, suggestion.state, suggestion.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                        {suggestion.community ? ` · ${suggestion.community}` : ''}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <input
          value={form.address2}
          onChange={(event) => updateField('address2', event.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2"
          placeholder="Address line 2"
        />
        <input
          required
          value={form.city}
          onChange={(event) => updateField('city', event.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2"
          placeholder="City"
        />
        <input
          required
          maxLength={2}
          value={form.state}
          onChange={(event) => updateField('state', event.target.value.toUpperCase())}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2"
          placeholder="State"
        />
        <input
          required
          value={form.zipCode}
          onChange={(event) => updateField('zipCode', event.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2"
          placeholder="ZIP code"
        />
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        Your address must already be on file with the company. Start with your house number, then select your
        complete address when it appears. If it does not match, contact the office for help.
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        <UserPlus className="h-4 w-4" />
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href={`/${companySlug}/sign-in`} className="font-medium hover:underline" style={{ color: primaryColor }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
