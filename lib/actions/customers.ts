'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const customerSchema = z.object({
  type: z.enum(['residential', 'commercial', 'roll_off']),
  name: z.string().min(1, 'Name is required').max(200),
  contactName: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  address2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  cityId: z.string().optional().nullable(),
  communityId: z.string().optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

const customerImportRowSchema = z.object({
  type: z.enum(['residential', 'commercial', 'roll_off']).optional().nullable(),
  name: z.string().trim().min(1, 'Customer name is required').max(200),
  contactName: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  address2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(50).optional().nullable(),
  zipCode: z.string().trim().max(20).optional().nullable(),
  community: z.string().trim().max(100).optional().nullable(),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export type CustomerImportRow = z.infer<typeof customerImportRowSchema>

function normalizeRole(role: string | undefined) {
  return ['company_owner', 'company_admin', 'company_manager', 'csr'].includes(role ?? '') 
}

function cleanOptional(value?: string | null) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function normalizeLocation(city?: string | null, state?: string | null) {
  return { city: cleanOptional(city), state: cleanOptional(state)?.toUpperCase() ?? null }
}

function addressKey(data: { address: string; address2?: string | null; cityId: string; zipCode?: string | null }) {
  return [data.address, data.address2 ?? '', data.cityId, data.zipCode ?? '']
    .map((value) => value.trim().toLocaleLowerCase())
    .join('|')
}

async function findOrCreateCity(tx: Prisma.TransactionClient, companyId: string, cityName: string, stateName: string) {
  const city = cityName.trim()
  const state = stateName.trim().toUpperCase()
  const existing = await tx.city.findFirst({
    where: {
      companyId,
      name: { equals: city, mode: 'insensitive' },
      state: { equals: state, mode: 'insensitive' },
    },
  })
  if (existing) return { city: existing, created: false }

  try {
    const created = await tx.city.create({ data: { companyId, name: city, state } })
    return { city: created, created: true }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const raced = await tx.city.findFirst({
        where: { companyId, name: { equals: city, mode: 'insensitive' }, state: { equals: state, mode: 'insensitive' } },
      })
      if (raced) return { city: raced, created: false }
    }
    throw error
  }
}

function revalidateCustomerPaths(companySlug: string) {
  revalidatePath(`/${companySlug}/customers`)
  revalidatePath(`/${companySlug}/addresses`)
  revalidatePath(`/${companySlug}/cities`)
  revalidatePath(`/${companySlug}/communities`)
}

export async function createCustomer(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!normalizeRole(user.role)) return { error: 'Insufficient permissions' }
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    const customer = await prisma.customer.create({
      data: {
        companyId: user.companyId!,
        type: d.type,
        name: d.name,
        contactName: d.contactName || null,
        email: d.email || null,
        phone: d.phone || null,
        address: d.address || null,
        address2: d.address2 || null,
        city: d.city || null,
        state: d.state || null,
        zipCode: d.zipCode || null,
        cityId: d.cityId || null,
        communityId: d.communityId || null,
        accountNumber: d.accountNumber || null,
        notes: d.notes || null,
      },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'create', entityType: 'customer', entityId: customer.id })
    revalidateCustomerPaths(companySlug)
    return { success: true, customer }
  } catch { return { error: 'Failed to create customer' } }
}

export async function updateCustomer(companySlug: string, customerId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!normalizeRole(user.role)) return { error: 'Insufficient permissions' }
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    await prisma.customer.update({
      where: { id: customerId, companyId: user.companyId! },
      data: {
        type: d.type,
        name: d.name,
        contactName: d.contactName || null,
        email: d.email || null,
        phone: d.phone || null,
        address: d.address || null,
        address2: d.address2 || null,
        city: d.city || null,
        state: d.state || null,
        zipCode: d.zipCode || null,
        cityId: d.cityId || null,
        communityId: d.communityId || null,
        accountNumber: d.accountNumber || null,
        notes: d.notes || null,
      },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'update', entityType: 'customer', entityId: customerId })
    revalidateCustomerPaths(companySlug)
    return { success: true }
  } catch { return { error: 'Failed to update customer' } }
}

export async function importCustomers(companySlug: string, rows: CustomerImportRow[]) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!normalizeRole(user.role)) return { error: 'Insufficient permissions' }
  if (!Array.isArray(rows) || rows.length === 0) return { error: 'The CSV file does not contain any customers' }
  if (rows.length > 1000) return { error: 'Import up to 1,000 customers at a time' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const communities = await tx.community.findMany({
        where: { companyId: user.companyId! },
        select: { id: true, name: true, cityId: true },
      })
      const existingAddresses = await tx.address.findMany({
        where: { companyId: user.companyId! },
        select: { address: true, address2: true, cityId: true, zipCode: true },
      })
      const knownAddressKeys = new Set(existingAddresses.map(addressKey))
      const cityCache = new Map<string, { id: string; name: string; state: string; created: boolean }>()
      const errors: string[] = []
      let created = 0
      let updated = 0
      let skipped = 0
      let addressesCreated = 0
      let citiesCreated = 0

      for (let index = 0; index < rows.length; index += 1) {
        const parsed = customerImportRowSchema.safeParse(rows[index])
        if (!parsed.success) {
          skipped += 1
          errors.push(`Row ${index + 2}: ${parsed.error.errors[0]?.message ?? 'Invalid customer'}`)
          continue
        }

        const row = parsed.data
        const location = normalizeLocation(row.city, row.state)
        let cityId: string | null = null
        let communityId: string | null = null

        if (cleanOptional(row.address)) {
          if (!location.city || !location.state) {
            skipped += 1
            errors.push(`Row ${index + 2}: City and state are required when an address is provided`)
            continue
          }

          const cityKey = `${location.city.toLocaleLowerCase()}|${location.state.toLocaleLowerCase()}`
          let cachedCity = cityCache.get(cityKey)
          if (!cachedCity) {
            const cityResult = await findOrCreateCity(tx, user.companyId!, location.city, location.state)
            cachedCity = { id: cityResult.city.id, name: cityResult.city.name, state: cityResult.city.state, created: cityResult.created }
            cityCache.set(cityKey, cachedCity)
            if (cityResult.created) citiesCreated += 1
          }
          cityId = cachedCity.id

          if (cleanOptional(row.community)) {
            const community = communities.find((candidate) =>
              candidate.cityId === cityId && candidate.name.toLocaleLowerCase() === row.community!.trim().toLocaleLowerCase()
            )
            if (!community) {
              skipped += 1
              errors.push(`Row ${index + 2}: Community "${row.community}" was not found in ${cachedCity.name}, ${cachedCity.state}`)
              continue
            }
            communityId = community.id
          }
        }

        const customerData = {
          companyId: user.companyId!,
          type: row.type || 'residential',
          name: row.name,
          contactName: cleanOptional(row.contactName),
          email: cleanOptional(row.email),
          phone: cleanOptional(row.phone),
          address: cleanOptional(row.address),
          address2: cleanOptional(row.address2),
          city: location.city,
          state: location.state,
          zipCode: cleanOptional(row.zipCode),
          cityId,
          communityId,
          accountNumber: cleanOptional(row.accountNumber),
          notes: cleanOptional(row.notes),
        }

        const existingCustomer = customerData.accountNumber
          ? await tx.customer.findFirst({
              where: {
                companyId: user.companyId!,
                accountNumber: { equals: customerData.accountNumber, mode: 'insensitive' },
              },
            })
          : null

        if (existingCustomer) {
          await tx.customer.update({ where: { id: existingCustomer.id }, data: customerData })
          updated += 1
        } else {
          await tx.customer.create({ data: customerData })
          created += 1
        }

        if (customerData.address && cityId) {
          const key = addressKey({
            address: customerData.address,
            address2: customerData.address2,
            cityId,
            zipCode: customerData.zipCode,
          })
          if (!knownAddressKeys.has(key)) {
            knownAddressKeys.add(key)
            await tx.address.create({
              data: {
                companyId: user.companyId!,
                address: customerData.address,
                address2: customerData.address2,
                cityId,
                communityId,
                zipCode: customerData.zipCode,
              },
            })
            addressesCreated += 1
          }
        }
      }

      return { created, updated, skipped, addressesCreated, citiesCreated, errors: errors.slice(0, 25) }
    }, { timeout: 30000 })

    await createAuditLog({
      companyId: user.companyId,
      actorId: user.id,
      actorType: 'employee',
      actorName: user.name,
      action: 'import',
      entityType: 'customer',
      entityId: null,
      metadata: result,
    })
    revalidateCustomerPaths(companySlug)
    return { success: true, ...result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to import customers' }
  }
}
