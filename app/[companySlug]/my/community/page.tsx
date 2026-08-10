import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const categoryLabels: Record<string, string> = {
  missed_pickup: 'Missed Pickup', recycling_issue: 'Recycling Issue', yard_waste_issue: 'Yard Waste Issue',
  cart_issue: 'Cart Issue', illegal_dumping: 'Illegal Dumping', community_cleanliness: 'Community Cleanliness',
  service_delay: 'Service Delay', other: 'Other Service Issue',
}
const statusLabels: Record<string, string> = { open: 'Open', in_progress: 'In Progress', waiting_on_customer: 'Waiting on Resident', resolved: 'Resolved', closed: 'Closed' }

export default async function CustomerCommunityPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug) redirect(`/${companySlug}/sign-in`)

  const [residentAccess, ownMemberships] = await Promise.all([
    prisma.customerUserAccess.findMany({
      where: { customerUserId: user.id, customer: { companyId: user.companyId!, communityId: { not: null } } },
      select: { customer: { select: { communityId: true } } },
    }),
    prisma.communityMembership.findMany({
      where: { customerUserId: user.id, isActive: true, community: { companyId: user.companyId! } },
      select: { communityId: true, role: true },
    }),
  ])
  const communityIds = [...new Set([...residentAccess.map((item) => item.customer.communityId), ...ownMemberships.map((item) => item.communityId)].filter(Boolean))] as string[]
  if (!communityIds.length) redirect(`/${companySlug}/my`)
  const elevatedIds = new Set(ownMemberships.map((item) => item.communityId))

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

  const issues = elevatedIds.size ? await prisma.ticket.findMany({
    where: {
      companyId: user.companyId!,
      customer: { communityId: { in: [...elevatedIds] } },
      category: { not: 'billing_account' },
    },
    select: {
      id: true, ticketNumber: true, category: true, status: true, createdAt: true,
      customer: { select: { communityId: true } },
      messages: { where: { authorType: 'employee', isInternal: false }, select: { id: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }) : []

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl font-bold text-slate-900">Community</h1><p className="mt-1 text-sm text-slate-500">Board contacts and community service activity</p></div>
      <div className="space-y-6">
        {communities.map((community) => {
          const communityIssues = issues.filter((issue) => issue.customer.communityId === community.id)
          return (
            <section key={community.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-semibold text-slate-900">{community.name}</h2><p className="text-sm text-slate-500">{community.city.name}, {community.city.state}</p></div>
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
                    <h3 className="mb-1 text-sm font-semibold text-slate-700">Community Issue Activity</h3>
                    <p className="mb-3 text-xs text-slate-500">Private resident details and ticket conversations are not shown.</p>
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {communityIssues.map((issue) => (
                        <div key={issue.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[120px_1fr_140px_140px] sm:items-center">
                          <span className="text-xs text-slate-500">{issue.createdAt.toLocaleDateString('en-US')}</span>
                          <span className="font-medium text-slate-800">{categoryLabels[issue.category] ?? 'Service Issue'}</span>
                          <span className="text-xs text-slate-600">{issue.messages.length ? 'Company responded' : 'Awaiting response'}</span>
                          <span className="text-xs font-medium text-slate-600">{statusLabels[issue.status] ?? issue.status}</span>
                        </div>
                      ))}
                      {!communityIssues.length && <p className="px-4 py-6 text-center text-sm text-slate-400">No community issues submitted.</p>}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
