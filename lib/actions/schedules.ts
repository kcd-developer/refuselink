'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const scheduleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(['residential', 'commercial', 'roll_off']),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day'),
  cityId: z.string().optional().nullable(),
  communityId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

function hasPermission(role: string | undefined) {
  return ['company_owner', 'company_admin', 'company_manager', 'dispatcher'].includes(role ?? '')
}

export async function createSchedule(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  const parsed = scheduleSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    const schedule = await prisma.serviceSchedule.create({
      data: {
        companyId: user.companyId!,
        name: d.name,
        description: d.description || null,
        type: d.type,
        frequency: d.frequency,
        daysOfWeek: d.daysOfWeek,
        cityId: d.cityId || null,
        communityId: d.communityId || null,
        isActive: d.isActive,
      },
    })
    revalidatePath(`/${companySlug}/service-schedules`)
    return { success: true, schedule }
  } catch { return { error: 'Failed to create schedule' } }
}

export async function updateSchedule(companySlug: string, scheduleId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  const parsed = scheduleSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    await prisma.serviceSchedule.update({
      where: { id: scheduleId, companyId: user.companyId! },
      data: {
        name: d.name,
        description: d.description || null,
        type: d.type,
        frequency: d.frequency,
        daysOfWeek: d.daysOfWeek,
        cityId: d.cityId || null,
        communityId: d.communityId || null,
        isActive: d.isActive,
      },
    })
    revalidatePath(`/${companySlug}/service-schedules`)
    return { success: true }
  } catch { return { error: 'Failed to update schedule' } }
}

export async function addScheduleException(companySlug: string, scheduleId: string, data: { date: string; reason?: string; alternateDate?: string }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  // Verify schedule belongs to company
  const schedule = await prisma.serviceSchedule.findUnique({ where: { id: scheduleId, companyId: user.companyId! } })
  if (!schedule) return { error: 'Schedule not found' }
  try {
    await prisma.scheduleException.create({
      data: {
        serviceScheduleId: scheduleId,
        date: new Date(data.date),
        reason: data.reason || null,
        alternateDate: data.alternateDate ? new Date(data.alternateDate) : null,
      },
    })
    revalidatePath(`/${companySlug}/service-schedules`)
    return { success: true }
  } catch { return { error: 'Failed to add exception' } }
}
