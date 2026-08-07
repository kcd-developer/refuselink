'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser, type SessionUser } from '@/lib/session'
import { formatStreetAddress, formatTitleCase } from '@/lib/text-format'

const allowedRoles = ['company_owner', 'company_admin', 'company_manager']

const addressSchema = z.object({
  address: z.string().trim().min(1, 'Street address is required').max(300),
  address2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(50),
  zipCode: z.string().trim().max(20).optional().nullable(),
  communityId: z.string().trim().optional().nullable(),
})

const importRowSchema = addressSchema.omit({ communityId: true }).extend({
  community: z.string().trim().max(100).optional().nullable(),
})

export type AddressInput = z.infer<typeof addressSchema>
export type AddressImportRow = z.infer<typeof importRowSchema>

async function authorize(companySlug: string) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) {
    return { error: 'Unauthorized' as const }
  }
  if (!allowedRoles.includes(user.role ?? '')) {
    return { error: 'Insufficient permissions' as const }
  }
  return { user }
}

function cleanOptional(value?: string | null) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function normalizeLocation(city: string, state: string) {
  return { city: formatTitleCase(city), state: state.trim().toUpperCase() }
}

function addressKey(data: { address: string; address2?: string | null; cityId: string; zipCode?: string | null }) {
  return [data.address, data.address2 ?? '', data.cityId, data.zipCode ?? '']
    .map((value) => value.trim().toLocaleLowerCase())
    .join('|')
}

async function findOrCreateCity(tx: Prisma.TransactionClient, companyId: string, cityName: string, stateName: string) {
  const { city, state } = normalizeLocation(cityName, stateName)
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

async function validateCommunity(tx: Prisma.TransactionClient, companyId: string, cityId: string, communityId?: string | null) {
  if (!communityId) return null
  const community = await tx.community.findFirst({ where: { id: communityId, companyId } })
  if (!community) throw new Error('Community not found')
  if (community.cityId !== cityId) throw new Error('The selected community is not in this city')
  return community.id
}

async function findDuplicate(tx: Prisma.TransactionClient, companyId: string, data: { address: string; address2?: string | null; cityId: string; zipCode?: string | null }, excludeId?: string) {
  const candidates = await tx.address.findMany({
    where: {
      companyId,
      cityId: data.cityId,
      address: { equals: data.address, mode: 'insensitive' },
      zipCode: cleanOptional(data.zipCode),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, address: true, address2: true, cityId: true, zipCode: true },
  })
  const key = addressKey(data)
  return candidates.find((candidate) => addressKey(candidate) === key) ?? null
}

function revalidateAddressPaths(companySlug: string) {
  revalidatePath(`/${companySlug}/addresses`)
  revalidatePath(`/${companySlug}/cities`)
  revalidatePath(`/${companySlug}/communities`)
}

export async function createAddress(companySlug: string, data: AddressInput) {
  const auth = await authorize(companySlug)
  if ('error' in auth) return { error: auth.error }
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cityResult = await findOrCreateCity(tx, auth.user.companyId!, parsed.data.city, parsed.data.state)
      const communityId = await validateCommunity(tx, auth.user.companyId!, cityResult.city.id, parsed.data.communityId)
      const addressData = {
        address: parsed.data.address,
        address2: cleanOptional(parsed.data.address2),
        cityId: cityResult.city.id,
        zipCode: cleanOptional(parsed.data.zipCode),
      }
      if (await findDuplicate(tx, auth.user.companyId!, addressData)) throw new Error('This address already exists')

      const address = await tx.address.create({
        data: { companyId: auth.user.companyId!, ...addressData, communityId },
      })
      return { address, cityCreated: cityResult.created }
    })

    await logAddressAction(auth.user, 'create', result.address.id, { cityCreated: result.cityCreated })
    revalidateAddressPaths(companySlug)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create address' }
  }
}

export async function updateAddress(companySlug: string, addressId: string, data: AddressInput) {
  const auth = await authorize(companySlug)
  if ('error' in auth) return { error: auth.error }
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id: addressId, companyId: auth.user.companyId! } })
      if (!existing) throw new Error('Address not found')
      const cityResult = await findOrCreateCity(tx, auth.user.companyId!, parsed.data.city, parsed.data.state)
      const communityId = await validateCommunity(tx, auth.user.companyId!, cityResult.city.id, parsed.data.communityId)
      const addressData = {
        address: parsed.data.address,
        address2: cleanOptional(parsed.data.address2),
        cityId: cityResult.city.id,
        zipCode: cleanOptional(parsed.data.zipCode),
      }
      if (await findDuplicate(tx, auth.user.companyId!, addressData, addressId)) throw new Error('This address already exists')
      await tx.address.update({ where: { id: addressId }, data: { ...addressData, communityId } })
    })

    await logAddressAction(auth.user, 'update', addressId)
    revalidateAddressPaths(companySlug)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update address' }
  }
}

export async function deleteAddress(companySlug: string, addressId: string) {
  const auth = await authorize(companySlug)
  if ('error' in auth) return { error: auth.error }
  try {
    const deleted = await prisma.address.deleteMany({ where: { id: addressId, companyId: auth.user.companyId! } })
    if (!deleted.count) return { error: 'Address not found' }
    await logAddressAction(auth.user, 'delete', addressId)
    revalidateAddressPaths(companySlug)
    return { success: true }
  } catch {
    return { error: 'Failed to delete address' }
  }
}

export async function importAddresses(companySlug: string, rows: AddressImportRow[], defaultCommunityId?: string | null) {
  const auth = await authorize(companySlug)
  if ('error' in auth) return { error: auth.error }
  if (!Array.isArray(rows) || rows.length === 0) return { error: 'The CSV file does not contain any addresses' }
  if (rows.length > 1000) return { error: 'Import up to 1,000 addresses at a time' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const communities = await tx.community.findMany({
        where: { companyId: auth.user.companyId! },
        select: { id: true, name: true, cityId: true },
      })
      if (defaultCommunityId && !communities.some((community) => community.id === defaultCommunityId)) {
        throw new Error('The selected community was not found')
      }

      const existingAddresses = await tx.address.findMany({
        where: { companyId: auth.user.companyId! },
        select: { address: true, address2: true, cityId: true, zipCode: true },
      })
      const knownKeys = new Set(existingAddresses.map(addressKey))
      const cityCache = new Map<string, { id: string; created: boolean }>()
      const errors: string[] = []
      const creates: Prisma.AddressCreateManyInput[] = []
      let skipped = 0
      let citiesCreated = 0

      for (let index = 0; index < rows.length; index += 1) {
        const parsed = importRowSchema.safeParse(rows[index])
        if (!parsed.success) {
          skipped += 1
          errors.push(`Row ${index + 2}: ${parsed.error.errors[0]?.message ?? 'Invalid address'}`)
          continue
        }

        const location = normalizeLocation(parsed.data.city, parsed.data.state)
        const cityKey = `${location.city.toLocaleLowerCase()}|${location.state.toLocaleLowerCase()}`
        let cachedCity = cityCache.get(cityKey)
        if (!cachedCity) {
          const cityResult = await findOrCreateCity(tx, auth.user.companyId!, location.city, location.state)
          cachedCity = { id: cityResult.city.id, created: cityResult.created }
          cityCache.set(cityKey, cachedCity)
          if (cityResult.created) citiesCreated += 1
        }

        let communityId: string | null = defaultCommunityId || null
        if (parsed.data.community) {
          const namedCommunity = communities.find((community) =>
            community.cityId === cachedCity!.id && community.name.toLocaleLowerCase() === parsed.data.community!.toLocaleLowerCase()
          )
          if (!namedCommunity) {
            skipped += 1
            errors.push(`Row ${index + 2}: Community "${parsed.data.community}" was not found in ${location.city}, ${location.state}`)
            continue
          }
          communityId = namedCommunity.id
        }
        if (communityId) {
          const selectedCommunity = communities.find((community) => community.id === communityId)
          if (selectedCommunity?.cityId !== cachedCity.id) {
            skipped += 1
            errors.push(`Row ${index + 2}: The selected community is not in ${location.city}, ${location.state}`)
            continue
          }
        }

        const addressData = {
          address: formatStreetAddress(parsed.data.address),
          address2: parsed.data.address2 ? formatStreetAddress(parsed.data.address2) : null,
          cityId: cachedCity.id,
          zipCode: cleanOptional(parsed.data.zipCode),
        }
        const key = addressKey(addressData)
        if (knownKeys.has(key)) {
          skipped += 1
          errors.push(`Row ${index + 2}: Address already exists`)
          continue
        }
        knownKeys.add(key)
        creates.push({ companyId: auth.user.companyId!, ...addressData, communityId })
      }

      if (creates.length) await tx.address.createMany({ data: creates })
      return { imported: creates.length, skipped, citiesCreated, errors: errors.slice(0, 25) }
    }, { timeout: 30000 })

    await logAddressAction(auth.user, 'import', null, result)
    revalidateAddressPaths(companySlug)
    return { success: true, ...result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to import addresses' }
  }
}

async function logAddressAction(user: SessionUser, action: string, entityId?: string | null, metadata?: unknown) {
  await createAuditLog({
    companyId: user.companyId,
    actorId: user.id,
    actorType: 'employee',
    actorName: user.name,
    action,
    entityType: 'address',
    entityId,
    metadata,
  })
}
