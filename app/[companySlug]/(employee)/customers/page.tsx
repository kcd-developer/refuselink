export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomersClient } from './customers-client'

export default async function CustomersPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== params.companySlug) redirect(`/${params.companySlug}/sign-in`)

  const [customers, cities, communities] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: user.companyId! },
      include: { cityRef: { select: { name: true, state: true } }, community: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.city.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true, state: true }, orderBy: { name: 'asc' } }),
    prisma.community.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true, cityId: true }, orderBy: { name: 'asc' } }),
  ])

  return <CustomersClient customers={customers as any} companySlug={params.companySlug} cities={cities} communities={communities} />
}
