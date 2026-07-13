import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { TicketsClient } from './tickets-client'

export const dynamic = 'force-dynamic'

export default async function TicketsPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee') redirect(`/${params.companySlug}/sign-in`)

  const tickets = await prisma.ticket.findMany({
    where: { companyId: user.companyId ?? '' },
    include: {
      customer: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <TicketsClient tickets={JSON.parse(JSON.stringify(tickets ?? []))} companySlug={params.companySlug} />
}
