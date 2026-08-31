import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const schema = z.object({ ticketIds: z.array(z.string().min(1)).max(500) })

export async function POST(request: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const allowed = await prisma.ticket.findMany({
    where: {
      id: { in: parsed.data.ticketIds },
      companyId: user.companyId,
      serviceRecipient: 'community_manager',
      customer: { community: { memberships: { some: { customerUserId: user.id, role: 'community_manager', isActive: true } } } },
    },
    select: { id: true },
  })
  await prisma.managerTicketRead.createMany({
    data: allowed.map((ticket) => ({ ticketId: ticket.id, customerUserId: user.id })),
    skipDuplicates: true,
  })
  return NextResponse.json({ success: true })
}
