export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { CustomerTicketDetailClient } from './ticket-detail-client'

export default async function CustomerTicketDetailPage({ params }: { params: { companySlug: string; id: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== params.companySlug) redirect(`/${params.companySlug}/sign-in`)

  // Get customer's accessible account IDs
  const access = await prisma.customerUserAccess.findMany({
    where: { customerUserId: user.id, customer: { companyId: user.companyId! } },
    select: { customerId: true },
  })
  const customerIds = access.map(a => a.customerId)

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id, companyId: user.companyId! },
    include: {
      customer: { select: { name: true } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: 'asc' },
        include: { attachments: true },
      },
    },
  })

  if (!ticket || !customerIds.includes(ticket.customerId)) return notFound()

  return <CustomerTicketDetailClient ticket={ticket as any} companySlug={params.companySlug} />
}
