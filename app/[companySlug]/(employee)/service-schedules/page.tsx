export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { SchedulesClient } from './schedules-client'

export default async function SchedulesPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== params.companySlug) redirect(`/${params.companySlug}/sign-in`)

  const [schedules, cities, communities] = await Promise.all([
    prisma.serviceSchedule.findMany({
      where: { companyId: user.companyId! },
      include: { exceptions: { orderBy: { date: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
    prisma.city.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.community.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true, cityId: true }, orderBy: { name: 'asc' } }),
  ])

  return <SchedulesClient schedules={schedules as any} companySlug={params.companySlug} cities={cities} communities={communities} />
}
