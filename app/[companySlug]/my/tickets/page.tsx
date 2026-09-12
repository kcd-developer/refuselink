import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomerTicketsClient } from './tickets-client'
import { MarkTicketsRead } from './mark-tickets-read'
import { AutoRefresh } from '@/components/auto-refresh'
import { address2Compatible, normalizeAddressText } from '@/lib/address-claim'

export const dynamic = 'force-dynamic'

export default async function CustomerTicketsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${resolvedParams.companySlug}/sign-in`)

  const access = await prisma.customerUserAccess.findMany({
    where: { customerUserId: user.id, customer: { companyId: user.companyId ?? '' } },
    select: { customerId: true, customer: { select: { address: true, address2: true, cityId: true, community: { select: { name: true, serviceIssueRouting: true } } } } },
  })
  const customerIds = (access ?? []).map((a: any) => a?.customerId).filter(Boolean)

  const tickets = await prisma.ticket.findMany({
    where: { companyId: user.companyId ?? '', customerId: { in: customerIds } },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      customerReads: { where: { customerUserId: user.id }, select: { id: true } },
      _count: { select: { messages: { where: { authorType: { in: ['employee', 'community_manager'] }, isInternal: false } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const unreadTicketIds = tickets.filter((ticket) => ticket._count.messages > 0 && !ticket.customerReads.length).map((ticket) => ticket.id)
  const primaryCustomer = access[0]?.customer
  const addressCandidates = primaryCustomer?.cityId ? await prisma.address.findMany({
    where: { companyId: user.companyId ?? '', cityId: primaryCustomer.cityId },
    select: { address: true, address2: true, serviceStatus: true },
  }) : []
  const serviceStatus = addressCandidates.find((address) =>
    normalizeAddressText(address.address) === normalizeAddressText(primaryCustomer?.address) &&
    address2Compatible(address.address2, primaryCustomer?.address2),
  )?.serviceStatus ?? 'active'

  return (
    <>
      <AutoRefresh />
      <MarkTicketsRead companySlug={resolvedParams.companySlug} ticketIds={unreadTicketIds} />
      <CustomerTicketsClient
      tickets={JSON.parse(JSON.stringify(tickets ?? []))}
      companySlug={resolvedParams.companySlug}
      customerIds={customerIds}
      requestRecipient={access[0]?.customer.community?.serviceIssueRouting === 'community_manager' ? 'community_manager' : 'company'}
      communityName={access[0]?.customer.community?.name ?? null}
      serviceStatus={serviceStatus}
      />
    </>
  )
}
