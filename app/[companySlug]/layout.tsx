import { prisma } from '@/lib/db'
import { CompanyNotFound } from './company-not-found'
import type { CSSProperties } from 'react'

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

  return (
    <div
      style={{
        '--company-primary': company.branding?.primaryColor ?? '#1D4ED8',
        '--company-secondary': company.branding?.secondaryColor ?? '#3B82F6',
      } as CSSProperties}
    >
      {children}
    </div>
  )
}
