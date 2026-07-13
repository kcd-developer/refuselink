// Supabase Storage adapter — drop-in replacement for the original AWS S3 module.
// This file re-exports from supabase.ts to keep the existing import paths working.

export { generatePresignedUploadUrl, getFileUrl, deleteFile } from './supabase'
