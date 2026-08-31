import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, LockKeyhole, MapPin } from 'lucide-react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import { getTicketActivityLabel } from '@/lib/ticket-activity'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
const categoryLabels: Record<string, string> = {
  missed_pickup: 'Missed Pickup', recycling_issue: 'Recycling Issue', yard_waste_issue: 'Yard Waste Issue',
  cart_issue: 'Cart Issue', illegal_dumping: 'Illegal Dumping', community_cleanliness: 'Community Cleanliness',
  service_delay: 'Service Delay', other: 'Other Service Issue',
}
const statusLabels: Record<string, string> = { open: 'Open', in_progress: 'In Progress', waiting_on_customer: 'Waiting on Resident', resolved: 'Resolved', closed: 'Closed' }

function serviceAddress(customer: { address: string | null; address2: string | null }) {
  return [customer.address, customer.address2].filter(Boolean).join(', ') || 'Address unavailable'
}

export default async function CommunityActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string; communityId: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { companySlug, communityId } = await params
  const requestedPage = Number.parseInt((await searchParams).page ?? '1', 10)
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) redirect(`/${companySlug}/sign-in`)

  const viewContext = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  const canView = viewContext.active.mode === 'board'
    ? viewContext.active.communityId === communityId
    : viewContext.active.mode === 'manager' && viewContext.managerCommunities.some((community) => community.id === communityId)
  if (!canView) redirect(`/${companySlug}/my/community`)

  const where = {
    companyId: user.companyId,
    customer: { communityId },
    category: { not: 'billing_account' as const },
  }
  const [community, total, activity] = await Promise.all([
    prisma.community.findFirst({ where: { id: communityId, companyId: user.companyId }, include: { city: { select: { name: true, state: true } } } }),
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      select: {
        id: true, ticketNumber: true, category: true, status: true, createdAt: true, serviceRecipient: true,
        customer: { select: { address: true, address2: true } },
        messages: { where: { isInternal: false }, select: { authorType: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: { where: { isInternal: false } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])
  if (!community) redirect(`/${companySlug}/my/community`)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (page > totalPages) redirect(`/${companySlug}/my/community/${communityId}/activity?page=${totalPages}`)
  const pageHref = (target: number) => `/${companySlug}/my/community/${communityId}/activity?page=${target}`

  return (
    <div>
      <Link href={`/${companySlug}/my/community`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to communities
      </Link>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-slate-900">{community.name} Activity</h1>
        <p className="mt-1 text-sm text-slate-500">{community.city.name}, {community.city.state} · {total} {total === 1 ? 'entry' : 'entries'}</p>
        <p className="mt-1 text-xs text-slate-500">Resident names and ticket conversations are not shown.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {viewContext.active.mode === 'manager' && activity.length > 0 && (
          <div className="hidden grid-cols-[105px_minmax(130px,1fr)_minmax(210px,1.4fr)_130px_95px_165px] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Date</span>
            <span>Issue</span>
            <span>Service address</span>
            <span>Activity</span>
            <span>Status</span>
            <span>Availability</span>
          </div>
        )}
        <div className="divide-y divide-slate-100">
          {activity.map((issue) => {
            const canOpen = viewContext.active.mode === 'manager' && issue.serviceRecipient === 'community_manager'
            const row = <>
              <span className="text-xs text-slate-500">{issue.createdAt.toLocaleDateString('en-US')}</span>
              <span className="font-medium text-slate-800">{categoryLabels[issue.category] ?? 'Service Issue'}</span>
              {viewContext.active.mode === 'manager' && (
                <span className="col-span-2 flex min-w-0 items-center gap-1.5 text-xs text-slate-600 lg:col-span-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{serviceAddress(issue.customer)}</span>
                </span>
              )}
              <span className="text-xs text-slate-600">{getTicketActivityLabel({ messageCount: issue._count.messages, latestMessage: issue.messages[0] })}</span>
              <span className="text-xs font-medium text-slate-600">{statusLabels[issue.status] ?? issue.status}</span>
              {viewContext.active.mode === 'manager' && (
                canOpen ? (
                  <span className="col-span-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 lg:col-span-1 lg:justify-end">
                    Open request <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                ) : (
                  <span className="col-span-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 lg:col-span-1 lg:justify-end">
                    <LockKeyhole className="h-3.5 w-3.5" /> With KC Disposal
                  </span>
                )
              )}
            </>
            return canOpen ? (
              <Link key={issue.id} href={`/${companySlug}/my/managed-tickets/${issue.id}`} data-pressable="true" className="group grid grid-cols-2 cursor-pointer gap-x-4 gap-y-3 border-l-2 border-l-blue-500 bg-blue-50/30 px-5 py-4 text-sm transition-all hover:bg-blue-50 hover:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)] lg:grid-cols-[105px_minmax(130px,1fr)_minmax(210px,1.4fr)_130px_95px_165px] lg:items-center" aria-label={`Open ${categoryLabels[issue.category] ?? 'service issue'} at ${serviceAddress(issue.customer)}`}>
                {row}
              </Link>
            ) : (
              <div key={issue.id} className={`grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm ${viewContext.active.mode === 'manager' ? 'bg-slate-50/70 text-slate-500 lg:grid-cols-[105px_minmax(130px,1fr)_minmax(210px,1.4fr)_130px_95px_165px]' : 'lg:grid-cols-[120px_1fr_150px_140px]'} lg:items-center`}>{row}</div>
            )
          })}
          {!activity.length && <p className="px-5 py-12 text-center text-sm text-slate-400">No community activity yet.</p>}
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="Activity pagination">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /> Previous</Link>}
            {page < totalPages && <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Next <ChevronRight className="h-4 w-4" /></Link>}
          </div>
        </nav>
      )}
    </div>
  )
}
