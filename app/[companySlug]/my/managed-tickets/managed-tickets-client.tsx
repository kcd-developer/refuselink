'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, MapPin, MessageSquare, Plus, Send, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TicketPhotoPicker } from '@/components/ticket-photo-picker'
import { uploadTicketPhotos } from '@/lib/ticket-attachments-client'

type CommunityOption = { id: string; name: string; addresses: Array<{ id: string; address: string; address2: string | null }> }

const categoryLabels: Record<string, string> = { missed_pickup: 'Missed Pickup', recycling_issue: 'Recycling Issue', yard_waste_issue: 'Yard Waste Issue', cart_issue: 'Cart Issue', illegal_dumping: 'Illegal Dumping', community_cleanliness: 'Community Cleanliness', service_delay: 'Service Delay', billing_account: 'Billing or Account', other: 'Other Service Issue' }
const statusLabels: Record<string, string> = { open: 'Open', in_progress: 'In Progress', waiting_on_customer: 'Awaiting Response', resolved: 'Resolved', closed: 'Closed' }

export function ManagedTicketsClient({ tickets, communities, companySlug }: { tickets: any[]; communities: CommunityOption[]; companySlug: string }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [scope, setScope] = useState<'address' | 'community'>('address')
  const [addressId, setAddressId] = useState('')
  const [category, setCategory] = useState('missed_pickup')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [error, setError] = useState('')
  const selectedCommunity = communities.find((community) => community.id === communityId)

  const closeForm = () => { setShowCreate(false); setPhotos([]); setError(''); setUploadStatus('') }
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/company/${companySlug}/customer/managed-tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, scope, addressId: scope === 'address' ? addressId : null, category, subject, message }),
      })
      const created = await response.json().catch(() => ({}))
      if (!response.ok) { setError(created.error || 'Could not create the request.'); return }
      if (photos.length && created.id && created.initialMessageId) {
        try {
          await uploadTicketPhotos({ companySlug, ticketId: created.id, messageId: created.initialMessageId, files: photos, onProgress: (current, total) => setUploadStatus(`Uploading photo ${current} of ${total}...`) })
        } catch (uploadError) {
          toast.error(uploadError instanceof Error ? `Request created, but ${uploadError.message}` : 'Request created, but the photos could not be uploaded.', { duration: 12000 })
        }
      }
      router.push(`/${companySlug}/my/managed-tickets/${created.id}`)
      router.refresh()
    } catch { setError('Could not create the request.') } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold text-slate-900">Community Requests</h1><p className="mt-1 text-sm text-slate-500">Manage resident requests and contact KC Disposal for an address or an entire community</p></div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> New Request</button>
      </div>

      {showCreate && <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Create Community Manager Request</h2><p className="mt-1 text-sm text-slate-500">This request will be sent directly to KC Disposal.</p></div><button onClick={closeForm} className="rounded p-1 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium text-slate-500">Community *</label><select value={communityId} onChange={(event) => { setCommunityId(event.target.value); setAddressId('') }} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-500">Affected area *</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setScope('address')} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${scope === 'address' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}><MapPin className="h-4 w-4" /> Specific address</button><button type="button" onClick={() => { setScope('community'); setAddressId('') }} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${scope === 'community' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}><Building2 className="h-4 w-4" /> Entire community</button></div></div>
          </div>
          {scope === 'address' && <div><label className="mb-1 block text-xs font-medium text-slate-500">Affected address *</label><select value={addressId} onChange={(event) => setAddressId(event.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Select an address…</option>{selectedCommunity?.addresses.map((address) => <option key={address.id} value={address.id}>{address.address}{address.address2 ? ` ${address.address2}` : ''}</option>)}</select></div>}
          {scope === 'community' && <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800"><strong>Community-wide request:</strong> This creates one high-visibility request for all of {selectedCommunity?.name}. It will not create separate tickets for every address.</div>}
          <div><label className="mb-1 block text-xs font-medium text-slate-500">Issue Type *</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">Subject *</label><input value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={200} placeholder={scope === 'community' ? 'Example: Entire HOA missed pickup' : 'Brief description of the issue'} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">Details *</label><textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={4} maxLength={5000} placeholder="Describe what happened and what assistance is needed" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" /></div>
          <TicketPhotoPicker files={photos} onChange={setPhotos} onError={setError} disabled={loading} />
          <div className="flex justify-end"><button type="submit" disabled={loading || !communityId || (scope === 'address' && !addressId)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Send className="h-4 w-4" /> {loading ? (uploadStatus || 'Submitting…') : 'Send to KC Disposal'}</button></div>
        </form>
      </div>}

      <div className="space-y-3">
        {tickets.map((ticket) => <Link key={ticket.id} href={`/${companySlug}/my/managed-tickets/${ticket.id}`} className={`block rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${ticket.managerReads.length ? 'border-slate-200' : 'border-blue-300 ring-1 ring-blue-100'}`}>
          <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium text-blue-600">{ticket.community?.name ?? ticket.customer?.community?.name}</p>{ticket.requestScope === 'community' && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">Community-wide</span>}{ticket.createdByType === 'community_manager' && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Manager request</span>}{!ticket.managerReads.length && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>}</div><h2 className="mt-1 font-medium text-slate-900">{ticket.subject}</h2>{ticket.address && <p className="mt-1 text-xs text-slate-500">{ticket.address.address}{ticket.address.address2 ? ` ${ticket.address.address2}` : ''}</p>}<div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span>{ticket.ticketNumber}</span><span>{statusLabels[ticket.status] ?? ticket.status}</span><span>{new Date(ticket.updatedAt).toLocaleDateString('en-US')}</span></div></div><MessageSquare className="h-5 w-5 text-slate-300" /></div>
          {ticket.messages[0] && <p className="mt-3 line-clamp-1 text-sm text-slate-500">{ticket.messages[0].content}</p>}
        </Link>)}
        {!tickets.length && <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-400">No community requests yet.</div>}
      </div>
    </div>
  )
}
