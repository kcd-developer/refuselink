'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().max(30).optional().nullable(),
})

export async function updateCustomerProfile(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  try {
    await prisma.customerUser.update({
      where: { id: user.id },
      data: { name: parsed.data.name, phone: parsed.data.phone || null },
    })
    revalidatePath(`/${companySlug}/my/profile`)
    return { success: true }
  } catch { return { error: 'Failed to update profile' } }
}

export async function updateCustomerPassword(companySlug: string, data: { currentPassword: string; newPassword: string }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!data.newPassword || data.newPassword.length < 8) return { error: 'New password must be at least 8 characters' }
  try {
    const customerUser = await prisma.customerUser.findUnique({ where: { id: user.id } })
    if (!customerUser) return { error: 'User not found' }
    const valid = await bcrypt.compare(data.currentPassword, customerUser.password)
    if (!valid) return { error: 'Current password is incorrect' }
    const hashed = await bcrypt.hash(data.newPassword, 12)
    await prisma.customerUser.update({ where: { id: user.id }, data: { password: hashed } })
    return { success: true }
  } catch { return { error: 'Failed to update password' } }
}
