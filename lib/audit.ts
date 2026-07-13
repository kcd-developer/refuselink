import { prisma } from "@/lib/db";

interface AuditLogEntry {
  companyId?: string | null;
  actorId: string;
  actorType: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: entry.companyId ?? null,
        actorId: entry.actorId,
        actorType: entry.actorType,
        actorName: entry.actorName,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ?? null,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (error: any) {
    console.error("Audit log error:", error?.message);
  }
}
