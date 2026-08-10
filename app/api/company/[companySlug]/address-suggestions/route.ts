export const dynamic = 'force-dynamic'

import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { extractHouseNumber, normalizeAddressText, rankAddressCandidates } from '@/lib/address-claim'
import { prisma } from '@/lib/db'

const MIN_ADDRESS_QUERY_LENGTH = 1
const MAX_CANDIDATES = 75
const MAX_SUGGESTIONS = 8

function clean(value: string | null) {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : ''
}

function formatSuggestionLabel(candidate: {
  address: string
  address2?: string | null
  zipCode?: string | null
  city: { name: string; state: string }
}) {
  return [
    candidate.address,
    candidate.address2,
    `${candidate.city.name}, ${candidate.city.state}`,
    candidate.zipCode,
  ]
    .filter(Boolean)
    .join(', ')
}

export async function GET(req: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const url = new URL(req.url)
  const address = clean(url.searchParams.get('address'))
  const city = clean(url.searchParams.get('city'))
  const state = clean(url.searchParams.get('state')).toUpperCase()
  const zipCode = clean(url.searchParams.get('zipCode'))
  const normalizedAddress = normalizeAddressText(address)
  const houseNumber = extractHouseNumber(address)

  if (normalizedAddress.length < MIN_ADDRESS_QUERY_LENGTH || !houseNumber) {
    return NextResponse.json({ suggestions: [] })
  }

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, status: true },
  })

  if (!company || company.status === 'suspended' || company.status === 'cancelled') {
    return NextResponse.json({ suggestions: [] })
  }

  const where: Prisma.AddressWhereInput = {
    companyId: company.id,
    claimedAt: null,
    address: { startsWith: houseNumber, mode: 'insensitive' },
  }

  if (state.length === 2) {
    where.city = { state: { equals: state, mode: 'insensitive' } }
  }

  const candidates = await prisma.address.findMany({
    where,
    include: { city: true, community: true },
    orderBy: [{ address: 'asc' }],
    take: MAX_CANDIDATES,
  })

  const rankedCandidates = rankAddressCandidates(
    { address, city, state, zipCode },
    candidates,
    city || state || zipCode ? 0.35 : 0.2,
  )

  return NextResponse.json({
    suggestions: rankedCandidates.slice(0, MAX_SUGGESTIONS).map(({ candidate }) => ({
      id: candidate.id,
      address: candidate.address,
      address2: candidate.address2,
      city: candidate.city.name,
      state: candidate.city.state,
      zipCode: candidate.zipCode,
      community: candidate.community?.name ?? null,
      label: formatSuggestionLabel(candidate),
    })),
  })
}
