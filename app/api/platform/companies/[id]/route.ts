export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'platform') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { status } = body ?? {}

  const company = await prisma.company.update({
    where: { id: resolvedParams.id },
    data: { status },
  })

  await createAuditLog({
    actorId: user.id,
    actorType: 'platform',
    actorName: user.name,
    action: `company_${status}`,
    entityType: 'Company',
    entityId: company.id,
    metadata: { status },
  })

  return NextResponse.json(company)
}
