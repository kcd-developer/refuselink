import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    include: { branding: true },
  })
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  return NextResponse.json({
    id: `/${companySlug}/`,
    name: `${company.name} Customer Portal`,
    short_name: company.name,
    description: `Customer and community portal for ${company.name}`,
    start_url: `/${companySlug}/sign-in?source=pwa`,
    scope: `/${companySlug}/`,
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: company.branding?.primaryColor ?? '#1d4ed8',
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
