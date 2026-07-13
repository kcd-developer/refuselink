export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { EmployeesClient } from './employees-client'

export default async function EmployeesPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== resolvedParams.companySlug) redirect(`/${resolvedParams.companySlug}/sign-in`)
  if (!['company_owner', 'company_admin'].includes(user.role ?? '')) redirect(`/${resolvedParams.companySlug}/dashboard`)

  const employees = await prisma.companyUser.findMany({
    where: { companyId: user.companyId! },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return <EmployeesClient employees={employees as any} companySlug={resolvedParams.companySlug} currentUserRole={user.role ?? ''} />
}
