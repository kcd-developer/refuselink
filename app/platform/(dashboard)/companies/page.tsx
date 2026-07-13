export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CompaniesClient } from './companies-client'

export default async function CompaniesPage() {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'platform') redirect('/platform/sign-in')

  const [companies, plans] = await Promise.all([
    prisma.company.findMany({
      include: {
        branding: { select: { primaryColor: true } },
        subscription: { include: { plan: { select: { name: true } } } },
        _count: { select: { employees: true, customers: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
  ])

  return <CompaniesClient companies={companies as any} plans={plans as any} />
}
