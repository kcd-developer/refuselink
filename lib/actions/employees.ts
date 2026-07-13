'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Valid email is required'),
  role: z.enum(['company_owner', 'company_admin', 'company_manager', 'csr', 'dispatcher']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  isActive: z.boolean().default(true),
})

export async function createEmployee(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  if (data.role === 'company_owner' && user.role !== 'company_owner') return { error: 'Only owners can create owner accounts' }
  const parsed = employeeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  if (!data.password) return { error: 'Password is required for new employees' }
  const d = parsed.data
  try {
    const hashedPassword = await bcrypt.hash(data.password, 12)
    const emp = await prisma.companyUser.create({
      data: { companyId: user.companyId!, name: d.name, email: d.email, password: hashedPassword, role: d.role, isActive: d.isActive },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'create', entityType: 'employee', entityId: emp.id })
    revalidatePath(`/${companySlug}/employees`)
    return { success: true }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'An employee with this email already exists' }
    return { error: 'Failed to create employee' }
  }
}

export async function updateEmployee(companySlug: string, employeeId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const target = await prisma.companyUser.findUnique({ where: { id: employeeId, companyId: user.companyId! } })
  if (!target) return { error: 'Employee not found' }
  if (target.role === 'company_owner' && user.role !== 'company_owner') return { error: 'Cannot modify owner accounts' }
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.email) updateData.email = data.email
  if (data.role) updateData.role = data.role
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
  if (data.password && data.password.length >= 8) {
    updateData.password = await bcrypt.hash(data.password, 12)
  }
  try {
    await prisma.companyUser.update({ where: { id: employeeId }, data: updateData })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'update', entityType: 'employee', entityId: employeeId })
    revalidatePath(`/${companySlug}/employees`)
    return { success: true }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'An employee with this email already exists' }
    return { error: 'Failed to update employee' }
  }
}
