export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CommunitiesClient } from './communities-client'

export default async function CommunitiesPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== params.companySlug) redirect(`/${params.companySlug}/sign-in`)

  const [communities, cities] = await Promise.all([
    prisma.community.findMany({
      where: { companyId: user.companyId! },
      include: { city: { select: { name: true, state: true } }, _count: { select: { customers: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.city.findMany({
      where: { companyId: user.companyId! },
      select: { id: true, name: true, state: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return <CommunitiesClient communities={communities as any} companySlug={params.companySlug} cities={cities} />
}
