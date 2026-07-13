import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { TicketDetailClient } from './ticket-detail-client'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: { companySlug: string; id: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee') redirect(`/${params.companySlug}/sign-in`)

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, companyId: user.companyId ?? '' },
    include: {
      customer: true,
      assignedTo: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { attachments: true },
      },
    },
  })

  if (!ticket) return notFound()

  const employees = await prisma.companyUser.findMany({
    where: { companyId: user.companyId ?? '', isActive: true },
    select: { id: true, name: true },
  })

  return (
    <TicketDetailClient
      ticket={JSON.parse(JSON.stringify(ticket))}
      employees={JSON.parse(JSON.stringify(employees ?? []))}
      companySlug={params.companySlug}
      currentUserId={user.id}
      currentUserName={user.name}
    />
  )
}
