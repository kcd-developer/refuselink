export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { generatePresignedUploadUrl } from '@/lib/supabase'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: Request) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { fileName, contentType, isPublic } = body ?? {}

  if (!fileName || !contentType) {
    return NextResponse.json({ error: 'Missing fileName or contentType' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const result = await generatePresignedUploadUrl(fileName, contentType, isPublic ?? false)
  return NextResponse.json(result)
}
