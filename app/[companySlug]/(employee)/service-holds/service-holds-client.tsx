'use client'

import { useState } from 'react'
import { AlertTriangle, Check, RotateCcw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { processServiceHoldRequest } from '@/lib/actions/service-holds'

function addressLabel(address: any) {
  return `${address.address}${address.address2 ? `, ${address.address2}` : ''}, ${address.city.name}, ${address.city.state} ${address.zipCode ?? ''}`
}

export function EmployeeServiceHoldsClient({ companySlug, requests, suspendedAddresses }: { companySlug: string; requests: any[]; suspendedAddresses: any[] }) {
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const pending = requests.filter((request) => request.status === 'pending')
  const history = requests.filter((request) => request.status !== 'pending')

  async function process(request: any, decision: 'complete' | 'reject') {
    const actionLabel = request.action === 'suspend' ? 'suspension' : 'restoration'
    if (decision === 'complete' && !window.confirm(`Confirm the ${actionLabel} was completed in Soft-Pak for ${request.address.address}?`)) return
    const note = window.prompt(decision === 'complete' ? 'Optional internal completion note:' : 'Reason for rejecting this request:')
    if (note === null) return
    setWorkingId(request.id); setMessage('')
    const result = await processServiceHoldRequest(companySlug, { requestId: request.id, decision, note })
    setWorkingId(null)
    if (result.error) setMessage(result.error)
    else { setMessage(decision === 'complete' ? 'Address status updated.' : 'Request rejected.'); router.refresh() }
  }

  return (
    <div className="space-y-8">
      <div><h1 className="font-display text-2xl font-bold text-slate-900">Service Holds</h1><p className="mt-1 text-sm text-slate-500">Process priority HOA requests after making the matching change in Soft-Pak.</p></div>
      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}

      <section>
        <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h2 className="font-semibold text-slate-900">Priority Requests</h2><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{pending.length}</span></div>
        <div className="space-y-3">
          {pending.map((request) => <article key={request.id} className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-red-600">{request.action === 'suspend' ? 'Suspend Service' : 'Restore Service'}</p><h3 className="mt-1 font-semibold text-slate-900">{addressLabel(request.address)}</h3><p className="text-sm text-slate-500">{request.address.community?.name} · Requested by {request.requestedBy?.name ?? 'Former user'} on {new Date(request.createdAt).toLocaleString()}</p>{request.requestNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{request.requestNote}</p>}</div>
              <div className="flex gap-2"><button disabled={workingId === request.id} onClick={() => process(request, 'reject')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><X className="h-4 w-4" /> Reject</button><button disabled={workingId === request.id} onClick={() => process(request, 'complete')} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"><Check className="h-4 w-4" /> Completed in Soft-Pak</button></div>
            </div>
          </article>)}
          {!pending.length && <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">No pending service-hold requests.</div>}
        </div>
      </section>

      <section><div className="mb-3 flex items-center gap-2"><RotateCcw className="h-5 w-5 text-slate-600" /><h2 className="font-semibold text-slate-900">Currently Suspended Addresses</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{suspendedAddresses.length}</span></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{suspendedAddresses.map((address) => <div key={address.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-sm font-semibold text-slate-900">{addressLabel(address)}</p><p className="text-xs text-slate-500">{address.community?.name}</p></div><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Suspended</span></div>)}{!suspendedAddresses.length && <p className="py-8 text-center text-sm text-slate-400">No suspended addresses.</p>}</div></div></section>

      <section><h2 className="mb-3 font-semibold text-slate-900">Request History</h2><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{history.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium text-slate-900">{request.action === 'suspend' ? 'Suspension' : 'Restoration'} · {request.address.address}</p><p className="text-xs text-slate-500">{request.address.community?.name} · Requested by {request.requestedBy.name}</p></div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{request.status === 'completed' ? 'Completed' : 'Rejected'}</span>{request.processedByName && <p className="mt-1 text-xs text-slate-400">by {request.processedByName}</p>}</div></div>)}{!history.length && <p className="py-8 text-center text-sm text-slate-400">No request history yet.</p>}</div></div></section>
    </div>
  )
}
