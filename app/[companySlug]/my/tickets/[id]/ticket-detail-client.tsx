'use client'

import { useState } from 'react'
import { ArrowLeft, Send, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const statusColors: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-yellow-50 text-yellow-700',
  waiting_on_customer: 'bg-purple-50 text-purple-700',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
}
const statusLabels: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', waiting_on_customer: 'Awaiting Response',
  resolved: 'Resolved', closed: 'Closed',
}

export function CustomerTicketDetailClient({ ticket, companySlug }: { ticket: any; companySlug: string }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch(`/api/company/${companySlug}/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, isInternal: false }),
      })
      setMessage('')
      router.refresh()
    } catch { /* ignore */ }
    setSending(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/${companySlug}/my/tickets`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Tickets
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">{ticket.subject}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status] ?? ''}`}>
                {statusLabels[ticket.status] ?? ticket.status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {(ticket.messages ?? []).map((msg: any) => (
            <div key={msg.id} className={`p-4 rounded-lg ${msg.authorType === 'customer' ? 'bg-blue-50 ml-4' : 'bg-slate-50 mr-4'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-900">{msg.authorName}</span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {new Date(msg.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>

        {!['resolved', 'closed'].includes(ticket.status) && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <textarea
              value={message} onChange={e => setMessage(e.target.value)}
              rows={3} placeholder="Type your reply..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button onClick={handleSendMessage} disabled={sending || !message.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
