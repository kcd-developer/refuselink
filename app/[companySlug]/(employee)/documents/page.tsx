export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { DocumentsClient } from './documents-client'

export default async function DocumentsPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== params.companySlug) redirect(`/${params.companySlug}/sign-in`)

  const [documents, cities, communities] = await Promise.all([
    prisma.document.findMany({ where: { companyId: user.companyId! }, orderBy: { createdAt: 'desc' } }),
    prisma.city.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.community.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return <DocumentsClient documents={documents as any} companySlug={params.companySlug} cities={cities} communities={communities} />
}
