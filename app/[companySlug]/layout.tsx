import { prisma } from '@/lib/db'
import { CompanyNotFound } from './company-not-found'

export const dynamic = 'force-dynamic'

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { companySlug: string }
}) {
  const company = await prisma.company.findUnique({
    where: { slug: params.companySlug },
    include: { branding: true },
  })

  if (!company) {
    return <CompanyNotFound />
  }

  return <>{children}</>
}
