import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import Link from 'next/link'
import { ArrowRight, ChevronDown, MapPin } from 'lucide-react'
import { getTicketActivityLabel } from '@/lib/ticket-activity'

export const dynamic = 'force-dynamic'

const categoryLabels: Record<string, string> = {
  missed_pickup: 'Missed Pickup', recycling_issue: 'Recycling Issue', yard_waste_issue: 'Yard Waste Issue',
  cart_issue: 'Cart Issue', illegal_dumping: 'Illegal Dumping', community_cleanliness: 'Community Cleanliness',
  service_delay: 'Service Delay', other: 'Other Service Issue',
}
const statusLabels: Record<string, string> = { open: 'Open', in_progress: 'In Progress', waiting_on_customer: 'Waiting on Resident', resolved: 'Resolved', closed: 'Closed' }

function serviceAddress(customer: { address: string | null; address2: string | null }) {
  return [customer.address, customer.address2].filter(Boolean).join(', ') || 'Address unavailable'
}

export default async function CustomerCommunityPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug) redirect(`/${companySlug}/sign-in`)

  const viewContext = await getCustomerViewContext({ userId: user.id, companyId: user.companyId!, companySlug })
  const residentAccess = viewContext.active.mode === 'resident' ? await prisma.customerUserAccess.findMany({
      where: { customerUserId: user.id, customer: { companyId: user.companyId!, communityId: { not: null } } },
      select: { customer: { select: { communityId: true } } },
    }) : []

  const communityIds = viewContext.active.mode === 'resident'
    ? [...new Set(residentAccess.map((item) => item.customer.communityId).filter(Boolean))] as string[]
    : viewContext.active.allCommunities
      ? viewContext.managerCommunities.map((community) => community.id)
      : viewContext.active.communityId ? [viewContext.active.communityId] : []
  if (!communityIds.length) redirect(`/${companySlug}/my`)
  const elevatedIds = new Set(viewContext.active.mode === 'resident' ? [] : communityIds)

  const communities = await prisma.community.findMany({
    where: { id: { in: communityIds }, companyId: user.companyId! },
    include: {
      city: { select: { name: true, state: true } },
      memberships: {
        where: { isActive: true },
        include: { customerUser: { select: { name: true } } },
        orderBy: { positionTitle: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const issues = elevatedIds.size ? (await Promise.all([...elevatedIds].map((communityId) =>
    prisma.ticket.findMany({
      where: {
        companyId: user.companyId!,
        customer: { communityId },
        category: { not: 'billing_account' },
      },
      select: {
        id: true, ticketNumber: true, category: true, status: true, createdAt: true, serviceRecipient: true,
        customer: { select: { communityId: true, address: true, address2: true } },
        messages: { where: { isInternal: false }, select: { authorType: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: { where: { isInternal: false } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
  ))).flat() : []

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {viewContext.active.mode === 'board' ? 'Board Member View' : viewContext.active.mode === 'manager' ? 'Community Manager View' : 'Community'}
          </h1>
          {viewContext.active.mode !== 'resident' && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {viewContext.active.allCommunities ? `${communities.length} Communities` : viewContext.active.communityName}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {viewContext.active.mode === 'resident'
            ? 'Board contacts and community information'
            : 'Community issue activity without resident names or private conversations'}
        </p>
      </div>
      <div className="space-y-6">
        {communities.map((community) => {
          const communityIssues = issues.filter((issue) => issue.customer.communityId === community.id)
          const communityContent = (
            <div className="p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Board Members & Management</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {community.memberships.map((membership) => (
                    <div key={membership.id} className="rounded-lg bg-slate-50 p-4">
                      <p className="font-medium text-slate-900">{membership.customerUser.name}</p>
                      <p className="text-xs text-slate-500">{membership.positionTitle || (membership.role === 'board_member' ? 'Board Member' : 'Community Manager')}</p>
                      <div className="mt-2 text-sm text-slate-600">
                        {membership.showEmail && membership.publicEmail && <p><a className="text-blue-600 hover:underline" href={`mailto:${membership.publicEmail}`}>{membership.publicEmail}</a></p>}
                        {membership.showPhone && membership.publicPhone && <p><a className="text-blue-600 hover:underline" href={`tel:${membership.publicPhone}`}>{membership.publicPhone}</a></p>}
                      </div>
                    </div>
                  ))}
                  {!community.memberships.length && <p className="text-sm text-slate-400">No board contacts have been published.</p>}
                </div>

                {elevatedIds.has(community.id) && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 className="mb-1 text-sm font-semibold text-slate-700">Recent Community Activity</h3>
                        <p className="text-xs text-slate-500">The three most recent entries are shown without private resident details or conversations.</p>
                      </div>
                      <Link href={`/${companySlug}/my/community/${community.id}/activity`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        View all activity <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {communityIssues.map((issue) => {
                        const canOpen = viewContext.active.mode === 'manager' && issue.serviceRecipient === 'community_manager'
                        const activityRow = <>
                          <span className="min-w-0">
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Date</span>
                            <span className="block text-xs text-slate-500">{issue.createdAt.toLocaleDateString('en-US')}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Issue</span>
                            <span className="block truncate font-medium text-slate-800">{categoryLabels[issue.category] ?? 'Service Issue'}</span>
                          </span>
                          <span className="col-span-2 min-w-0 lg:col-span-1">
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Service address</span>
                            <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">{serviceAddress(issue.customer)}</span>
                            </span>
                          </span>
                          <span className="min-w-0">
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Activity</span>
                            <span className="block text-xs text-slate-600">{getTicketActivityLabel({ messageCount: issue._count.messages, latestMessage: issue.messages[0] })}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Status</span>
                            <span className="block text-xs font-medium text-slate-600">{statusLabels[issue.status] ?? issue.status}</span>
                          </span>
                        </>
                        return canOpen ? (
                          <Link
                            key={issue.id}
                            href={`/${companySlug}/my/managed-tickets/${issue.id}`}
                            data-pressable="true"
                            className="group grid grid-cols-2 cursor-pointer gap-x-4 gap-y-3 border-l-2 border-l-blue-500 bg-blue-50/30 px-4 py-3 text-sm transition-all hover:bg-blue-50 hover:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)] lg:grid-cols-[105px_minmax(130px,1fr)_minmax(190px,1.35fr)_145px_105px] lg:items-center"
                            aria-label={`Open ${categoryLabels[issue.category] ?? 'service issue'} at ${serviceAddress(issue.customer)}`}
                          >
                            {activityRow}
                          </Link>
                        ) : (
                          <div key={issue.id} className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-sm lg:grid-cols-[105px_minmax(130px,1fr)_minmax(190px,1.35fr)_145px_105px] lg:items-center">{activityRow}</div>
                        )
                      })}
                      {!communityIssues.length && <p className="px-4 py-6 text-center text-sm text-slate-400">No community activity yet.</p>}
                    </div>
                  </div>
                )}
            </div>
          )

          if (viewContext.active.mode === 'manager') {
            return (
              <details name="managed-communities" key={community.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
                  <div>
                    <h2 className="font-semibold text-slate-900">{community.name}</h2>
                    <p className="text-sm text-slate-500">{community.city.name}, {community.city.state}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs text-slate-500 sm:inline">View details</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                  </div>
                </summary>
                <div className="border-t border-slate-100">{communityContent}</div>
              </details>
            )
          }

          return (
            <section key={community.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-900">{community.name}</h2>
                <p className="text-sm text-slate-500">{community.city.name}, {community.city.state}</p>
              </div>
              {communityContent}
            </section>
          )
        })}
      </div>
    </div>
  )
}
