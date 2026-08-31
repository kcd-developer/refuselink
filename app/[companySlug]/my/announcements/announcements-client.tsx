'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, Building2, Info, Megaphone, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  createCommunityAnnouncement,
  deleteCommunityAnnouncement,
  updateCommunityAnnouncement,
} from '@/lib/actions/community-announcements'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface FeedAnnouncement {
  id: string
  sourceType: 'company' | 'community'
  sourceKey: string
  sourceLabel: string
  communityId: string | null
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  startDate: string
  endDate: string | null
  createdAt: string
  authorName: string | null
  isPublished?: boolean
  canManage: boolean
}

interface CommunityOption { id: string; name: string }

const priorityConfig = {
  low: { color: 'bg-slate-50 text-slate-600', icon: Info },
  normal: { color: 'bg-blue-50 text-blue-600', icon: Info },
  high: { color: 'bg-orange-50 text-orange-600', icon: AlertTriangle },
  urgent: { color: 'bg-red-50 text-red-600', icon: AlertCircle },
}

function dateInputValue(value?: string | null) {
  return value ? new Date(value).toISOString().split('T')[0] : ''
}

export function CustomerAnnouncementsClient({
  companySlug,
  companyName,
  announcements,
  creationCommunities,
  canCreate,
}: {
  companySlug: string
  companyName: string
  announcements: FeedAnnouncement[]
  creationCommunities: CommunityOption[]
  canCreate: boolean
}) {
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FeedAnnouncement | null>(null)
  const [communityId, setCommunityId] = useState(creationCommunities[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [startDate, setStartDate] = useState(dateInputValue(new Date().toISOString()))
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)

  const visibleAnnouncements = filter === 'all'
    ? announcements
    : announcements.filter((announcement) => announcement.sourceType === filter)

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setCommunityId(creationCommunities[0]?.id ?? '')
    setTitle('')
    setContent('')
    setPriority('normal')
    setStartDate(dateInputValue(new Date().toISOString()))
    setEndDate('')
    setError('')
  }

  const startEditing = (announcement: FeedAnnouncement) => {
    setEditing(announcement)
    setCommunityId(announcement.communityId ?? '')
    setTitle(announcement.title)
    setContent(announcement.content)
    setPriority(announcement.priority)
    setStartDate(dateInputValue(announcement.startDate))
    setEndDate(dateInputValue(announcement.endDate))
    setError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveAnnouncement = async (intent: 'draft' | 'publish') => {
    setLoading(true)
    setError('')
    const payload = { communityId, title, content, priority, startDate, endDate, intent }
    const result = editing
      ? await updateCommunityAnnouncement(companySlug, editing.id, payload)
      : await createCommunityAnnouncement(companySlug, payload)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await saveAnnouncement('publish')
  }

  const handleDelete = async (announcement: FeedAnnouncement) => {
    if (!window.confirm(`Delete “${announcement.title}”?`)) return
    const result = await deleteCommunityAnnouncement(companySlug, announcement.id)
    if (result.error) { window.alert(result.error); return }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">Updates from {companyName} and your community</p>
        </div>
        {canCreate && (
          <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            <Plus className="h-4 w-4" /> New Community Announcement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="font-semibold text-slate-900">{editing ? 'Edit Community Announcement' : 'New Community Announcement'}</h2><p className="text-sm text-slate-500">{creationCommunities.length === 1 ? `This will be visible to residents of ${creationCommunities[0].name}.` : 'This will be visible to residents of the selected community.'}</p></div>
            <button type="button" onClick={() => setShowDiscardWarning(true)} aria-label="Close announcement form" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            {creationCommunities.length > 1 && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Community</label>
                <select value={communityId} onChange={(event) => setCommunityId(event.target.value)} disabled={Boolean(editing)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50">
                  {creationCommunities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-slate-500">Title</label><input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-slate-500">Message</label><textarea maxLength={5000} rows={5} value={content} onChange={(event) => setContent(event.target.value)} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-500">Priority</label><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs font-medium text-slate-500">Start Date</label><input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">End Date</label><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div></div>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>{(!editing || editing.isPublished === false) && <button type="button" onClick={() => void saveAnnouncement('draft')} disabled={loading || !communityId || !title.trim()} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">{loading ? 'Saving...' : 'Save Draft'}</button>}<button type="submit" disabled={loading || !communityId || !title.trim() || !content.trim()} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Publishing...' : editing?.isPublished === false ? 'Publish Announcement' : editing ? 'Save Changes' : 'Publish Announcement'}</button></div>
        </form>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'community', label: 'Community' },
          { key: 'company', label: companyName },
        ].map((source) => {
          const active = filter === source.key
          return (
            <button
              key={source.key}
              onClick={() => setFilter(source.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${active ? 'text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.8)]' : 'text-slate-600 hover:-translate-y-px hover:bg-slate-100 hover:text-slate-900'}`}
              style={active ? { background: 'linear-gradient(135deg, var(--company-primary), #2563EB)' } : undefined}
            >
              {source.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        {visibleAnnouncements.map((announcement) => {
          const config = priorityConfig[announcement.priority]
          const PriorityIcon = config.icon
          return (
            <article key={`${announcement.sourceType}:${announcement.id}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${announcement.sourceType === 'company' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>{announcement.sourceType === 'company' ? <Megaphone className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}</div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${announcement.sourceType === 'company' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{announcement.sourceLabel}</span>{announcement.isPublished === false && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Draft</span>}<span className="text-xs text-slate-400">{new Date(announcement.createdAt).toLocaleDateString('en-US')}</span></div>
                    <h2 className="font-semibold text-slate-900">{announcement.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}><PriorityIcon className="h-3 w-3" />{announcement.priority}</span>{announcement.authorName && <span className="text-xs text-slate-400">Posted by {announcement.authorName}</span>}</div>
                  </div>
                </div>
                {announcement.canManage && (
                  <div className="flex shrink-0 gap-1"><button onClick={() => startEditing(announcement)} title="Edit announcement" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button><button onClick={() => handleDelete(announcement)} title="Delete announcement" className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>
                )}
              </div>
            </article>
          )
        })}
        {!visibleAnnouncements.length && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm"><Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="text-sm text-slate-500">No announcements from this source</p></div>}
      </div>

      <AlertDialog open={showDiscardWarning} onOpenChange={setShowDiscardWarning}>
        <AlertDialogContent className="max-w-md overflow-hidden border-slate-200 p-0 shadow-2xl">
          <div className="p-6 pb-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-xl text-slate-900">
                {editing ? 'Discard your changes?' : 'Discard this announcement?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="leading-6 text-slate-600">
                {editing
                  ? 'Your unpublished changes will be lost. The existing announcement will remain unchanged.'
                  : 'The announcement has not been published. Anything entered in this form will be lost.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <AlertDialogCancel className="bg-white">Continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={resetForm} className="bg-red-600 hover:bg-red-700">
              Discard {editing ? 'changes' : 'draft'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
