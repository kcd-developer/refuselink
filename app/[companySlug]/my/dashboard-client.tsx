'use client'

import {
  ArrowRight, Calendar, CreditCard, ExternalLink, FileText, Leaf,
  Megaphone, Recycle, Send, Ticket, Trash2, User,
} from 'lucide-react'
import Image from 'next/image'
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

const serviceLabels: Record<string, string> = {
  trash: 'Trash', recycling: 'Recycling', recycle: 'Recycling', yard_waste: 'Yard Waste',
}

const serviceStyles: Record<string, { background: string; color: string }> = {
  trash: { background: '#202124', color: '#fff' },
  recycling: { background: '#57A82B', color: '#fff' },
  recycle: { background: '#57A82B', color: '#fff' },
  yard_waste: { background: '#8A5A36', color: '#fff' },
}

function ServiceIcon({ service, className = 'h-4 w-4' }: { service: string; className?: string }) {
  if (service === 'recycling' || service === 'recycle') return <Recycle className={className} />
  if (service === 'yard_waste') return <Leaf className={className} />
  return <Trash2 className={className} />
}

export function CustomerDashboardClient({
  userName, companySlug, primaryColor, paymentUrl, paymentLabel,
  accounts, openTickets, announcements, addressServices,
}: Props) {
  const currentDay = new Date().getDay()
  const allServices = (addressServices ?? []).flatMap((item: any) => item.services ?? [])
  const nextService = [...allServices].sort((left: any, right: any) =>
    ((left.dayOfWeek - currentDay + 7) % 7) - ((right.dayOfWeek - currentDay + 7) % 7)
  )[0]
  const nextServiceLabel = nextService
    ? `${dayNames[nextService.dayOfWeek]} · ${serviceLabels[nextService.service] ?? nextService.service}`
    : 'No service scheduled'
  const firstName = userName?.split?.(' ')?.[0] ?? 'Customer'
  const primaryAccount = (accounts ?? []).find((account: any) => account?.isPrimary)?.customer ?? (accounts ?? [])[0]?.customer
  const primaryServices = (addressServices ?? []).find((item: any) => item.customerId === primaryAccount?.id)?.services ?? []
  const heroCart = nextService?.service === 'trash'
    ? '/images/kc-disposal-trash-cart.png'
    : nextService?.service === 'recycling' || nextService?.service === 'recycle'
      ? '/images/kc-disposal-recycling-cart.png'
      : null

  const stats = [
    { label: 'Open Tickets', value: openTickets ?? 0, icon: Ticket, accent: primaryColor },
    { label: 'Announcements', value: (announcements ?? []).length, icon: Megaphone, accent: 'var(--company-secondary)' },
    { label: 'Linked Accounts', value: (accounts ?? []).length, icon: User, accent: primaryColor },
  ]

  return (
    <div className="space-y-6 pb-8">
      <section
        className="relative isolate min-h-[clamp(17.5rem,28vw,18rem)] overflow-hidden rounded-2xl px-[clamp(1.75rem,4vw,2.5rem)] py-[clamp(2rem,3.5vw,2.25rem)] text-white shadow-[0_18px_45px_-24px_rgba(15,23,42,0.55)]"
        style={{ background: `linear-gradient(118deg, ${primaryColor} 0%, #0849ad 62%, var(--company-secondary) 145%)` }}
      >
        <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(135deg,transparent_48%,rgba(255,255,255,.28)_49%,transparent_50%)] [background-size:58px_58px]" />
        <div className="absolute -bottom-32 -right-16 -z-10 h-64 w-[72%] rotate-[-8deg] rounded-[50%] bg-[var(--company-secondary)] opacity-95" />
        <div className="absolute -bottom-36 -right-28 -z-10 h-64 w-[78%] rotate-[-5deg] rounded-[50%] bg-lime-300/35" />

        <div className="relative z-10 max-w-[62%]">
          <h1 className="font-display text-[clamp(1.875rem,3.2vw,2.25rem)] font-bold tracking-tight">Welcome, {firstName}</h1>
          <p className="mt-1 text-[clamp(0.875rem,1.4vw,1rem)] text-blue-50">Manage your account and services</p>
          <div className="mt-[clamp(2.25rem,4vw,2.75rem)] flex items-center gap-[clamp(0.75rem,1.5vw,1rem)]">
            <span className="flex h-[clamp(3rem,5vw,3.5rem)] w-[clamp(3rem,5vw,3.5rem)] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 shadow-inner backdrop-blur-sm">
              {nextService ? <ServiceIcon service={nextService.service} className="h-6 w-6" /> : <Calendar className="h-6 w-6" />}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">Next Service</p>
              <p className="mt-1 font-display text-[clamp(1.875rem,4vw,3rem)] font-bold leading-none">{nextServiceLabel}</p>
            </div>
          </div>
        </div>

        {heroCart ? (
          <Image
            src={heroCart}
            alt={nextService?.service === 'trash' ? 'KC Disposal trash cart' : 'KC Disposal recycling cart'}
            width={520}
            height={500}
            priority
            className="absolute bottom-[clamp(-3.5rem,-4vw,-2.25rem)] right-[clamp(-3.5rem,-4vw,0.5rem)] z-0 h-[clamp(15.3125rem,40vw,21.5625rem)] w-[clamp(16.125rem,42vw,22.8125rem)] object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.28)]"
          />
        ) : (
          <Leaf className="absolute -bottom-8 right-[clamp(1.25rem,5vw,3.5rem)] h-[clamp(13rem,24vw,16rem)] w-[clamp(13rem,24vw,16rem)] rotate-[-10deg] text-white/14" strokeWidth={1.2} />
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 min-[700px]:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="flex min-h-28 items-center gap-[clamp(0.75rem,1.8vw,1.25rem)] rounded-2xl border border-slate-200/80 bg-white px-[clamp(0.875rem,2vw,1.25rem)] py-4 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.45)]">
            <span className="flex h-[clamp(3rem,5vw,3.5rem)] w-[clamp(3rem,5vw,3.5rem)] shrink-0 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-slate-50" style={{ backgroundColor: accent }}>
              <Icon className="h-[clamp(1.5rem,2.5vw,1.75rem)] w-[clamp(1.5rem,2.5vw,1.75rem)]" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-3xl font-bold leading-none text-slate-900">{value}</p>
              <p className="mt-2 whitespace-nowrap text-[clamp(0.8125rem,1.3vw,0.875rem)] text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {primaryAccount && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.45)] sm:p-7">
            <h2 className="font-display text-lg font-bold text-slate-900">Account Summary</h2>
            <dl className="mt-5 space-y-3">
              <div className="flex justify-between gap-5 text-sm"><dt className="text-slate-500">Name</dt><dd className="text-right font-medium text-slate-900">{primaryAccount?.name ?? '-'}</dd></div>
              <div className="flex justify-between gap-5 text-sm"><dt className="text-slate-500">Account #</dt><dd className="text-right font-mono text-slate-900">{primaryAccount?.accountNumber ?? '-'}</dd></div>
              <div className="flex justify-between gap-5 text-sm"><dt className="text-slate-500">Type</dt><dd className="text-right capitalize text-slate-900">{primaryAccount?.type?.replace?.('_', ' ') ?? '-'}</dd></div>
              <div className="flex justify-between gap-5 text-sm"><dt className="text-slate-500">Address</dt><dd className="text-right text-slate-900">{primaryAccount?.address ?? '-'}</dd></div>
              {primaryAccount?.community?.name && (
                <div className="flex justify-between gap-5 text-sm"><dt className="text-slate-500">Community</dt><dd className="text-right font-semibold text-slate-900">{primaryAccount.community.name}</dd></div>
              )}
              <div className="flex items-start justify-between gap-5 text-sm">
                <dt className="pt-1 text-slate-500">Services</dt>
                <dd className="flex max-w-[75%] flex-wrap justify-end gap-1.5 text-right">
                  {primaryServices.length ? primaryServices.map((service: any) => (
                    <span key={service.service} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm" style={serviceStyles[service.service] ?? serviceStyles.trash}>
                      <ServiceIcon service={service.service} className="h-3.5 w-3.5" />
                      {serviceLabels[service.service] ?? service.service} · {dayNames[service.dayOfWeek]}{service.containerSize ? ` · ${service.containerSize}` : ''}
                    </span>
                  )) : <span className="pt-1 text-slate-500">Not assigned</span>}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.45)] sm:p-7">
          <h2 className="font-display text-lg font-bold text-slate-900">Quick Actions</h2>
          <div className="mt-5 space-y-3">
            {paymentUrl && (
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/50">
                <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-800"><span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: primaryColor }}><CreditCard className="h-5 w-5" /></span>{paymentLabel || 'Pay Bill'}</span>
                <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
              </a>
            )}
            <QuickAction href={`/${companySlug}/my/tickets`} label="Submit a Request" icon={Send} color={primaryColor} />
            <QuickAction href={`/${companySlug}/my/service-schedules`} label="View Schedule" icon={Calendar} color="#4D9221" />
            <QuickAction href={`/${companySlug}/my/documents`} label="Browse Documents" icon={FileText} color={primaryColor} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.45)] md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent Announcements</h2>
            <Link href={`/${companySlug}/my/announcements`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: primaryColor }}>View All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(announcements ?? []).length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center px-6 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100" style={{ color: primaryColor }}><Megaphone className="h-6 w-6" /></span>
                <p className="mt-3 text-sm text-slate-500">No announcements</p>
              </div>
            ) : (
              (announcements ?? []).map((announcement: any) => (
                <div key={announcement?.id} className="px-6 py-4 sm:px-7">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100" style={{ color: primaryColor }}><Megaphone className="h-3.5 w-3.5" /></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{announcement?.title ?? '-'}</p>
                        {(announcement?.priority === 'high' || announcement?.priority === 'urgent') && <span className="h-2 w-2 rounded-full bg-red-500" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{announcement?.content ?? ''}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function QuickAction({ href, label, icon: Icon, color }: { href: string; label: string; icon: typeof Send; color: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/50">
      <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm" style={{ backgroundColor: color }}><Icon className="h-5 w-5" /></span>{label}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
    </Link>
  )
}
