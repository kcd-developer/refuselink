export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CommunitiesClient } from './communities-client'

export default async function CommunitiesPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== resolvedParams.companySlug) redirect(`/${resolvedParams.companySlug}/sign-in`)

  const [communities, cities, residentAccess, communityServiceRows] = await Promise.all([
    prisma.community.findMany({
      where: { companyId: user.companyId! },
      include: {
        city: { select: { name: true, state: true } },
        addresses: {
          where: { latitude: { not: null }, longitude: { not: null } },
          select: { id: true, address: true, address2: true, latitude: true, longitude: true, services: { select: { service: true, route: true, containerSize: true, dayOfWeek: true } } },
        },
        memberships: {
          where: { isActive: true },
          include: { customerUser: { select: { id: true, name: true, email: true, phone: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { customers: true, addresses: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.city.findMany({
      where: { companyId: user.companyId! },
      select: { id: true, name: true, state: true },
      orderBy: { name: 'asc' },
    }),
    prisma.customerUserAccess.findMany({
      where: { customer: { companyId: user.companyId!, communityId: { not: null } } },
      select: {
        customerUser: { select: { id: true, name: true, email: true, phone: true } },
        customer: { select: { communityId: true } },
      },
    }),
    prisma.addressService.findMany({
      where: { address: { companyId: user.companyId!, communityId: { not: null } } },
      select: { addressId: true, service: true, route: true, containerSize: true, dayOfWeek: true, address: { select: { communityId: true } } },
    }),
  ])

  const communitiesWithServices = communities.map((community) => {
    const rows = communityServiceRows.filter((row) => row.address.communityId === community.id)
    const serviceSummaries = (['trash', 'recycling', 'yard_waste'] as const).flatMap((service) => {
      const assignments = rows.filter((row) => row.service === service)
      if (!assignments.length) return []
      return [{
        service,
        assignedCount: new Set(assignments.map((assignment) => assignment.addressId)).size,
        routes: [...new Set(assignments.map((assignment) => assignment.route || 'Unassigned'))].sort(),
        containerSizes: [...new Set(assignments.map((assignment) => assignment.containerSize || 'No Container'))].sort(),
        daysOfWeek: [...new Set(assignments.map((assignment) => assignment.dayOfWeek))].sort(),
      }]
    })
    return { ...community, serviceSummaries }
  })

  return <CommunitiesClient communities={communitiesWithServices as any} companySlug={resolvedParams.companySlug} cities={cities} residentAccess={residentAccess as any} />
}
