'use client'

import { Ticket, Users, Megaphone, AlertCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  userName: string
  companySlug: string
  ticketsByStatus: Record<string, number>
  customerCount: number
  recentTickets: any[]
  announcements: any[]
}

export function DashboardClient({ userName, companySlug, ticketsByStatus, customerCount, recentTickets, announcements }: Props) {
  const totalTickets = Object.values(ticketsByStatus ?? {}).reduce((a: number, b: number) => a + (b ?? 0), 0)
  const openTickets = (ticketsByStatus?.open ?? 0) + (ticketsByStatus?.in_progress ?? 0) + (ticketsByStatus?.waiting_on_customer ?? 0)

  const stats = [
    { label: 'Open Tickets', value: openTickets, icon: Ticket, color: 'text-orange-600 bg-orange-50' },
    { label: 'Total Tickets', value: totalTickets, icon: Ticket, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Customers', value: customerCount, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Announcements', value: (announcements ?? []).length, icon: Megaphone, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {userName?.split?.(' ')?.[0] ?? 'User'}</h1>
        <p className="text-sm text-slate-500 mt-1">Here is what is happening today</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s: any) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${s.color?.split?.(' ')?.[1] ?? 'bg-slate-50'}`}>
              <s.icon className={`h-5 w-5 ${s.color?.split?.(' ')?.[0] ?? 'text-slate-600'}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Tickets</h3>
            <Link href={`/${companySlug}/tickets`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(recentTickets ?? []).length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-400 text-center">No tickets yet</p>
            ) : (
              (recentTickets ?? []).map((ticket: any) => (
                <Link key={ticket?.id} href={`/${companySlug}/tickets/${ticket?.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{ticket?.subject ?? '-'}</p>
                    <p className="text-xs text-slate-400">{ticket?.customer?.name ?? '-'} · {ticket?.ticketNumber ?? ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    ticket?.status === 'open' ? 'bg-orange-50 text-orange-600' :
                    ticket?.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                    ticket?.status === 'resolved' ? 'bg-green-50 text-green-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {ticket?.status?.replace?.('_', ' ') ?? ''}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/${companySlug}/tickets`} className="px-4 py-3 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-center">View Tickets</Link>
              <Link href={`/${companySlug}/customers`} className="px-4 py-3 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-center">Customers</Link>
              <Link href={`/${companySlug}/announcements`} className="px-4 py-3 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-center">Announcements</Link>
              <Link href={`/${companySlug}/service-schedules`} className="px-4 py-3 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-center">Schedules</Link>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Recent Announcements</h3></div>
            <div className="divide-y divide-slate-50">
              {(announcements ?? []).length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-400 text-center">No announcements</p>
              ) : (
                (announcements ?? []).map((ann: any) => (
                  <div key={ann?.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-slate-900">{ann?.title ?? '-'}</p>
                    <p className="text-xs text-slate-400 mt-1">{ann?.priority === 'high' || ann?.priority === 'urgent' ? '🔴 ' : ''}{ann?.priority ?? 'normal'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
