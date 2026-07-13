import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomerTicketsClient } from './tickets-client'

export const dynamic = 'force-dynamic'

export default async function CustomerTicketsPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${params.companySlug}/sign-in`)

  const access = await prisma.customerUserAccess.findMany({
    where: { customerUserId: user.id },
    select: { customerId: true },
  })
  const customerIds = (access ?? []).map((a: any) => a?.customerId).filter(Boolean)

  const tickets = await prisma.ticket.findMany({
    where: { companyId: user.companyId ?? '', customerId: { in: customerIds } },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <CustomerTicketsClient
      tickets={JSON.parse(JSON.stringify(tickets ?? []))}
      companySlug={params.companySlug}
      customerIds={customerIds}
    />
  )
}
