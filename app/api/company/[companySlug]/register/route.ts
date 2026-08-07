export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { address2Compatible, normalizeZipCode, rankAddressCandidates } from '@/lib/address-claim'
import { prisma } from '@/lib/db'

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  email: z.string().trim().email('Enter a valid email address').max(254),
  phone: z.string().trim().max(30).optional().nullable(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
  address: z.string().trim().min(1, 'Service address is required').max(300),
  address2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().length(2, 'Use a two-letter state abbreviation'),
  zipCode: z.string().trim().min(1, 'ZIP code is required').max(20),
})

function cleanOptional(value?: string | null) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function publicRegistrationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const parsed = registerSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return publicRegistrationError(parsed.error.errors[0]?.message ?? 'Please check the form and try again.')
  }

  const data = parsed.data
  if (data.password !== data.confirmPassword) {
    return publicRegistrationError('Passwords do not match.')
  }

  const company = await prisma.company.findUnique({
    where: { slug: resolvedParams.companySlug },
    select: { id: true, status: true },
  })

  if (!company || company.status === 'suspended' || company.status === 'cancelled') {
    return publicRegistrationError('Company not found.', 404)
  }

  const state = data.state.toUpperCase()
  const addressCandidates = await prisma.address.findMany({
    where: {
      companyId: company.id,
      city: {
        state: { equals: state, mode: 'insensitive' },
      },
    },
    include: { city: true, community: true },
    take: 300,
  })

  const rankedAddresses = rankAddressCandidates(
    {
      address: data.address,
      address2: data.address2,
      city: data.city,
      state,
      zipCode: data.zipCode,
    },
    addressCandidates,
    0.9,
  )

  const matchedAddress = rankedAddresses[0]?.candidate

  if (!matchedAddress) {
    return publicRegistrationError(
      'We could not match that service address. Check for typos in the street, city, state, and ZIP code or contact the office.',
      404,
    )
  }

  const existingUser = await prisma.customerUser.findUnique({ where: { email: data.email } })
  if (existingUser) {
    const existingAccess = await prisma.customerUserAccess.findFirst({
      where: {
        customerUserId: existingUser.id,
        customer: { companyId: company.id },
      },
    })

    if (existingAccess) {
      return publicRegistrationError('An account already exists for this email. Please sign in.', 409)
    }

    return publicRegistrationError('An account already exists for this email. Please contact the office for help.', 409)
  }

  const passwordHash = await bcrypt.hash(data.password, 12)

  try {
    await prisma.$transaction(async (tx) => {
      const customerCandidates = await tx.customer.findMany({
        where: {
          companyId: company.id,
          address: { equals: matchedAddress.address, mode: 'insensitive' },
          cityId: matchedAddress.cityId,
          OR: [
            { zipCode: { equals: matchedAddress.zipCode ?? data.zipCode, mode: 'insensitive' } },
            { zipCode: null },
            { zipCode: '' },
          ],
        },
        take: 10,
      })

      const existingCustomer = customerCandidates.find((candidate) =>
        address2Compatible(matchedAddress.address2, candidate.address2) &&
        (!matchedAddress.zipCode || normalizeZipCode(matchedAddress.zipCode) === normalizeZipCode(candidate.zipCode)),
      )
      const customer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              contactName: existingCustomer.contactName ?? data.fullName,
              email: existingCustomer.email ?? data.email,
              phone: existingCustomer.phone ?? cleanOptional(data.phone),
            },
          })
        : await tx.customer.create({
            data: {
              companyId: company.id,
              type: 'residential',
              name: data.fullName,
              contactName: data.fullName,
              email: data.email,
              phone: cleanOptional(data.phone),
              address: matchedAddress.address,
              address2: matchedAddress.address2,
              city: matchedAddress.city.name,
              state: matchedAddress.city.state,
              zipCode: matchedAddress.zipCode ?? data.zipCode,
              cityId: matchedAddress.cityId,
              communityId: matchedAddress.communityId,
            },
          })

      const customerUser = await tx.customerUser.create({
        data: {
          email: data.email,
          password: passwordHash,
          name: data.fullName,
          phone: cleanOptional(data.phone),
        },
      })

      await tx.customerUserAccess.create({
        data: {
          customerUserId: customerUser.id,
          customerId: customer.id,
          isPrimary: true,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return publicRegistrationError('An account already exists for this email. Please sign in.', 409)
    }

    console.error('Customer registration failed:', error)
    return publicRegistrationError('We could not create your account. Please try again.', 500)
  }
}
