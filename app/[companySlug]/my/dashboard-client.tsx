'use client'

import {
  ArrowRight, Calendar, CreditCard, ExternalLink, FileText, Leaf,
  Megaphone, Send, Ticket, User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { daysUntilService, serviceWeekLabel, type ServiceWeekCycle } from '@/lib/service-week-cycle'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
  trash: 'Trash', recycling: 'Recycle', recycle: 'Recycle', yard_waste: 'Yard Waste',
}

const serviceStyles: Record<string, { background: string; color: string }> = {
  trash: { background: '#202124', color: '#fff' },
  recycling: { background: '#57A82B', color: '#fff' },
  recycle: { background: '#57A82B', color: '#fff' },
  yard_waste: { background: '#8A5A36', color: '#fff' },
}

export function CustomerDashboardClient({
  userName, companySlug, primaryColor, paymentUrl, paymentLabel,
  accounts, openTickets, announcements, addressServices,
}: Props) {
  const currentDate = new Date()
  const allServices = (addressServices ?? []).flatMap((item: any) => item.services ?? [])
  const firstName = userName?.split?.(' ')?.[0] ?? 'Customer'
  const primaryAccount = (accounts ?? []).find((account: any) => account?.isPrimary)?.customer ?? (accounts ?? [])[0]?.customer
  const primaryServices = (addressServices ?? []).find((item: any) => item.customerId === primaryAccount?.id)?.services ?? []
  const dashboardServices = primaryServices.length ? primaryServices : allServices
  const scheduledServices = dashboardServices.filter((service: any) =>
    service.service === 'trash' || service.service === 'recycling' || service.service === 'recycle' || service.service === 'yard_waste'
  )
  const upcomingServices = scheduledServices
    .map((service: any) => ({
      ...service,
      daysUntil: daysUntilService(currentDate, service.dayOfWeek, (service.weekCycle ?? null) as ServiceWeekCycle),
    }))
    .filter((service: any) => service.daysUntil !== null)
    .sort((left: any, right: any) => left.daysUntil - right.daysUntil)
  const nextService = upcomingServices[0]
  const nextServices = nextService
    ? upcomingServices.filter((service: any) => service.daysUntil === nextService.daysUntil)
    : []
  const nextServiceOffset = nextService?.daysUntil ?? null
  const nextServiceDay = nextServiceOffset === 0
    ? 'Today'
    : nextServiceOffset === 1
      ? 'Tomorrow'
      : nextService
        ? fullDayNames[nextService.dayOfWeek]
        : ''
  const nextServiceLabel = nextService
    ? nextServiceDay
    : 'No service scheduled'
  const hasTrashService = nextServices.some((service: any) => service.service === 'trash')
  const hasRecyclingService = nextServices.some((service: any) => service.service === 'recycling' || service.service === 'recycle')
  const yardWasteService = nextServices.find((service: any) => service.service === 'yard_waste')
  const hasYardWasteService = Boolean(yardWasteService)
  const hasTrashAndRecycling = hasTrashService && hasRecyclingService
  const hasOtherCartService = hasTrashService || hasRecyclingService

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
          <div className="mt-[clamp(3.5rem,5vw,4.25rem)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">Next Service</p>
              <p className="mt-1 font-display text-[clamp(1.875rem,4vw,3rem)] font-bold leading-none">{nextServiceLabel}</p>
            </div>
          </div>
        </div>

        {hasTrashService || hasRecyclingService || hasYardWasteService ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[52%]" aria-hidden="true">
            {hasYardWasteService && (
              <Image
                src={yardWasteService?.containerSize ? '/images/kc-disposal-yard-waste-cart.png' : '/images/yard-waste-bag.png'}
                alt=""
                width={yardWasteService?.containerSize ? 520 : 360}
                height={yardWasteService?.containerSize ? 500 : 540}
                priority
                className={`absolute object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.25)] ${yardWasteService?.containerSize ? 'bottom-[clamp(-3.25rem,-4vw,-2.1rem)] h-[clamp(12rem,29vw,18rem)] w-[clamp(12.75rem,31vw,19.25rem)]' : 'bottom-[clamp(-0.75rem,-1vw,0.25rem)] h-[clamp(8rem,20vw,12rem)] w-[clamp(6.5rem,16vw,9.5rem)]'} ${hasOtherCartService ? 'right-[clamp(12rem,23vw,20rem)] z-0' : 'right-[clamp(0rem,2vw,3rem)] z-10'}`}
              />
            )}
            {hasRecyclingService && (
              <Image
                src="/images/kc-disposal-recycling-cart-clean.png"
                alt=""
                width={520}
                height={500}
                priority
                className={`absolute bottom-[clamp(-3.25rem,-4vw,-2.1rem)] h-[clamp(13rem,32vw,20rem)] w-[clamp(13.75rem,34vw,21.25rem)] object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.28)] ${hasTrashAndRecycling ? 'right-[clamp(3.5rem,8vw,7rem)] z-10 scale-[0.94]' : 'right-[clamp(-3.25rem,-4vw,0.5rem)] z-10'}`}
              />
            )}
            {hasTrashService && (
              <Image
                src="/images/kc-disposal-trash-cart-clean.png"
                alt=""
                width={520}
                height={500}
                priority
                className="absolute bottom-[clamp(-3.25rem,-4vw,-2.1rem)] right-[clamp(-3.25rem,-4vw,0.5rem)] z-10 h-[clamp(13rem,32vw,20rem)] w-[clamp(13.75rem,34vw,21.25rem)] object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.28)]"
              />
            )}
          </div>
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
                    <span key={service.service} className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium shadow-sm" style={serviceStyles[service.service] ?? serviceStyles.trash}>
                      {serviceLabels[service.service] ?? service.service} · {dayNames[service.dayOfWeek]}{service.weekCycle ? ` · ${serviceWeekLabel(service.weekCycle)}` : ''}{service.containerSize ? ` · ${service.containerSize}` : ''}
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
                  <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{announcement?.title ?? '-'}</p>
                        {(announcement?.priority === 'high' || announcement?.priority === 'urgent') && <span className="h-2 w-2 rounded-full bg-red-500" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{announcement?.content ?? ''}</p>
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
