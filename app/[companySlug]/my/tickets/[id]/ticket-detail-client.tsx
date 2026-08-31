'use client'

import { useState } from 'react'
import { ArrowLeft, Send, Clock, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

export function CustomerTicketDetailClient({ ticket, companySlug, companyName = 'Service Company', backHref, canEscalate = false }: { ticket: any; companySlug: string; companyName?: string; backHref?: string; canEscalate?: boolean }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<'resolved' | 'closed' | null>(null)
  const [confirmAction, setConfirmAction] = useState<'resolved' | 'closed' | 'escalate' | null>(null)
  const router = useRouter()

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch(`/api/company/${companySlug}/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, isInternal: false, authorContext: canEscalate ? 'community_manager' : 'customer' }),
      })
      setMessage('')
      router.refresh()
    } catch { /* ignore */ }
    setSending(false)
  }

  const handleEscalate = async () => {
    setEscalating(true)
    const response = await fetch(`/api/company/${companySlug}/customer/tickets/${ticket.id}/escalate`, { method: 'POST' })
    const result = await response.json().catch(() => ({}))
    if (response.ok) window.location.assign(result.href)
    else setEscalating(false)
  }

  const handleManagerStatus = async (status: 'resolved' | 'closed') => {
    setUpdatingStatus(status)
    try {
      const response = await fetch(`/api/company/${companySlug}/customer/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (response.ok) router.refresh()
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={backHref ?? `/${companySlug}/my/tickets`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
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
          {canEscalate && !['resolved', 'closed'].includes(ticket.status) && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setConfirmAction('resolved')}
                disabled={Boolean(updatingStatus) || escalating}
                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {updatingStatus === 'resolved' ? 'Resolving...' : 'Resolve'}
              </button>
              <button
                onClick={() => setConfirmAction('closed')}
                disabled={Boolean(updatingStatus) || escalating}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {updatingStatus === 'closed' ? 'Closing...' : 'Close without resolution'}
              </button>
              <button
                onClick={() => setConfirmAction('escalate')}
                disabled={Boolean(updatingStatus) || escalating}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                {escalating ? 'Escalating...' : 'Send to KC Disposal'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 mt-6">
          {(ticket.messages ?? []).map((msg: any) => (
            <div key={msg.id} className={`p-4 rounded-lg ${msg.authorType === 'customer' ? 'bg-blue-50 ml-4' : 'bg-slate-50 mr-4'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-900">{msg.authorType === 'employee' ? companyName : msg.authorName}</span>
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

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent className="max-w-md overflow-hidden border-slate-200 p-0 shadow-2xl">
          <div className="p-6 pb-5">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${confirmAction === 'resolved' ? 'bg-green-100 text-green-700' : confirmAction === 'closed' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
              {confirmAction === 'resolved' ? <CheckCircle2 className="h-5 w-5" /> : confirmAction === 'closed' ? <XCircle className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-xl text-slate-900">
                {confirmAction === 'resolved' ? 'Mark this request resolved?' : confirmAction === 'closed' ? 'Close without resolution?' : 'Send to KC Disposal?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="leading-6 text-slate-600">
                {confirmAction === 'resolved'
                  ? 'Use Resolve when the reported issue was successfully addressed—for example, a missed pickup was completed or a cart was replaced. The resident will be notified.'
                  : confirmAction === 'closed'
                    ? 'Use Close when the request is ending without a successful resolution—for example, it is a duplicate, a test, was withdrawn, or cannot be acted on. The resident will be notified.'
                    : 'KC Disposal will take over this request, and it will leave your Community Manager inbox.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <AlertDialogCancel className="bg-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = confirmAction
                setConfirmAction(null)
                if (action === 'escalate') void handleEscalate()
                else if (action) void handleManagerStatus(action)
              }}
              className={confirmAction === 'resolved' ? 'bg-green-600 hover:bg-green-700' : confirmAction === 'closed' ? 'bg-slate-700 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {confirmAction === 'resolved' ? 'Mark resolved' : confirmAction === 'closed' ? 'Close without resolution' : 'Send to KC Disposal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
