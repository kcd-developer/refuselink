'use client'

import { useState } from 'react'
import { Building2, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCompany } from '@/lib/actions/platform'

export function CompaniesClient({ companies, plans }: { companies: any[]; plans: any[] }) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [code, setCode] = useState('')
  const [planId, setPlanId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const resetForm = () => { setShowForm(false); setName(''); setSlug(''); setCode(''); setPlanId(''); setError('') }

  const handleNameChange = (v: string) => {
    setName(v)
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    setCode(v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) + '001')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await createCompany({ name, slug, code, planId: planId || null })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const filtered = (companies ?? []).filter((c: any) =>
    (c?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c?.slug ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-700', trial: 'bg-blue-50 text-blue-700',
    suspended: 'bg-red-50 text-red-700', cancelled: 'bg-slate-100 text-slate-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Companies</h1>
          <p className="text-sm text-slate-500 mt-1">Manage waste management companies on the platform</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Company
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Add New Company</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Company Name *</label>
                <input value={name} onChange={e => handleNameChange(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">URL Slug *</label>
                <input value={slug} onChange={e => setSlug(e.target.value)} required pattern="[a-z0-9-]+" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Internal Code *</label>
                <input value={code} onChange={e => setCode(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Subscription Plan</label>
              <select value={planId} onChange={e => setPlanId(e.target.value)} className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="">No plan (trial)</option>
                {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} - ${(p.monthlyPriceCents / 100).toFixed(0)}/mo</option>)}
              </select>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search companies..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customers</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((company: any) => (
              <tr key={company?.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: company?.branding?.primaryColor ?? '#1D4ED8' }}>
                      <span className="text-white font-bold text-sm">{company?.name?.charAt?.(0) ?? '?'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{company?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{company?.slug ?? ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{company?.subscription?.plan?.name ?? 'None'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[company?.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {company?.status ?? 'unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{company?._count?.employees ?? 0}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{company?._count?.customers ?? 0}</td>
                <td className="px-6 py-4">
                  <button onClick={() => router.push(`/platform/companies/${company?.id}`)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No companies found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
