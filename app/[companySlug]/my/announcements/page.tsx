import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getCustomerViewContext } from '@/lib/customer-view'
import { CustomerAnnouncementsClient } from './announcements-client'
import { getCustomerCompany } from '@/lib/customer-company'
import { MarkAnnouncementsRead } from './mark-announcements-read'

export const dynamic = 'force-dynamic'

export default async function CustomerAnnouncementsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) redirect(`/${companySlug}/sign-in`)

  const [viewContext, company, accountAccess] = await Promise.all([
    getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug }),
    getCustomerCompany(user.companyId),
    prisma.customerUserAccess.findMany({
      where: { customerUserId: user.id, customer: { companyId: user.companyId } },
      select: { customer: { select: { type: true, cityId: true, communityId: true } } },
    }),
  ])

  const accountTypes = [...new Set(accountAccess.map((item) => item.customer.type))]
  const cityIds = [...new Set(accountAccess.map((item) => item.customer.cityId).filter(Boolean))] as string[]
  const residentCommunityIds = [...new Set(accountAccess.map((item) => item.customer.communityId).filter(Boolean))] as string[]
  const managerCommunities = viewContext.managerCommunities
  const boardCommunities = viewContext.options
    .filter((option) => option.mode === 'board' && option.communityId && option.communityName)
    .map((option) => ({ id: option.communityId!, name: option.communityName! }))
  const visibleCommunityIds = viewContext.active.mode === 'resident'
    ? residentCommunityIds
    : viewContext.active.mode === 'board'
      ? boardCommunities.map((community) => community.id)
      : viewContext.active.allCommunities
      ? managerCommunities.map((community) => community.id)
      : viewContext.active.communityId ? [viewContext.active.communityId] : []
  const creationCommunities = viewContext.active.mode === 'resident'
    ? []
    : viewContext.active.mode === 'board'
      ? boardCommunities
      : viewContext.active.allCommunities
      ? managerCommunities
      : viewContext.active.communityId && viewContext.active.communityName
        ? [{ id: viewContext.active.communityId, name: viewContext.active.communityName }]
        : []

  const audienceFilters: any[] = [{ targetAll: true }]
  if (accountTypes.length) audienceFilters.push({ targetTypes: { hasSome: accountTypes } })
  if (cityIds.length) audienceFilters.push({ targetCityIds: { hasSome: cityIds } })
  if (residentCommunityIds.length) audienceFilters.push({ targetCommunityIds: { hasSome: residentCommunityIds } })
  const now = new Date()

  const [companyAnnouncements, communityAnnouncements] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        companyId: user.companyId,
        isPublished: true,
        startDate: { lte: now },
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }, { OR: audienceFilters }],
      },
      orderBy: { createdAt: 'desc' },
    }),
    visibleCommunityIds.length ? prisma.communityAnnouncement.findMany({
      where: {
        companyId: user.companyId,
        communityId: { in: visibleCommunityIds },
        ...(viewContext.active.mode === 'resident'
          ? { isPublished: true, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] }
          : { OR: [
              { isPublished: false },
              { isPublished: true, startDate: { lte: now }, AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }] },
            ] }),
      },
      include: {
        community: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) : [],
  ])

  const feed = [
    ...companyAnnouncements.map((announcement) => ({
      id: announcement.id,
      sourceType: 'company' as const,
      sourceKey: 'company',
      sourceLabel: company?.name ?? 'Service Company',
      communityId: null,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      startDate: announcement.startDate.toISOString(),
      endDate: announcement.endDate?.toISOString() ?? null,
      createdAt: announcement.createdAt.toISOString(),
      authorName: null,
      canManage: false,
    })),
    ...communityAnnouncements.map((announcement) => ({
      id: announcement.id,
      sourceType: 'community' as const,
      sourceKey: `community:${announcement.communityId}`,
      sourceLabel: announcement.community.name,
      communityId: announcement.communityId,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      startDate: announcement.startDate.toISOString(),
      endDate: announcement.endDate?.toISOString() ?? null,
      createdAt: announcement.createdAt.toISOString(),
      authorName: announcement.createdBy.name,
      isPublished: announcement.isPublished,
      canManage: viewContext.active.mode !== 'resident',
    })),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

  return (
    <>
      <MarkAnnouncementsRead
        companySlug={companySlug}
        companyAnnouncementIds={companyAnnouncements.map((announcement) => announcement.id)}
        communityAnnouncementIds={communityAnnouncements.filter((announcement) => announcement.isPublished).map((announcement) => announcement.id)}
      />
      <CustomerAnnouncementsClient
      companySlug={companySlug}
      companyName={company?.name ?? 'Service Company'}
      announcements={feed}
      creationCommunities={creationCommunities}
      canCreate={viewContext.active.mode === 'board' && creationCommunities.length > 0}
      />
    </>
  )
}
