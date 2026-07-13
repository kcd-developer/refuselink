import { prisma } from '@/lib/db'

export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    include: { branding: true, subscription: { include: { plan: true } } },
  })
}

export async function getCompanyBranding(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: { branding: true },
  })
  return company
}
