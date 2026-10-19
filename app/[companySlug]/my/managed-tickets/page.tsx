import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import { MarkRequestsRead } from './mark-requests-read'
import { AutoRefresh } from '@/components/auto-refresh'
import { ManagedTicketsClient } from './managed-tickets-client'

export const dynamic = 'force-dynamic'

export default async function ManagedTicketsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) redirect(`/${companySlug}/sign-in`)
  const context = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  if (context.active.mode !== 'manager') redirect(`/${companySlug}/my/community`)
  const communityIds = context.managerCommunities.map((community) => community.id)
  const [tickets, communities] = await Promise.all([
    prisma.ticket.findMany({
      where: { companyId: user.companyId, communityId: { in: communityIds }, OR: [{ serviceRecipient: 'community_manager' }, { createdByType: 'community_manager' }] },
      include: {
        customer: { select: { name: true, community: { select: { name: true } } } },
        community: { select: { name: true } },
        address: { select: { address: true, address2: true } },
        messages: { where: { isInternal: false }, orderBy: { createdAt: 'desc' }, take: 1 },
        managerReads: { where: { customerUserId: user.id }, select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.community.findMany({
      where: { id: { in: communityIds }, companyId: user.companyId },
      select: { id: true, name: true, addresses: { select: { id: true, address: true, address2: true }, orderBy: [{ address: 'asc' }, { address2: 'asc' }] } },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <>
      <AutoRefresh />
      <MarkRequestsRead companySlug={companySlug} ticketIds={tickets.filter((ticket) => !ticket.managerReads.length).map((ticket) => ticket.id)} />
      <ManagedTicketsClient tickets={JSON.parse(JSON.stringify(tickets))} communities={communities} companySlug={companySlug} />
    </>
  )
}
