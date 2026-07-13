import { prisma } from '@/lib/db'
import { CompanyNotFound } from './company-not-found'

export const dynamic = 'force-dynamic'

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const resolvedParams = await params
  const company = await prisma.company.findUnique({
    where: { slug: resolvedParams.companySlug },
    include: { branding: true },
  })

  if (!company) {
    return <CompanyNotFound />
  }

  return <>{children}</>
}
