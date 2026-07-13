export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(req: Request, { params }: { params: Promise<{ companySlug: string; id: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== resolvedParams.companySlug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const data: any = {}
  if (body?.status) data.status = body.status
  if (body?.assignedToId !== undefined) data.assignedToId = body.assignedToId || null
  if (body?.priority) data.priority = body.priority

  const ticket = await prisma.ticket.updateMany({
    where: { id: resolvedParams.id, companyId: user.companyId ?? '' },
    data,
  })

  await createAuditLog({
    companyId: user.companyId,
    actorId: user.id,
    actorType: 'employee',
    actorName: user.name,
    action: 'ticket_update',
    entityType: 'Ticket',
    entityId: resolvedParams.id,
    metadata: data,
  })

  return NextResponse.json({ success: true })
}
