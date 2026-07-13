import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CompanyDetailClient } from './company-detail-client'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      branding: true,
      subscription: { include: { plan: true } },
      _count: {
        select: { employees: true, customers: true, cities: true, communities: true, tickets: true },
      },
    },
  })

  if (!company) return notFound()

  const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } })

  return <CompanyDetailClient company={JSON.parse(JSON.stringify(company))} plans={JSON.parse(JSON.stringify(plans))} />
}
