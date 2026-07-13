export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST() {
  // RefuseLink uses admin-provisioned accounts only.
  // This endpoint exists for platform compatibility but does not create accounts.
  return NextResponse.json({ message: 'Account provisioning is handled by administrators.' }, { status: 200 })
}
