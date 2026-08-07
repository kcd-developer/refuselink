import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomerDashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function CustomerDashboardPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${resolvedParams.companySlug}/sign-in`)

  const company = await prisma.company.findUnique({
    where: { slug: resolvedParams.companySlug },
    include: { branding: true },
  })

  // Get customer accounts
  const access = await prisma.customerUserAccess.findMany({
    where: { customerUser: { id: user.id } },
    include: {
      customer: {
        include: {
          cityRef: { select: { name: true } },
          community: { select: { name: true } },
        },
      },
    },
  })

  const customerIds = (access ?? []).map((a: any) => a?.customerId).filter(Boolean)

  const [openTickets, announcements, schedules] = await Promise.all([
    prisma.ticket.count({
      where: { companyId: user.companyId ?? '', customerId: { in: customerIds }, status: { in: ['open', 'in_progress'] } },
    }),
    prisma.announcement.findMany({
      where: { companyId: user.companyId ?? '', isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.serviceSchedule.findMany({
      where: { companyId: user.companyId ?? '', isActive: true },
      take: 5,
    }),
  ])

  return (
    <CustomerDashboardClient
      userName={user.name}
      companySlug={resolvedParams.companySlug}
      primaryColor={company?.branding?.primaryColor ?? '#1D4ED8'}
      paymentUrl={company?.branding?.paymentUrl ?? null}
      paymentLabel={company?.branding?.paymentLabel ?? null}
      accounts={JSON.parse(JSON.stringify(access ?? []))}
      openTickets={openTickets ?? 0}
      announcements={JSON.parse(JSON.stringify(announcements ?? []))}
      schedules={JSON.parse(JSON.stringify(schedules ?? []))}
    />
  )
}
