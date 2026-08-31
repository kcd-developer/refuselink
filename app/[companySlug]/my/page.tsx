import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomerDashboardClient } from './dashboard-client'
import { getCustomerAddressServices } from '@/lib/customer-address-services'
import { getCustomerViewContext } from '@/lib/customer-view'
import { getCustomerCompany } from '@/lib/customer-company'

export const dynamic = 'force-dynamic'

export default async function CustomerDashboardPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${resolvedParams.companySlug}/sign-in`)
  const [viewContext, company, access] = await Promise.all([
    getCustomerViewContext({ userId: user.id, companyId: user.companyId!, companySlug: resolvedParams.companySlug }),
    getCustomerCompany(user.companyId!),
    prisma.customerUserAccess.findMany({
      where: { customerUser: { id: user.id } },
      include: {
        customer: {
          include: {
            cityRef: { select: { name: true } },
            community: { select: { name: true } },
          },
        },
      },
    }),
  ])
  if (viewContext.active.mode !== 'resident') redirect(`/${resolvedParams.companySlug}/my/community`)

  const customerIds = (access ?? []).map((a: any) => a?.customerId).filter(Boolean)
  const primaryAccess = access.find((item) => item.isPrimary) ?? access[0]
  const showPaymentLink = Boolean(primaryAccess) && !primaryAccess.customer.communityId

  const customers = access.map((item) => item.customer)
  const accountTypes = [...new Set(customers.map((customer) => customer.type))]
  const cityIds = [...new Set(customers.map((customer) => customer.cityId).filter(Boolean))] as string[]
  const communityIds = [...new Set(customers.map((customer) => customer.communityId).filter(Boolean))] as string[]
  const audienceFilters: any[] = [{ targetAll: true }]
  if (accountTypes.length) audienceFilters.push({ targetTypes: { hasSome: accountTypes } })
  if (cityIds.length) audienceFilters.push({ targetCityIds: { hasSome: cityIds } })
  if (communityIds.length) audienceFilters.push({ targetCommunityIds: { hasSome: communityIds } })
  const now = new Date()
  const [openTickets, companyAnnouncements, communityAnnouncements, addressServices] = await Promise.all([
    prisma.ticket.count({
      where: { companyId: user.companyId ?? '', customerId: { in: customerIds }, status: { in: ['open', 'in_progress'] } },
    }),
    prisma.announcement.findMany({
      where: {
        companyId: user.companyId ?? '', isPublished: true, startDate: { lte: now },
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }, { OR: audienceFilters }],
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    communityIds.length ? prisma.communityAnnouncement.findMany({
      where: {
        companyId: user.companyId ?? '', communityId: { in: communityIds }, isPublished: true, startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }) : [],
    getCustomerAddressServices(user.companyId ?? '', customers),
  ])
  const announcements = [...companyAnnouncements, ...communityAnnouncements]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 3)

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
