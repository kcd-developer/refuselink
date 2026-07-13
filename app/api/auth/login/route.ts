export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST() {
  // Login is handled by NextAuth credentials provider
  return NextResponse.json({ message: 'Use the NextAuth sign-in endpoint' }, { status: 200 })
}
