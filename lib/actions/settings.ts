'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').default('#0F172A'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').default('#3B82F6'),
  supportPhone: z.string().max(30).optional().nullable(),
  supportEmail: z.string().email().optional().nullable().or(z.literal('')),
  website: z.string().url().optional().nullable().or(z.literal('')),
  paymentUrl: z.string().url().optional().nullable().or(z.literal('')),
  paymentLabel: z.string().max(80).optional().nullable(),
})

export async function updateBranding(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const parsed = brandingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    const company = await prisma.company.findUnique({ where: { slug: companySlug } })
    if (!company || company.id !== user.companyId) return { error: 'Company not found' }
    await prisma.companyBranding.upsert({
      where: { companyId: company.id },
      update: {
        primaryColor: d.primaryColor,
        secondaryColor: d.secondaryColor,
        supportPhone: d.supportPhone || null,
        supportEmail: d.supportEmail || null,
        website: d.website || null,
        paymentUrl: d.paymentUrl || null,
        paymentLabel: d.paymentLabel || null,
      },
      create: {
        companyId: company.id,
        primaryColor: d.primaryColor,
        secondaryColor: d.secondaryColor,
        supportPhone: d.supportPhone || null,
        supportEmail: d.supportEmail || null,
        website: d.website || null,
        paymentUrl: d.paymentUrl || null,
        paymentLabel: d.paymentLabel || null,
      },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'update', entityType: 'branding', entityId: company.id })
    revalidatePath(`/${companySlug}/settings`)
    return { success: true }
  } catch { return { error: 'Failed to update branding' } }
}
