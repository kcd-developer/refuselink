import { prisma } from '@/lib/db'
import { address2Compatible, normalizeAddressText } from '@/lib/address-claim'

interface CustomerAddress {
  id: string
  address?: string | null
  address2?: string | null
  cityId?: string | null
}

export async function getCustomerAddressServices(companyId: string, customers: CustomerAddress[]) {
  if (!customers.length) return []
  const cityIds = [...new Set(customers.map((customer) => customer.cityId).filter(Boolean))] as string[]

  const addresses = await prisma.address.findMany({
    where: { companyId, cityId: { in: cityIds }, services: { some: {} } },
    select: {
      id: true,
      address: true,
      address2: true,
      cityId: true,
      services: { select: { service: true, containerSize: true, dayOfWeek: true, weekCycle: true }, orderBy: { service: 'asc' } },
    },
  })

  return customers.flatMap((customer) => {
    const match = addresses.find((address) =>
      address.cityId === customer.cityId &&
      normalizeAddressText(address.address) === normalizeAddressText(customer.address) &&
      address2Compatible(address.address2, customer.address2),
    )
    if (!match) return []
    return [{ customerId: customer.id, address: match.address, address2: match.address2, services: match.services }]
  })
}
