import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

// Shared by the customer layout and its page. This is request-scoped, so it
// deduplicates identical reads without serving stale branding between requests.
export const getCustomerCompany = cache((companyId: string) =>
  prisma.company.findUnique({
    where: { id: companyId },
    include: { branding: true },
  })
)
