'use client'

import { useState } from 'react'
import { AlertTriangle, Check, RotateCcw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { processServiceHoldRequest, restoreServiceDirectly } from '@/lib/actions/service-holds'
import { ServiceHoldActionDialog } from '@/components/service-hold-action-dialog'

function addressLabel(address: any) {
  return `${address.address}${address.address2 ? `, ${address.address2}` : ''}, ${address.city.name}, ${address.city.state} ${address.zipCode ?? ''}`
}

export function EmployeeServiceHoldsClient({ companySlug, requests, suspendedAddresses }: { companySlug: string; requests: any[]; suspendedAddresses: any[] }) {
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [dialogAction, setDialogAction] = useState<
    | { kind: 'process'; request: any; decision: 'complete' | 'reject' }
    | { kind: 'restore'; address: any }
    | null
  >(null)
  const router = useRouter()
  const pending = requests.filter((request) => request.status === 'pending')
  const history = requests.filter((request) => request.status !== 'pending')

  async function process(request: any, decision: 'complete' | 'reject', note: string) {
    setWorkingId(request.id); setMessage('')
    const result = await processServiceHoldRequest(companySlug, { requestId: request.id, decision, note })
    setWorkingId(null)
    setDialogAction(null)
    if (result.error) setMessage(result.error)
    else { setMessage(decision === 'complete' ? 'Address status updated.' : 'Request rejected.'); router.refresh() }
  }

  async function restoreDirectly(address: any, note: string) {
    setWorkingId(address.id); setMessage('')
    const result = await restoreServiceDirectly(companySlug, { addressId: address.id, note })
    setWorkingId(null)
    setDialogAction(null)
    if (result.error) setMessage(result.error)
    else { setMessage('Service restored and all portals will update automatically.'); router.refresh() }
  }

  async function confirmDialog(note: string) {
    if (!dialogAction) return
    if (dialogAction.kind === 'restore') return restoreDirectly(dialogAction.address, note)
    return process(dialogAction.request, dialogAction.decision, note)
  }

  return (
    <div className="space-y-8">
      <div><h1 className="font-display text-2xl font-bold text-slate-900">Service Holds</h1><p className="mt-1 text-sm text-slate-500">Process priority HOA requests after making the matching change in Soft-Pak.</p></div>
      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}

      <section>
        <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h2 className="font-semibold text-slate-900">Priority Requests</h2><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{pending.length}</span></div>
        <div className="space-y-3">
          {pending.map((request) => <article key={request.id} className={`rounded-xl border bg-white p-5 shadow-sm ${request.action === 'restore' ? 'border-green-300' : 'border-red-200'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className={`text-xs font-bold uppercase tracking-wide ${request.action === 'restore' ? 'text-green-700' : 'text-red-600'}`}>{request.action === 'suspend' ? 'Suspend Service' : 'Restore Service'}</p><h3 className="mt-1 font-semibold text-slate-900">{addressLabel(request.address)}</h3><p className="text-sm text-slate-500">{request.address.community?.name} · Requested by {request.requestedBy?.name ?? 'Former user'} on {new Date(request.createdAt).toLocaleString()}</p>{request.requestNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{request.requestNote}</p>}</div>
              <div className="flex gap-2"><button disabled={workingId === request.id} onClick={() => setDialogAction({ kind: 'process', request, decision: 'reject' })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><X className="h-4 w-4" /> Reject</button><button disabled={workingId === request.id} onClick={() => setDialogAction({ kind: 'process', request, decision: 'complete' })} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"><Check className="h-4 w-4" /> Completed in Soft-Pak</button></div>
            </div>
          </article>)}
          {!pending.length && <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">No pending service-hold requests.</div>}
        </div>
      </section>

      <section><div className="mb-3 flex items-center gap-2"><RotateCcw className="h-5 w-5 text-slate-600" /><h2 className="font-semibold text-slate-900">Currently Suspended Addresses</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{suspendedAddresses.length}</span></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{suspendedAddresses.map((address) => <div key={address.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-semibold text-slate-900">{addressLabel(address)}</p><p className="text-xs text-slate-500">{address.community?.name}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Suspended</span><button disabled={workingId === address.id} onClick={() => setDialogAction({ kind: 'restore', address })} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Restore Service</button></div></div>)}{!suspendedAddresses.length && <p className="py-8 text-center text-sm text-slate-400">No suspended addresses.</p>}</div></div></section>

      <section><h2 className="mb-3 font-semibold text-slate-900">Request History</h2><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{history.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium text-slate-900">{request.action === 'suspend' ? 'Suspension' : 'Restoration'} · {request.address.address}</p><p className="text-xs text-slate-500">{request.address.community?.name} · Requested by {request.requestedBy?.name ?? 'KCD staff (phone request)'}</p></div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{request.status === 'completed' ? 'Completed' : 'Rejected'}</span>{request.processedByName && <p className="mt-1 text-xs text-slate-400">by {request.processedByName}</p>}</div></div>)}{!history.length && <p className="py-8 text-center text-sm text-slate-400">No request history yet.</p>}</div></div></section>
      {dialogAction && <ServiceHoldActionDialog
        open
        onOpenChange={(open) => !open && setDialogAction(null)}
        title={dialogAction.kind === 'restore' ? 'Restore service?' : dialogAction.decision === 'reject' ? 'Reject this request?' : 'Confirm Soft-Pak update?'}
        description={dialogAction.kind === 'restore' ? 'Only continue after service has been restored in Soft-Pak. The address status will update for the HOA and resident.' : dialogAction.decision === 'reject' ? 'This closes the priority request without changing the address service status.' : `Confirm the ${dialogAction.request.action === 'suspend' ? 'suspension' : 'restoration'} has already been completed in Soft-Pak.`}
        address={addressLabel(dialogAction.kind === 'restore' ? dialogAction.address : dialogAction.request.address)}
        noteLabel={dialogAction.kind === 'restore' ? 'Internal note' : dialogAction.decision === 'reject' ? 'Reason for rejection' : 'Completion note'}
        notePlaceholder={dialogAction.kind === 'restore' ? 'For example, who called or authorized the restoration...' : dialogAction.decision === 'reject' ? 'Explain why this request was not completed...' : 'Add any details the KCD team may need later...'}
        confirmLabel={dialogAction.kind === 'restore' ? 'Confirm Restoration' : dialogAction.decision === 'reject' ? 'Reject Request' : 'Confirm Completed'}
        tone={dialogAction.kind === 'restore' ? 'restore' : dialogAction.decision === 'reject' ? 'neutral' : 'success'}
        loading={workingId === (dialogAction.kind === 'restore' ? dialogAction.address.id : dialogAction.request.id)}
        onConfirm={confirmDialog}
      />}
    </div>
  )
}
