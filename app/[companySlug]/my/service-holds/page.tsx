import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import { CommunityServiceHoldsClient } from './service-holds-client'

export const dynamic = 'force-dynamic'

export default async function CommunityServiceHoldsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) redirect(`/${companySlug}/sign-in`)

  const context = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  if (context.active.mode === 'resident') redirect(`/${companySlug}/my`)
  const communityIds = context.active.mode === 'board'
    ? context.options.filter((option) => option.mode === 'board' && option.communityId).map((option) => option.communityId!)
    : context.managerCommunities.map((community) => community.id)

  const addresses = await prisma.address.findMany({
    where: { companyId: user.companyId, communityId: { in: communityIds } },
    select: {
      id: true, address: true, address2: true, zipCode: true, serviceStatus: true, serviceStatusUpdatedAt: true,
      community: { select: { id: true, name: true } },
      city: { select: { name: true, state: true } },
      serviceHoldRequests: {
        select: { id: true, action: true, status: true, requestNote: true, internalNote: true, createdAt: true, processedAt: true, requestedBy: { select: { name: true } }, processedByName: true },
        orderBy: { createdAt: 'desc' }, take: 1,
      },
    },
    orderBy: [{ community: { name: 'asc' } }, { address: 'asc' }],
  })

  return <CommunityServiceHoldsClient companySlug={companySlug} addresses={JSON.parse(JSON.stringify(addresses))} />
}
