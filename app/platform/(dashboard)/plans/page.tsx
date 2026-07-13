import { prisma } from '@/lib/db'
import { PlansClient } from './plans-client'

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { displayOrder: 'asc' } })
  return <PlansClient plans={JSON.parse(JSON.stringify(plans))} />
}
