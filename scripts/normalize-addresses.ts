import { loadEnvConfig } from '@next/env'
import { formatStreetAddress, formatTitleCase } from '../lib/text-format'

loadEnvConfig(process.cwd())

const companySlug = process.argv.find((argument) => !argument.startsWith('--') && argument !== process.argv[0] && argument !== process.argv[1])
const applyChanges = process.argv.includes('--apply')
let prisma: (typeof import('../lib/db'))['prisma'] | undefined

async function main() {
  if (!companySlug) {
    throw new Error('Usage: npx tsx scripts/normalize-addresses.ts <company-slug> [--apply]')
  }

  const db = (await import('../lib/db')).prisma
  prisma = db
  const company = await db.company.findUnique({ where: { slug: companySlug }, select: { id: true, name: true } })
  if (!company) throw new Error(`Company not found: ${companySlug}`)

  const [addresses, customers, cities] = await Promise.all([
    db.address.findMany({ where: { companyId: company.id }, select: { id: true, address: true, address2: true } }),
    db.customer.findMany({ where: { companyId: company.id }, select: { id: true, address: true, address2: true, city: true } }),
    db.city.findMany({ where: { companyId: company.id }, select: { id: true, name: true } }),
  ])

  const addressUpdates = addresses
    .map((record) => ({ ...record, formattedAddress: formatStreetAddress(record.address), formattedAddress2: record.address2 ? formatStreetAddress(record.address2) : null }))
    .filter((record) => record.address !== record.formattedAddress || record.address2 !== record.formattedAddress2)
  const customerUpdates = customers
    .map((record) => ({
      ...record,
      formattedAddress: record.address ? formatStreetAddress(record.address) : null,
      formattedAddress2: record.address2 ? formatStreetAddress(record.address2) : null,
      formattedCity: record.city ? formatTitleCase(record.city) : null,
    }))
    .filter((record) => record.address !== record.formattedAddress || record.address2 !== record.formattedAddress2 || record.city !== record.formattedCity)
  const cityUpdates = cities
    .map((record) => ({ ...record, formattedName: formatTitleCase(record.name) }))
    .filter((record) => record.name !== record.formattedName)

  console.log(`${company.name}: ${addressUpdates.length} address, ${customerUpdates.length} customer, and ${cityUpdates.length} city records need formatting.`)

  if (!applyChanges) {
    console.log('Dry run only. Add --apply to update the database.')
    return
  }

  await db.$transaction([
    ...addressUpdates.map((record) => db.address.update({ where: { id: record.id }, data: { address: record.formattedAddress, address2: record.formattedAddress2 } })),
    ...customerUpdates.map((record) => db.customer.update({ where: { id: record.id }, data: { address: record.formattedAddress, address2: record.formattedAddress2, city: record.formattedCity } })),
    ...cityUpdates.map((record) => db.city.update({ where: { id: record.id }, data: { name: record.formattedName } })),
  ])

  console.log('Address formatting updates applied.')

}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => prisma?.$disconnect())
