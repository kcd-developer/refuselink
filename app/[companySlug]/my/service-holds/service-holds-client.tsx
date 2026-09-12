'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, RotateCcw, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { requestServiceHold } from '@/lib/actions/service-holds'

const labels: Record<string, string> = {
  active: 'Active', suspension_pending: 'Suspension Pending', suspended: 'Suspended', restoration_pending: 'Restoration Pending',
}
const styles: Record<string, string> = {
  active: 'bg-green-50 text-green-700', suspension_pending: 'bg-amber-50 text-amber-700', suspended: 'bg-red-50 text-red-700', restoration_pending: 'bg-blue-50 text-blue-700',
}

export function CommunityServiceHoldsClient({ companySlug, addresses }: { companySlug: string; addresses: any[] }) {
  const [search, setSearch] = useState('')
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return addresses.filter((item) => !query || `${item.address} ${item.address2 ?? ''} ${item.community?.name ?? ''}`.toLowerCase().includes(query))
  }, [addresses, search])

  async function submit(address: any, action: 'suspend' | 'restore') {
    const verb = action === 'suspend' ? 'suspend service at' : 'restore service at'
    if (!window.confirm(`Request KC Disposal to ${verb} ${address.address}?`)) return
    const note = window.prompt('Optional note for KC Disposal:')
    if (note === null) return
    setWorkingId(address.id); setMessage('')
    const result = await requestServiceHold(companySlug, { addressId: address.id, action, note })
    setWorkingId(null)
    if (result.error) setMessage(result.error)
    else { setMessage('Priority request sent to KC Disposal.'); router.refresh() }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Service Holds</h1>
        <p className="mt-1 text-sm text-slate-500">Request suspension or restoration after confirming the address status with your HOA.</p>
      </div>
      {message && <div className={`rounded-lg border px-4 py-3 text-sm ${message.includes('sent') ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{message}</div>}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by address or community" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((item) => {
          const latest = item.serviceHoldRequests?.[0]
          return (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="font-semibold text-slate-900">{item.address}{item.address2 ? `, ${item.address2}` : ''}</h2><p className="text-sm text-slate-500">{item.community?.name} · {item.city.name}, {item.city.state} {item.zipCode}</p></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[item.serviceStatus]}`}>{labels[item.serviceStatus]}</span>
              </div>
              {latest && <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${latest.status === 'completed' ? 'bg-green-50 text-green-800' : latest.status === 'rejected' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800'}`}>
                {latest.status === 'pending'
                  ? `${latest.action === 'suspend' ? 'Suspension' : 'Restoration'} requested ${new Date(latest.createdAt).toLocaleString()}. KC Disposal has been notified.`
                  : latest.status === 'completed'
                    ? `KC Disposal completed the ${latest.action === 'suspend' ? 'service suspension' : 'service restoration'}${latest.processedAt ? ` on ${new Date(latest.processedAt).toLocaleString()}` : ''}.`
                    : `KC Disposal did not complete the ${latest.action === 'suspend' ? 'suspension' : 'restoration'} request.`}
              </div>}
              <div className="mt-4 flex justify-end">
                {item.serviceStatus === 'active' && <button disabled={workingId === item.id} onClick={() => submit(item, 'suspend')} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"><AlertTriangle className="h-4 w-4" /> Request Suspension</button>}
                {item.serviceStatus === 'suspended' && <button disabled={workingId === item.id} onClick={() => submit(item, 'restore')} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Request Restoration</button>}
                {item.serviceStatus.includes('pending') && <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700"><Clock3 className="h-4 w-4" /> Awaiting KC Disposal</span>}
                {item.serviceStatus === 'active' && latest?.status === 'completed' && latest.action === 'restore' && <CheckCircle2 className="ml-3 h-5 w-5 text-green-600" />}
              </div>
            </article>
          )
        })}
        {!filtered.length && <p className="py-12 text-center text-sm text-slate-400 lg:col-span-2">No matching addresses.</p>}
      </div>
    </div>
  )
}
