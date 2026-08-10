export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { AddressesClient } from './addresses-client'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

export default async function AddressesPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) {
    redirect(`/${companySlug}/sign-in`)
  }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) {
    redirect(`/${companySlug}/dashboard`)
  }

  const [addresses, cities, communities] = await Promise.all([
    prisma.address.findMany({
      where: { companyId: user.companyId! },
      include: {
        city: { select: { id: true, name: true, state: true } },
        community: { select: { id: true, name: true } },
        services: { orderBy: { service: 'asc' } },
      },
      orderBy: [{ city: { name: 'asc' } }, { address: 'asc' }],
    }),
    prisma.city.findMany({
      where: { companyId: user.companyId! },
      select: { id: true, name: true, state: true },
      orderBy: [{ name: 'asc' }, { state: 'asc' }],
    }),
    prisma.community.findMany({
      where: { companyId: user.companyId! },
      select: { id: true, name: true, cityId: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <AddressesClient
      addresses={addresses}
      cities={cities}
      communities={communities}
      companySlug={companySlug}
    />
  )
}
