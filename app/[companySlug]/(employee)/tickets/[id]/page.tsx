import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { TicketDetailClient } from './ticket-detail-client'
import { AutoRefresh } from '@/components/auto-refresh'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: Promise<{ companySlug: string; id: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee') redirect(`/${resolvedParams.companySlug}/sign-in`)

  const ticket = await prisma.ticket.findFirst({
    where: { id: resolvedParams.id, companyId: user.companyId ?? '' },
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
    <><AutoRefresh /><TicketDetailClient
      ticket={JSON.parse(JSON.stringify(ticket))}
      employees={JSON.parse(JSON.stringify(employees ?? []))}
      companySlug={resolvedParams.companySlug}
      currentUserId={user.id}
      currentUserName={user.name}
    /></>
  )
}
