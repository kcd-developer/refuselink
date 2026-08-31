import 'server-only'

import { prisma } from '@/lib/db'
import type { CustomerViewContext } from '@/lib/customer-view'

export async function getUnreadAnnouncementCount({
  userId,
  companyId,
  viewContext,
}: {
  userId: string
  companyId: string
  viewContext: CustomerViewContext
}) {
  const accountAccess = await prisma.customerUserAccess.findMany({
    where: { customerUserId: userId, customer: { companyId } },
    select: { customer: { select: { type: true, cityId: true, communityId: true } } },
  })
  const accountTypes = [...new Set(accountAccess.map((item) => item.customer.type))]
  const cityIds = [...new Set(accountAccess.map((item) => item.customer.cityId).filter(Boolean))] as string[]
  const residentCommunityIds = [...new Set(accountAccess.map((item) => item.customer.communityId).filter(Boolean))] as string[]
  const boardCommunityIds = viewContext.options
    .filter((option) => option.mode === 'board' && option.communityId)
    .map((option) => option.communityId!)
  const visibleCommunityIds = viewContext.active.mode === 'resident'
    ? residentCommunityIds
    : viewContext.active.mode === 'board'
      ? boardCommunityIds
      : viewContext.managerCommunities.map((community) => community.id)

  const audienceFilters: any[] = [{ targetAll: true }]
  if (accountTypes.length) audienceFilters.push({ targetTypes: { hasSome: accountTypes } })
  if (cityIds.length) audienceFilters.push({ targetCityIds: { hasSome: cityIds } })
  if (residentCommunityIds.length) audienceFilters.push({ targetCommunityIds: { hasSome: residentCommunityIds } })
  const now = new Date()

  const [companyAnnouncements, communityAnnouncements] = await Promise.all([
    prisma.announcement.count({
      where: {
        companyId,
        isPublished: true,
        startDate: { lte: now },
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }, { OR: audienceFilters }],
        customerReads: { none: { customerUserId: userId } },
      },
    }),
    visibleCommunityIds.length
      ? prisma.communityAnnouncement.count({
          where: {
            companyId,
            communityId: { in: visibleCommunityIds },
            isPublished: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
            customerReads: { none: { customerUserId: userId } },
          },
        })
      : 0,
  ])

  return companyAnnouncements + communityAnnouncements
}
