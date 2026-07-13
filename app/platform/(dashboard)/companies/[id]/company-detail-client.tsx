'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, MapPin, Ticket, Save, Ban, CheckCircle, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export function CompanyDetailClient({ company, plans }: { company: any; plans: any[] }) {
  const router = useRouter()
  const [status, setStatus] = useState(company?.status ?? 'trial')
  const [saving, setSaving] = useState(false)
  const [portalUrl, setPortalUrl] = useState(`/${company?.slug ?? ''}/sign-in`)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setPortalUrl(`${window.location.origin}/${company?.slug ?? ''}/sign-in`)
  }, [company?.slug])

  const copyPortalUrl = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true)
    try {
      await fetch(`/api/platform/companies/${company?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setStatus(newStatus)
      router.refresh()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    { label: 'Employees', value: company?._count?.employees ?? 0, icon: Users },
    { label: 'Customers', value: company?._count?.customers ?? 0, icon: Users },
    { label: 'Cities', value: company?._count?.cities ?? 0, icon: MapPin },
    { label: 'Tickets', value: company?._count?.tickets ?? 0, icon: Ticket },
  ]

  return (
    <div>
      <Link href="/platform/companies" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: company?.branding?.primaryColor ?? '#1D4ED8' }}>
            <span className="text-white font-bold text-lg">{company?.name?.charAt?.(0) ?? '?'}</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{company?.name ?? 'Company'}</h1>
            <div className="flex items-center gap-1 text-sm text-slate-500 whitespace-nowrap">
              <span>Slug: {company?.slug ?? ''}</span>
              <span>·</span>
              <span>Code: {company?.code ?? ''}</span>
              <span>·</span>
              <span>Portal:</span>
              <button
                type="button"
                onClick={copyPortalUrl}
                className="inline-flex items-center gap-1.5 max-w-lg text-left text-blue-600 hover:text-blue-700 font-semibold"
                title="Copy company portal URL"
                aria-label={`Copy company portal URL: ${portalUrl}`}
              >
                <span className="truncate">{portalUrl}</span>
                {copied ? <Check className="h-4 w-4 flex-none text-green-600" /> : <Copy className="h-4 w-4 flex-none" />}
              </button>
              {copied && <span className="text-xs font-medium text-green-600">Copied</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status !== 'suspended' ? (
            <button
              onClick={() => handleStatusChange('suspended')}
              disabled={saving}
              className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
            >
              <Ban className="h-4 w-4" /> Suspend
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={saving}
              className="px-4 py-2 bg-green-50 text-green-600 text-sm font-medium rounded-lg hover:bg-green-100 disabled:opacity-50 flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" /> Activate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s: any) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Subscription</h3>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Plan</dt>
              <dd className="text-slate-900 font-medium">{company?.subscription?.plan?.name ?? 'None'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Billing</dt>
              <dd className="text-slate-900">{company?.subscription?.billingCycle ?? '-'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-900">{company?.subscription?.status ?? '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Branding</h3>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Primary Color</dt>
              <dd className="flex items-center gap-2">
                <div className="h-4 w-4 rounded" style={{ backgroundColor: company?.branding?.primaryColor ?? '#0F172A' }} />
                <span className="text-slate-900 font-mono text-xs">{company?.branding?.primaryColor ?? '#0F172A'}</span>
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Support Email</dt>
              <dd className="text-slate-900">{company?.branding?.supportEmail ?? '-'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Support Phone</dt>
              <dd className="text-slate-900">{company?.branding?.supportPhone ?? '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
