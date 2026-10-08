import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function assertServerStorageCredentials() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase Storage server credentials are not configured.')
  }

  if (supabaseServiceKey.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Configure a secret/service-role key for server-side Storage operations.')
  }
}

// Server-side client with service role key (full access)
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Storage bucket name
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents'

export async function generatePrivateUploadUrl(cloud_storage_path: string) {
  assertServerStorageCredentials()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(cloud_storage_path)

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`)
  }

  return { uploadUrl: data.signedUrl, token: data.token }
}

export async function getStoredFileMetadata(cloud_storage_path: string) {
  assertServerStorageCredentials()
  const parts = cloud_storage_path.split('/')
  const fileName = parts.pop()
  const folder = parts.join('/')
  if (!fileName) return null

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 10, search: fileName })

  if (error) throw new Error(`Failed to verify upload: ${error.message}`)
  return data.find((item) => item.name === fileName) ?? null
}

function shouldServeInline(contentType: string): boolean {
  return (
    (contentType.startsWith('image/') && contentType !== 'image/svg+xml') ||
    contentType.startsWith('video/') ||
    contentType.startsWith('audio/')
  )
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
) {
  assertServerStorageCredentials()
  const prefix = isPublic ? 'public/uploads' : 'uploads'
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`

  // Generate a signed URL for uploading
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(cloud_storage_path)

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`)
  }

  return {
    uploadUrl: data.signedUrl,
    cloud_storage_path,
    token: data.token,
  }
}

export async function getFileUrl(
  cloud_storage_path: string,
  _contentType: string,
  isPublic: boolean
) {
  assertServerStorageCredentials()
  if (isPublic) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(cloud_storage_path)
    return data.publicUrl
  }

  // Generate a signed URL for downloading (1 hour)
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(cloud_storage_path, 3600)

  if (error || !data) {
    throw new Error(`Failed to create download URL: ${error?.message}`)
  }

  return data.signedUrl
}

export async function deleteFile(cloud_storage_path: string) {
  assertServerStorageCredentials()
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([cloud_storage_path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}
