'use client'

import { useState, useRef } from 'react'
import { FileText, Plus, X, Pencil, Trash2, Upload, Download } from 'lucide-react'
import { createDocument, updateDocument, deleteDocument } from '@/lib/actions/documents'

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function DocumentsClient({ documents, companySlug, cities, communities }: { documents: any[]; companySlug: string; cities: any[]; communities: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [targetAll, setTargetAll] = useState(true)
  const [targetTypes, setTargetTypes] = useState<string[]>([])
  const [targetCityIds, setTargetCityIds] = useState<string[]>([])
  const [targetCommunityIds, setTargetCommunityIds] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setShowForm(false); setEditing(null); setTitle(''); setDescription(''); setIsPublished(true)
    setTargetAll(true); setTargetTypes([]); setTargetCityIds([]); setTargetCommunityIds([])
    setFile(null); setError('')
  }

  const startEdit = (d: any) => {
    setEditing(d); setTitle(d.title); setDescription(d.description || ''); setIsPublished(d.isPublished)
    setTargetAll(d.targetAll); setTargetTypes(d.targetTypes || []); setTargetCityIds(d.targetCityIds || [])
    setTargetCommunityIds(d.targetCommunityIds || []); setFile(null); setShowForm(true); setError('')
  }

  const toggleArray = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) { setError('Only PDF and image files are allowed'); return }
    if (f.size > MAX_SIZE) { setError('File size must be under 10MB'); return }
    setFile(f); setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    if (editing) {
      // Update metadata only
      const result = await updateDocument(companySlug, editing.id, {
        title, description, isPublished, targetAll, targetTypes, targetCityIds, targetCommunityIds,
      })
      setLoading(false)
      if (result.error) { setError(result.error); return }
      resetForm(); return
    }

    // Create with file upload
    if (!file) { setError('Please select a file'); setLoading(false); return }
    try {
      // Upload via presigned URL
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      })
      if (!presignRes.ok) { setError('Upload failed - could not get upload URL'); setLoading(false); return }
      const { url, fileUrl, headers: uploadHeaders } = await presignRes.json()

      // Upload file
      const uploadRes = await fetch(url, { method: 'PUT', body: file, headers: uploadHeaders || {} })
      if (!uploadRes.ok) { setError('File upload failed'); setLoading(false); return }

      // Create document record
      const result = await createDocument(companySlug, {
        title, description, fileName: file.name, fileUrl, fileSize: file.size, mimeType: file.type,
        isPublished, targetAll, targetTypes, targetCityIds, targetCommunityIds,
      })
      setLoading(false)
      if (result.error) { setError(result.error); return }
      resetForm()
    } catch {
      setLoading(false); setError('Upload failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    const result = await deleteDocument(companySlug, id)
    if (result.error) alert(result.error)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage shared documents</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4" /> Upload Document
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Document' : 'Upload Document'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            {!editing && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">File * (PDF, JPG, PNG, WEBP, GIF — max 10MB)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                    <Upload className="h-4 w-4" /> Choose File
                  </button>
                  <span className="text-sm text-slate-500">{file ? file.name : 'No file selected'}</span>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif" onChange={handleFileChange} className="hidden" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="rounded border-slate-300" />
                <span className="text-sm text-slate-700">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={targetAll} onChange={e => setTargetAll(e.target.checked)} className="rounded border-slate-300" />
                <span className="text-sm text-slate-700">All customers</span>
              </label>
            </div>
            {!targetAll && (
              <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Customer Types</label>
                  <div className="flex gap-3">
                    {['residential', 'commercial', 'roll_off'].map(t => (
                      <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={targetTypes.includes(t)} onChange={() => toggleArray(targetTypes, setTargetTypes, t)} className="rounded border-slate-300" />
                        <span className="text-sm text-slate-700 capitalize">{t.replace('_', '-')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Update' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Document</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Size</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {documents.map((d: any) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{d.title}</p>
                      {d.description && <p className="text-xs text-slate-400">{d.description}</p>}
                      <p className="text-xs text-slate-400">{d.fileName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{formatFileSize(d.fileSize)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.isPublished ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {d.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {!d.targetAll && <span className="ml-1 text-xs text-slate-400">Targeted</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(d)} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-red-50 rounded-md"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">No documents uploaded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
