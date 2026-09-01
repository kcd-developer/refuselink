import { prisma } from '@/lib/db'
import { CompanyNotFound } from './company-not-found'
import type { CSSProperties } from 'react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ companySlug: string }> }): Promise<Metadata> {
  const { companySlug } = await params
  const company = await prisma.company.findUnique({ where: { slug: companySlug }, select: { name: true } })
  return {
    manifest: `/${companySlug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: company?.name ?? 'RefuseLink',
    },
    icons: {
      apple: '/apple-touch-icon.png?v=3',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

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
