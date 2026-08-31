'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  open: 'bg-orange-50 text-orange-600',
  in_progress: 'bg-blue-50 text-blue-600',
  waiting_on_customer: 'bg-yellow-50 text-yellow-700',
  resolved: 'bg-green-50 text-green-600',
  closed: 'bg-slate-100 text-slate-500',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-50 text-slate-500',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

export function TicketsClient({ tickets, companySlug }: { tickets: any[]; companySlug: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [routingFilter, setRoutingFilter] = useState('all')

  const filtered = (tickets ?? []).filter((t: any) => {
    const matchesSearch = (t?.subject ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t?.ticketNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t?.customer?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t?.status === statusFilter
    const matchesRouting = routingFilter === 'all' || t?.serviceRecipient === routingFilter
    return matchesSearch && matchesStatus && matchesRouting
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Manage service requests and support tickets</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text" placeholder="Search tickets..."
            value={search} onChange={(e: any) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_on_customer">Waiting on Customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={routingFilter} onChange={(e: any) => setRoutingFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="all">All Routing</option>
          <option value="company">KC Disposal Handling</option>
          <option value="community_manager">Community Manager Handling</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ticket</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Customer</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((ticket: any) => (
              <tr key={ticket?.id} className={`transition-colors hover:bg-slate-50 ${ticket?.serviceRecipient === 'community_manager' ? 'bg-amber-50/40' : ''}`}>
                <td className="px-6 py-4">
                  <Link href={`/${companySlug}/tickets/${ticket?.id}`} className="group">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600">{ticket?.subject ?? '-'}</p>
                    <p className="text-xs text-slate-400 font-mono">{ticket?.ticketNumber ?? ''}</p>
                    {ticket?.serviceRecipient === 'community_manager' && <span className="mt-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Community Manager handling · No action required</span>}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{ticket?.customer?.name ?? '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket?.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {(ticket?.status ?? '').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket?.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                    {ticket?.priority ?? '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{ticket?.serviceRecipient === 'community_manager' ? ticket?.customer?.community?.name ? `${ticket.customer.community.name} Manager` : 'Community Manager' : ticket?.assignedTo?.name ?? 'Unassigned'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No tickets found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
