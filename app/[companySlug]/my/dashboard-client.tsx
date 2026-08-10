'use client'

import { Ticket, Megaphone, Calendar, User, ArrowRight, CreditCard, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  userName: string
  companySlug: string
  primaryColor: string
  paymentUrl?: string | null
  paymentLabel?: string | null
  accounts: any[]
  openTickets: number
  announcements: any[]
  addressServices: any[]
}

const serviceLabels: Record<string, string> = { trash: 'Trash', recycling: 'Recycling', yard_waste: 'Yard Waste' }

export function CustomerDashboardClient({ userName, companySlug, primaryColor, paymentUrl, paymentLabel, accounts, openTickets, announcements, addressServices }: Props) {
  // Find next scheduled day
  const today = new Date()
  const currentDay = today.getUTCDay()
  let nextServiceDay = ''
  const allServices = (addressServices ?? []).flatMap((item: any) => item.services ?? [])
  if (allServices.length > 0) {
    const next = [...allServices].sort((left: any, right: any) =>
      ((left.dayOfWeek - currentDay + 7) % 7) - ((right.dayOfWeek - currentDay + 7) % 7)
    )[0]
    if (next) nextServiceDay = `${dayNames[next.dayOfWeek]} · ${serviceLabels[next.service] ?? next.service}`
  }

  const primaryAccount = (accounts ?? []).find((a: any) => a?.isPrimary)?.customer ?? (accounts ?? [])[0]?.customer
  const primaryServices = (addressServices ?? []).find((item: any) => item.customerId === primaryAccount?.id)?.services ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Welcome, {userName?.split?.(' ')?.[0] ?? 'Customer'}</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and services</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <Calendar className="h-5 w-5 mb-2" style={{ color: 'var(--company-secondary)' }} />
          <p className="text-lg font-bold text-slate-900">{nextServiceDay || 'N/A'}</p>
          <p className="text-xs text-slate-500">Next Service</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <Ticket className="h-5 w-5 mb-2" style={{ color: 'var(--company-secondary)' }} />
          <p className="text-lg font-bold text-slate-900">{openTickets ?? 0}</p>
          <p className="text-xs text-slate-500">Open Tickets</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <Megaphone className="h-5 w-5 mb-2" style={{ color: 'var(--company-secondary)' }} />
          <p className="text-lg font-bold text-slate-900">{(announcements ?? []).length}</p>
          <p className="text-xs text-slate-500">Announcements</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <User className="h-5 w-5 mb-2" style={{ color: 'var(--company-secondary)' }} />
          <p className="text-lg font-bold text-slate-900">{(accounts ?? []).length}</p>
          <p className="text-xs text-slate-500">Linked Accounts</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Summary */}
        {primaryAccount && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Account Summary</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm"><dt className="text-slate-500">Name</dt><dd className="text-slate-900">{primaryAccount?.name ?? '-'}</dd></div>
              <div className="flex justify-between text-sm"><dt className="text-slate-500">Account #</dt><dd className="font-mono text-slate-900">{primaryAccount?.accountNumber ?? '-'}</dd></div>
              <div className="flex justify-between text-sm"><dt className="text-slate-500">Type</dt><dd className="capitalize text-slate-900">{primaryAccount?.type?.replace?.('_', ' ') ?? '-'}</dd></div>
              <div className="flex justify-between text-sm"><dt className="text-slate-500">Address</dt><dd className="text-slate-900">{primaryAccount?.address ?? '-'}</dd></div>
              {primaryAccount?.community?.name && (
                <div className="flex justify-between text-sm"><dt className="text-slate-500">Community</dt><dd className="font-medium text-slate-900">{primaryAccount.community.name}</dd></div>
              )}
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-slate-500">Services</dt>
                <dd className="text-right text-slate-900">
                  {primaryServices.length ? primaryServices.map((service: any) => (
                    <div key={service.service}>{serviceLabels[service.service] ?? service.service} · {dayNames[service.dayOfWeek]}{service.containerSize ? ` · ${service.containerSize}` : ''}</div>
                  )) : 'Not assigned'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {paymentUrl && (
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                <span className="inline-flex items-center gap-2 text-sm font-medium"><CreditCard className="h-4 w-4" /> {paymentLabel || 'Pay Bill'}</span>
                <ExternalLink className="h-4 w-4 opacity-80" />
              </a>
            )}
            <Link href={`/${companySlug}/my/tickets`} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-sm font-medium text-slate-700">Submit a Request</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href={`/${companySlug}/my/service-schedules`} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-sm font-medium text-slate-700">View Schedule</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href={`/${companySlug}/my/documents`} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-sm font-medium text-slate-700">Browse Documents</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 md:col-span-2">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Announcements</h3>
            <Link href={`/${companySlug}/my/announcements`} className="text-xs font-medium flex items-center gap-1" style={{ color: primaryColor }}>
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(announcements ?? []).length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-400 text-center">No announcements</p>
            ) : (
              (announcements ?? []).map((ann: any) => (
                <div key={ann?.id} className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    {(ann?.priority === 'high' || ann?.priority === 'urgent') && <span className="text-red-500 mt-0.5">•</span>}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{ann?.title ?? '-'}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann?.content ?? ''}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
