export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { AnnouncementsClient } from './announcements-client'

export default async function AnnouncementsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== resolvedParams.companySlug) redirect(`/${resolvedParams.companySlug}/sign-in`)

  const [announcements, cities, communities] = await Promise.all([
    prisma.announcement.findMany({ where: { companyId: user.companyId! }, orderBy: { createdAt: 'desc' } }),
    prisma.city.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.community.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return <AnnouncementsClient announcements={announcements as any} companySlug={resolvedParams.companySlug} cities={cities} communities={communities} />
}
