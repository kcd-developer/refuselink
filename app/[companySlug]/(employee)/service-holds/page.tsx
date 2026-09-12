import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { EmployeeServiceHoldsClient } from './service-holds-client'
import { AutoRefresh } from '@/components/auto-refresh'

export const dynamic = 'force-dynamic'

export default async function EmployeeServiceHoldsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) redirect(`/${companySlug}/sign-in`)
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) redirect(`/${companySlug}/dashboard`)

  const [requests, suspendedAddresses] = await Promise.all([
    prisma.serviceHoldRequest.findMany({
      where: { companyId: user.companyId! },
      select: {
        id: true, action: true, status: true, priority: true, requestNote: true, internalNote: true, createdAt: true, processedAt: true, processedByName: true,
        requestedBy: { select: { name: true, email: true } },
        address: { select: { id: true, address: true, address2: true, zipCode: true, city: { select: { name: true, state: true } }, community: { select: { name: true } } } },
      },
      orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
      take: 250,
    }),
    prisma.address.findMany({
      where: { companyId: user.companyId!, serviceStatus: 'suspended' },
      select: { id: true, address: true, address2: true, zipCode: true, serviceStatusUpdatedAt: true, city: { select: { name: true, state: true } }, community: { select: { name: true } } },
      orderBy: [{ community: { name: 'asc' } }, { address: 'asc' }],
    }),
  ])

  return <><AutoRefresh intervalMs={10000} /><EmployeeServiceHoldsClient companySlug={companySlug} requests={JSON.parse(JSON.stringify(requests))} suspendedAddresses={JSON.parse(JSON.stringify(suspendedAddresses))} /></>
}
