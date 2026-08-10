'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser, type SessionUser } from '@/lib/session'
import { formatStreetAddress, formatTitleCase } from '@/lib/text-format'

const allowedRoles = ['company_owner', 'company_admin', 'company_manager']

const serviceAssignmentSchema = z.object({
  service: z.enum(['trash', 'recycling', 'yard_waste']),
  route: z.string().trim().max(100).optional().nullable(),
  containerSize: z.string().trim().max(30).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
})

const coordinateSchema = (
  minimum: number,
  maximum: number,
  label: string,
  allowedDirections: [string, string],
) => z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) return null
  if (typeof value === 'number') return value

  const match = String(value).trim().toUpperCase().match(/^([+-]?\d+(?:\.\d+)?)\s*°?\s*([NSEW])?$/)
  if (!match || (match[2] && !allowedDirections.includes(match[2]))) return Number.NaN
  const magnitude = Number(match[1])
  if (!match[2]) return magnitude
  return allowedDirections.indexOf(match[2]) === 0 ? Math.abs(magnitude) : -Math.abs(magnitude)
}, z.number({ invalid_type_error: `Enter a valid ${label.toLocaleLowerCase()}` })
  .min(minimum, `${label} is out of range`)
  .max(maximum, `${label} is out of range`)
  .nullable())

const addressSchema = z.object({
  address: z.string().trim().min(1, 'Street address is required').max(300),
  address2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(50),
  zipCode: z.string().trim().max(20).optional().nullable(),
  latitude: coordinateSchema(-90, 90, 'Latitude', ['N', 'S']).optional(),
  longitude: coordinateSchema(-180, 180, 'Longitude', ['E', 'W']).optional(),
  latitudeDirection: z.string().trim().toUpperCase().refine((value) => value === 'N' || value === 'S', 'Latitude direction must be N or S').optional().or(z.literal('')),
  longitudeDirection: z.string().trim().toUpperCase().refine((value) => value === 'E' || value === 'W', 'Longitude direction must be E or W').optional().or(z.literal('')),
  communityId: z.string().trim().optional().nullable(),
  services: z.array(serviceAssignmentSchema).max(3).default([]),
})

const importRowSchema = addressSchema.omit({ communityId: true, services: true }).extend({
  community: z.string().trim().max(100).optional().nullable(),
  trash: z.string().trim().optional(),
  trashRoute: z.string().trim().max(100).optional(),
  trashDay: z.string().trim().optional(),
  trashContainerSize: z.string().trim().max(30).optional(),
  recycle: z.string().trim().optional(),
  recycleRoute: z.string().trim().max(100).optional(),
  recycleDay: z.string().trim().optional(),
  recycleContainerSize: z.string().trim().max(30).optional(),
  yardWaste: z.string().trim().optional(),
  yardWasteRoute: z.string().trim().max(100).optional(),
  yardWasteDay: z.string().trim().optional(),
  yardWasteContainerSize: z.string().trim().max(30).optional(),
})

export type AddressInput = z.infer<typeof addressSchema>
export type AddressImportRow = z.infer<typeof importRowSchema>

function coordinateWithDirection(value: unknown, direction: unknown) {
  const coordinate = String(value ?? '').trim()
  const compassDirection = String(direction ?? '').trim().toUpperCase()
  return compassDirection ? `${coordinate} ${compassDirection}` : value
}

function parseAddressInput(data: AddressInput) {
  return addressSchema.safeParse({
    ...data,
    latitude: coordinateWithDirection(data.latitude, data.latitudeDirection),
    longitude: coordinateWithDirection(data.longitude, data.longitudeDirection),
  })
}

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

function normalizeContainerSize(value?: string | null) {
  const cleaned = cleanOptional(value)
  if (!cleaned) return null
  const match = cleaned.toLocaleLowerCase().match(/^(\d+(?:\.\d+)?)\s*(?:g|gal|gallon|gallons)?$/)
  return match ? `${match[1]}g` : cleaned
}

function normalizeRoute(value: string | null | undefined, uppercase: boolean) {
  const route = cleanOptional(value)
  return route && uppercase ? route.toLocaleUpperCase() : route
}

function normalizeLocation(city: string, state: string) {
  return { city: formatTitleCase(city), state: state.trim().toUpperCase() }
}

function addressKey(data: { address: string; address2?: string | null; cityId: string; zipCode?: string | null }) {
  return [data.address, data.address2 ?? '', data.cityId, data.zipCode ?? '']
    .map((value) => value.trim().toLocaleLowerCase())
    .join('|')
}

function importIdentityKey(data: { address: string; address2?: string | null; cityId: string }) {
  return [data.address, data.address2 ?? '', data.cityId]
    .map((value) => value.trim().toLocaleLowerCase())
    .join('|')
}

const dayLookup: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
}

function parseDay(value?: string) {
  if (!value?.trim()) return null
  const normalized = value.trim().toLocaleLowerCase()
  if (/^[0-6]$/.test(normalized)) return Number(normalized)
  return dayLookup[normalized] ?? null
}

function isEnabled(value?: string) {
  return ['1', 'true', 'yes', 'y', 'x'].includes(value?.trim().toLocaleLowerCase() ?? '')
}

function servicesFromImport(row: AddressImportRow, uppercaseRoutes = false) {
  const definitions = [
    { service: 'trash' as const, enabled: row.trash, route: row.trashRoute, day: row.trashDay, containerSize: row.trashContainerSize },
    { service: 'recycling' as const, enabled: row.recycle, route: row.recycleRoute, day: row.recycleDay, containerSize: row.recycleContainerSize },
    { service: 'yard_waste' as const, enabled: row.yardWaste, route: row.yardWasteRoute, day: row.yardWasteDay, containerSize: row.yardWasteContainerSize },
  ]
  const mentioned = definitions.filter((item) => item.enabled !== undefined || item.route !== undefined || item.day !== undefined || item.containerSize !== undefined)
  if (!mentioned.length) return null

  return mentioned.map((item) => {
    const enabled = isEnabled(item.enabled) || Boolean(item.route?.trim()) || Boolean(item.day?.trim()) || Boolean(item.containerSize?.trim())
    if (!enabled) return { service: item.service, assignment: null }
    const dayOfWeek = parseDay(item.day)
    if (dayOfWeek === null) throw new Error(`${item.service.replace('_', ' ')} requires a valid service day`)
    return { service: item.service, assignment: { route: normalizeRoute(item.route, uppercaseRoutes), containerSize: normalizeContainerSize(item.containerSize), dayOfWeek } }
  })
}

async function replaceServices(tx: Prisma.TransactionClient, addressId: string, services: z.infer<typeof serviceAssignmentSchema>[], uppercaseRoutes = false) {
  await tx.addressService.deleteMany({ where: { addressId } })
  if (services.length) {
    await tx.addressService.createMany({
      data: services.map((service) => ({ addressId, service: service.service, route: normalizeRoute(service.route, uppercaseRoutes), containerSize: normalizeContainerSize(service.containerSize), dayOfWeek: service.dayOfWeek })),
    })
  }
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
  const parsed = parseAddressInput(data)
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
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      }
      if (await findDuplicate(tx, auth.user.companyId!, addressData)) throw new Error('This address already exists')

      const address = await tx.address.create({
        data: { companyId: auth.user.companyId!, ...addressData, communityId },
      })
      await replaceServices(tx, address.id, parsed.data.services, companySlug === 'kc-disposal')
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
  const parsed = parseAddressInput(data)
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
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      }
      if (await findDuplicate(tx, auth.user.companyId!, addressData, addressId)) throw new Error('This address already exists')
      await tx.address.update({ where: { id: addressId }, data: { ...addressData, communityId } })
      await replaceServices(tx, addressId, parsed.data.services, companySlug === 'kc-disposal')
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
        select: { id: true, address: true, address2: true, cityId: true, zipCode: true },
      })
      const existingByKey = new Map(existingAddresses.map((address) => [importIdentityKey(address), address]))
      const cityCache = new Map<string, { id: string; created: boolean }>()
      const errors: string[] = []
      let imported = 0
      let updated = 0
      let skipped = 0
      let citiesCreated = 0
      const serviceUpdates = new Map<string, NonNullable<ReturnType<typeof servicesFromImport>>>()

      for (let index = 0; index < rows.length; index += 1) {
        const parsed = importRowSchema.safeParse({
          ...rows[index],
          latitude: coordinateWithDirection(rows[index].latitude, rows[index].latitudeDirection),
          longitude: coordinateWithDirection(rows[index].longitude, rows[index].longitudeDirection),
        })
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
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
        }
        const key = importIdentityKey(addressData)
        let services: ReturnType<typeof servicesFromImport>
        try {
          services = servicesFromImport(parsed.data, companySlug === 'kc-disposal')
        } catch (error) {
          skipped += 1
          errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid service assignment'}`)
          continue
        }

        const existing = existingByKey.get(key)
        if (existing) {
          await tx.address.update({
            where: { id: existing.id },
            data: {
              address: addressData.address,
              address2: addressData.address2,
              cityId: addressData.cityId,
              ...(parsed.data.zipCode !== undefined ? { zipCode: addressData.zipCode } : {}),
              ...(rows[index].latitude !== undefined ? { latitude: addressData.latitude } : {}),
              ...(rows[index].longitude !== undefined ? { longitude: addressData.longitude } : {}),
              ...(defaultCommunityId || parsed.data.community !== undefined ? { communityId } : {}),
            },
          })
          if (services) serviceUpdates.set(existing.id, services)
          updated += 1
          continue
        }

        const created = await tx.address.create({ data: { companyId: auth.user.companyId!, ...addressData, communityId } })
        existingByKey.set(key, created)
        if (services) serviceUpdates.set(created.id, services)
        imported += 1
      }

      if (serviceUpdates.size) {
        await tx.addressService.deleteMany({
          where: {
            OR: [...serviceUpdates].map(([addressId, services]) => ({
              addressId,
              service: { in: services.map((item) => item.service) },
            })),
          },
        })
        const assignments = [...serviceUpdates].flatMap(([addressId, services]) =>
          services.flatMap((item) => item.assignment ? [{ addressId, service: item.service, ...item.assignment }] : []),
        )
        if (assignments.length) await tx.addressService.createMany({ data: assignments, skipDuplicates: true })
      }

      return { imported, updated, skipped, citiesCreated, errors: errors.slice(0, 25) }
    }, { maxWait: 10000, timeout: 120000 })

    await logAddressAction(auth.user, 'import', null, result)
    revalidateAddressPaths(companySlug)
    return { success: true, ...result }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
      return { error: 'The import took too long and no changes were saved. Please try the import again.' }
    }
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
