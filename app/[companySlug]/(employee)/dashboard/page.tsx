import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function EmployeeDashboardPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee') redirect(`/${params.companySlug}/sign-in`)

  const companyId = user.companyId ?? ''

  const [ticketCounts, customerCount, recentTickets, announcements] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['status'],
      where: { companyId },
      _count: true,
    }),
    prisma.customer.count({ where: { companyId, isActive: true } }),
    prisma.ticket.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } }, assignedTo: { select: { name: true } } },
    }),
    prisma.announcement.findMany({
      where: { companyId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ])

  const ticketsByStatus: Record<string, number> = {}
  ;(ticketCounts ?? []).forEach((t: any) => {
    ticketsByStatus[t?.status ?? 'unknown'] = t?._count ?? 0
  })

  return (
    <DashboardClient
      userName={user.name ?? 'User'}
      companySlug={params.companySlug}
      ticketsByStatus={ticketsByStatus}
      customerCount={customerCount ?? 0}
      recentTickets={JSON.parse(JSON.stringify(recentTickets ?? []))}
      announcements={JSON.parse(JSON.stringify(announcements ?? []))}
    />
  )
}
