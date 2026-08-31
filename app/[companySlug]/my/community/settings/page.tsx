import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import { CommunitySettingsClient } from './settings-client'

export const dynamic = 'force-dynamic'

export default async function CommunitySettingsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) redirect(`/${companySlug}/sign-in`)
  const context = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  if (context.active.mode !== 'board' || !context.active.communityId) return notFound()
  const community = await prisma.community.findFirst({ where: { id: context.active.communityId, companyId: user.companyId }, select: { id: true, name: true, serviceIssueRouting: true, memberships: { where: { role: 'community_manager', isActive: true }, select: { id: true }, take: 1 } } })
  if (!community) return notFound()
  return <CommunitySettingsClient companySlug={companySlug} community={{ id: community.id, name: community.name, serviceIssueRouting: community.serviceIssueRouting, hasManager: community.memberships.length > 0 }} />
}
