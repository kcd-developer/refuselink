import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import { CustomerTicketDetailClient } from '../../tickets/[id]/ticket-detail-client'
import { MarkRequestsRead } from '../mark-requests-read'
import { getCustomerCompany } from '@/lib/customer-company'
import { AutoRefresh } from '@/components/auto-refresh'

export const dynamic = 'force-dynamic'

export default async function ManagedTicketDetailPage({ params }: { params: Promise<{ companySlug: string; id: string }> }) {
  const { companySlug, id } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) redirect(`/${companySlug}/sign-in`)
  const context = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  if (context.active.mode !== 'manager') {
    redirect(context.active.mode === 'resident' ? `/${companySlug}/my` : `/${companySlug}/my/community`)
  }
  const communityIds = context.managerCommunities.map((community) => community.id)
  const [ticket, company] = await Promise.all([prisma.ticket.findFirst({
    where: { id, companyId: user.companyId, serviceRecipient: 'community_manager', customer: { communityId: { in: communityIds } } },
    include: { customer: { select: { name: true, address: true, address2: true, community: { select: { name: true } } } }, messages: { where: { isInternal: false }, orderBy: { createdAt: 'asc' }, include: { attachments: true } } },
  }), getCustomerCompany(user.companyId)])
  if (!ticket) return notFound()
  return <><AutoRefresh /><MarkRequestsRead companySlug={companySlug} ticketIds={[ticket.id]} /><CustomerTicketDetailClient ticket={JSON.parse(JSON.stringify(ticket))} companySlug={companySlug} companyName={company?.name ?? 'Service Company'} backHref={`/${companySlug}/my/managed-tickets`} canEscalate /></>
}
