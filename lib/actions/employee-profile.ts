'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function updateEmployeePassword(
  companySlug: string,
  data: { currentPassword: string; newPassword: string },
) {
  const session = await getSession()
  const user = getSessionUser(session)

  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) {
    return { error: 'Unauthorized' }
  }

  const parsed = passwordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  try {
    const employee = await prisma.companyUser.findUnique({
      where: { id: user.id },
    })

    if (!employee || employee.companyId !== user.companyId) {
      return { error: 'User not found' }
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, employee.password)
    if (!valid) {
      return { error: 'Current password is incorrect' }
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.companyUser.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return { success: true }
  } catch {
    return { error: 'Failed to update password' }
  }
}
