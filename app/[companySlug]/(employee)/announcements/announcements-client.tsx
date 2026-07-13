'use client'

import { useState } from 'react'
import { Megaphone, Plus, X, Pencil, Trash2, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/lib/actions/announcements'

const priorityConfig: Record<string, { color: string; bg: string; icon: any }> = {
  low: { color: 'text-slate-600', bg: 'bg-slate-50', icon: Info },
  normal: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Bell },
  high: { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
  urgent: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
}

interface FormState {
  title: string; content: string; priority: string; startDate: string; endDate: string;
  isPublished: boolean; targetAll: boolean; targetTypes: string[]; targetCityIds: string[]; targetCommunityIds: string[];
}

const emptyForm: FormState = { title: '', content: '', priority: 'normal', startDate: new Date().toISOString().split('T')[0], endDate: '', isPublished: false, targetAll: true, targetTypes: [], targetCityIds: [], targetCommunityIds: [] }

export function AnnouncementsClient({ announcements, companySlug, cities, communities }: { announcements: any[]; companySlug: string; cities: any[]; communities: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setError('') }
  const startEdit = (a: any) => {
    setEditing(a)
    setForm({
      title: a.title, content: a.content, priority: a.priority,
      startDate: new Date(a.startDate).toISOString().split('T')[0],
      endDate: a.endDate ? new Date(a.endDate).toISOString().split('T')[0] : '',
      isPublished: a.isPublished, targetAll: a.targetAll,
      targetTypes: a.targetTypes || [], targetCityIds: a.targetCityIds || [], targetCommunityIds: a.targetCommunityIds || [],
    })
    setShowForm(true); setError('')
  }
  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleArrayItem = (field: 'targetTypes' | 'targetCityIds' | 'targetCommunityIds', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter((v: string) => v !== value)
        : [...(prev[field] as string[]), value]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = editing
      ? await updateAnnouncement(companySlug, editing.id, form)
      : await createAnnouncement(companySlug, form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    const result = await deleteAnnouncement(companySlug, id)
    if (result.error) alert(result.error)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">Publish announcements to your customers</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title *</label>
              <input value={form.title} onChange={e => updateField('title', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Content *</label>
              <textarea value={form.content} onChange={e => updateField('content', e.target.value)} required rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                <select value={form.priority} onChange={e => updateField('priority', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start Date *</label>
                <input type="date" value={form.startDate} onChange={e => updateField('startDate', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={e => updateField('endDate', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={e => updateField('isPublished', e.target.checked)} className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">Published</span>
                </label>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={form.targetAll} onChange={e => updateField('targetAll', e.target.checked)} className="rounded border-slate-300" />
                <span className="text-sm text-slate-700">Target all customers</span>
              </label>
              {!form.targetAll && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Customer Types</label>
                    <div className="flex gap-3">
                      {['residential', 'commercial', 'roll_off'].map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={form.targetTypes.includes(t)} onChange={() => toggleArrayItem('targetTypes', t)} className="rounded border-slate-300" />
                          <span className="text-sm text-slate-700 capitalize">{t.replace('_', '-')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {cities.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">Cities</label>
                      <div className="flex flex-wrap gap-2">
                        {cities.map((c: any) => (
                          <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={form.targetCityIds.includes(c.id)} onChange={() => toggleArrayItem('targetCityIds', c.id)} className="rounded border-slate-300" />
                            <span className="text-sm text-slate-700">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {communities.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">Communities</label>
                      <div className="flex flex-wrap gap-2">
                        {communities.map((c: any) => (
                          <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={form.targetCommunityIds.includes(c.id)} onChange={() => toggleArrayItem('targetCommunityIds', c.id)} className="rounded border-slate-300" />
                            <span className="text-sm text-slate-700">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((a: any) => {
          const pc = priorityConfig[a?.priority] ?? priorityConfig.normal
          const PIcon = pc.icon
          return (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg ${pc.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <PIcon className={`h-4 w-4 ${pc.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${a.isPublished ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {a.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(a.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                        {a.endDate ? ` — ${new Date(a.endDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}` : ''}
                      </span>
                      {!a.targetAll && <span className="text-xs text-slate-400">Targeted</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(a)} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-md"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                </div>
              </div>
            </div>
          )
        })}
        {announcements.length === 0 && <p className="text-slate-400 text-sm py-12 text-center">No announcements yet</p>}
      </div>
    </div>
  )
}
