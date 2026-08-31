'use client'

import { useState } from 'react'
import { ArrowLeft, Send, Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const statusColors: Record<string, string> = {
  open: 'bg-orange-50 text-orange-600',
  in_progress: 'bg-blue-50 text-blue-600',
  waiting_on_customer: 'bg-yellow-50 text-yellow-700',
  resolved: 'bg-green-50 text-green-600',
  closed: 'bg-slate-100 text-slate-500',
}

export function TicketDetailClient({ ticket, employees, companySlug, currentUserId, currentUserName }: {
  ticket: any; employees: any[]; companySlug: string; currentUserId: string; currentUserName: string
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(ticket?.status ?? 'open')
  const [assignedToId, setAssignedToId] = useState(ticket?.assignedToId ?? '')
  const [managerHandling, setManagerHandling] = useState(ticket?.serviceRecipient === 'community_manager')
  const [takingOver, setTakingOver] = useState(false)

  const handleTakeOver = async () => {
    if (!window.confirm('Move this request into KC Disposal’s active workload?')) return
    setTakingOver(true)
    const response = await fetch(`/api/company/${companySlug}/tickets/${ticket?.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ takeOwnership: true }),
    })
    if (response.ok) { setManagerHandling(false); router.refresh() }
    setTakingOver(false)
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch(`/api/company/${companySlug}/tickets/${ticket?.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, isInternal }),
      })
      setMessage('')
      setIsInternal(false)
      router.refresh()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/company/${companySlug}/tickets/${ticket?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setStatus(newStatus)
      router.refresh()
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleAssign = async (employeeId: string) => {
    try {
      await fetch(`/api/company/${companySlug}/tickets/${ticket?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: employeeId || null }),
      })
      setAssignedToId(employeeId)
      router.refresh()
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <div>
      <Link href={`/${companySlug}/tickets`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Tickets
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {managerHandling && <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" /><div><p className="font-semibold text-amber-900">Community Manager handling</p><p className="mt-1 text-sm text-amber-800">This request is visible for awareness, but no KC Disposal action is required unless the manager escalates it.</p></div></div><button onClick={handleTakeOver} disabled={takingOver} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">{takingOver ? 'Taking over...' : 'KC Disposal take over'}</button></div>}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-lg font-bold text-slate-900">{ticket?.subject ?? '-'}</h1>
                  <p className="text-xs text-slate-400 font-mono mt-1">{ticket?.ticketNumber ?? ''}</p>
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {(status ?? '').replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="divide-y divide-slate-50">
              {(ticket?.messages ?? []).map((msg: any) => (
                <div key={msg?.id} className={`px-6 py-4 ${msg?.isInternal ? 'bg-amber-50/50' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      msg?.authorType === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {msg?.authorName?.charAt?.(0) ?? '?'}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{msg?.authorName ?? 'Unknown'}</span>
                    <span className="text-xs text-slate-400">{msg?.authorType ?? ''}</span>
                    {msg?.isInternal && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                        <Lock className="h-3 w-3" /> Internal
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">
                      {msg?.createdAt ? new Date(msg.createdAt).toLocaleString('en-US', { timeZone: 'UTC' }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap pl-9">{msg?.content ?? ''}</p>
                </div>
              ))}
            </div>

            {/* Reply box */}
            {!managerHandling && <div className="px-6 py-4 border-t border-slate-100">
              <textarea
                value={message}
                onChange={(e: any) => setMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox" checked={isInternal}
                    onChange={(e: any) => setIsInternal(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <Lock className="h-3.5 w-3.5" /> Internal note
                </label>
                <button
                  onClick={handleSendMessage} disabled={sending || !message.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-slate-500">Customer</dt>
                <dd className="text-sm text-slate-900 font-medium">{ticket?.customer?.name ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd>
                  <select
                    disabled={managerHandling}
                    value={status}
                    onChange={(e: any) => handleStatusChange(e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_on_customer">Waiting on Customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Assigned To</dt>
                <dd>
                  <select
                    disabled={managerHandling}
                    value={assignedToId}
                    onChange={(e: any) => handleAssign(e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm bg-white"
                  >
                    <option value="">Unassigned</option>
                    {(employees ?? []).map((emp: any) => (
                      <option key={emp?.id} value={emp?.id ?? ''}>{emp?.name ?? 'Employee'}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Priority</dt>
                <dd className="text-sm text-slate-900 capitalize">{ticket?.priority ?? '-'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
