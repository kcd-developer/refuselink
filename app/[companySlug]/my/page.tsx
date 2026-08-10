import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomerDashboardClient } from './dashboard-client'
import { getCustomerAddressServices } from '@/lib/customer-address-services'

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
  const primaryAccess = access.find((item) => item.isPrimary) ?? access[0]
  const showPaymentLink = Boolean(primaryAccess) && !primaryAccess.customer.communityId

  const customers = access.map((item) => item.customer)
  const [openTickets, announcements, addressServices] = await Promise.all([
    prisma.ticket.count({
      where: { companyId: user.companyId ?? '', customerId: { in: customerIds }, status: { in: ['open', 'in_progress'] } },
    }),
    prisma.announcement.findMany({
      where: { companyId: user.companyId ?? '', isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    getCustomerAddressServices(user.companyId ?? '', customers),
  ])

  return (
    <CustomerDashboardClient
      userName={user.name}
      companySlug={resolvedParams.companySlug}
      primaryColor={company?.branding?.primaryColor ?? '#1D4ED8'}
      paymentUrl={showPaymentLink ? company?.branding?.paymentUrl ?? null : null}
      paymentLabel={showPaymentLink ? company?.branding?.paymentLabel ?? null : null}
      accounts={JSON.parse(JSON.stringify(access ?? []))}
      openTickets={openTickets ?? 0}
      announcements={JSON.parse(JSON.stringify(announcements ?? []))}
      addressServices={JSON.parse(JSON.stringify(addressServices))}
    />
  )
}
