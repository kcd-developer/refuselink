export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { CustomerTicketDetailClient } from './ticket-detail-client'
import { MarkTicketsRead } from '../mark-tickets-read'
import { getCustomerCompany } from '@/lib/customer-company'
import { AutoRefresh } from '@/components/auto-refresh'

export default async function CustomerTicketDetailPage({ params }: { params: Promise<{ companySlug: string; id: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== resolvedParams.companySlug) redirect(`/${resolvedParams.companySlug}/sign-in`)

  // Get customer's accessible account IDs
  const access = await prisma.customerUserAccess.findMany({
    where: { customerUserId: user.id, customer: { companyId: user.companyId! } },
    select: { customerId: true },
  })
  const customerIds = access.map(a => a.customerId)

  const [ticket, company] = await Promise.all([prisma.ticket.findUnique({
    where: { id: resolvedParams.id, companyId: user.companyId! },
    include: {
      customer: { select: { name: true } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: 'asc' },
        include: { attachments: true },
      },
    },
  }), getCustomerCompany(user.companyId!)])

  if (!ticket || !customerIds.includes(ticket.customerId)) return notFound()

  return <><AutoRefresh /><MarkTicketsRead companySlug={resolvedParams.companySlug} ticketIds={[ticket.id]} /><CustomerTicketDetailClient ticket={ticket as any} companySlug={resolvedParams.companySlug} companyName={company?.name ?? 'Service Company'} /></>
}
