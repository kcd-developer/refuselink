'use client'

import { useState } from 'react'
import { Ticket, Plus, X, Send, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const statusColors: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700', in_progress: 'bg-yellow-50 text-yellow-700',
  waiting_on_customer: 'bg-purple-50 text-purple-700', resolved: 'bg-green-50 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
}
const statusLabels: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', waiting_on_customer: 'Awaiting Response',
  resolved: 'Resolved', closed: 'Closed',
}

export function CustomerTicketsClient({ tickets, companySlug, customerIds }: { tickets: any[]; companySlug: string; customerIds: string[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('missed_pickup')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerIds.length) { setError('No linked accounts found'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/company/${companySlug}/customer/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category, customerId: customerIds[0] }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Failed to create ticket'); setLoading(false); return }
      setShowCreate(false); setSubject(''); setMessage(''); setCategory('missed_pickup')
      router.refresh()
    } catch { setError('Failed to create ticket') }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">Submit and track service requests</p>
        </div>
        {customerIds.length > 0 && <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> New Ticket
        </button>}
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Create Service Request</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Issue Type *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm">
                <option value="missed_pickup">Missed Pickup</option>
                <option value="recycling_issue">Recycling Issue</option>
                <option value="yard_waste_issue">Yard Waste Issue</option>
                <option value="cart_issue">Cart Issue</option>
                <option value="illegal_dumping">Illegal Dumping</option>
                <option value="community_cleanliness">Community Cleanliness</option>
                <option value="service_delay">Service Delay</option>
                <option value="billing_account">Billing or Account Question (Private)</option>
                <option value="other">Other Service Issue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Subject *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Brief description of the issue" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Details *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} placeholder="Please describe your issue in detail" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Send className="h-4 w-4" /> {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((t: any) => (
          <Link key={t.id} href={`/${companySlug}/my/tickets/${t.id}`} className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-900 text-sm">{t.subject}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono text-slate-400">{t.ticketNumber}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status] ?? ''}`}>
                    {statusLabels[t.status] ?? t.status}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(t.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                </div>
              </div>
              <MessageSquare className="h-4 w-4 text-slate-300" />
            </div>
            {t.messages?.[0] && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-1">{t.messages[0].content}</p>
            )}
          </Link>
        ))}
        {tickets.length === 0 && <p className="text-slate-400 text-sm py-12 text-center">No tickets yet. Create one to get help.</p>}
      </div>
    </div>
  )
}
