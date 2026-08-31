import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { customerViewCookieName } from '@/lib/customer-view'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companySlug: string }> },
) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const viewKey = typeof body?.viewKey === 'string' ? body.viewKey : ''
  const isResident = viewKey === 'resident'
  const isCommunityView = viewKey === 'manager:all' || /^(board|manager):[A-Za-z0-9_-]+$/.test(viewKey)
  if (!isResident && !isCommunityView) {
    return NextResponse.json({ error: 'That view is not valid' }, { status: 400 })
  }

  // The destination resolves this key against live memberships before granting
  // access; this endpoint only records the requested persona.
  // View changes use a full navigation, so the cookie is sufficient and the
  // browser can load the canonical destination URL directly.
  const href = isResident ? `/${companySlug}/my` : `/${companySlug}/my/community`
  const response = NextResponse.json({ href })
  response.cookies.set(customerViewCookieName(companySlug), viewKey, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: `/${companySlug}`,
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}
