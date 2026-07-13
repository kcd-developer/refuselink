import { prisma } from '@/lib/db'
import { AuditLogsClient } from './audit-logs-client'

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { company: { select: { name: true, slug: true } } },
  })
  return <AuditLogsClient logs={JSON.parse(JSON.stringify(logs))} />
}
