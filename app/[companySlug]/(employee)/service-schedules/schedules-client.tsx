'use client'

import { useState } from 'react'
import { Calendar, Plus, X, Pencil, AlertTriangle } from 'lucide-react'
import { createSchedule, updateSchedule, addScheduleException } from '@/lib/actions/schedules'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const typeLabels: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', roll_off: 'Roll-Off' }

interface FormState {
  name: string; description: string; type: string; frequency: string;
  daysOfWeek: number[]; cityId: string; communityId: string; isActive: boolean;
}
const emptyForm: FormState = { name: '', description: '', type: 'residential', frequency: 'weekly', daysOfWeek: [], cityId: '', communityId: '', isActive: true }

export function SchedulesClient({ schedules, companySlug, cities, communities }: { schedules: any[]; companySlug: string; cities: any[]; communities: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showException, setShowException] = useState<string | null>(null)
  const [excDate, setExcDate] = useState('')
  const [excReason, setExcReason] = useState('')
  const [excAlt, setExcAlt] = useState('')

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setError('') }
  const startEdit = (s: any) => {
    setEditing(s)
    setForm({
      name: s.name, description: s.description || '', type: s.type, frequency: s.frequency,
      daysOfWeek: s.daysOfWeek || [], cityId: s.cityId || '', communityId: s.communityId || '', isActive: s.isActive,
    })
    setShowForm(true); setError('')
  }
  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))
  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) ? prev.daysOfWeek.filter(d => d !== day) : [...prev.daysOfWeek, day].sort()
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = editing
      ? await updateSchedule(companySlug, editing.id, form)
      : await createSchedule(companySlug, form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const handleAddException = async (scheduleId: string) => {
    if (!excDate) return
    const result = await addScheduleException(companySlug, scheduleId, {
      date: excDate, reason: excReason || undefined, alternateDate: excAlt || undefined,
    })
    if (result.error) { alert(result.error); return }
    setShowException(null); setExcDate(''); setExcReason(''); setExcAlt('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Service Schedules</h1>
          <p className="text-sm text-slate-500 mt-1">Manage pickup schedules and holiday exceptions</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4" /> New Schedule
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Schedule' : 'New Schedule'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                <input value={form.name} onChange={e => updateField('name', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input value={form.description} onChange={e => updateField('description', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                <select value={form.type} onChange={e => updateField('type', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="roll_off">Roll-Off</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Frequency</label>
                <select value={form.frequency} onChange={e => updateField('frequency', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">City (optional)</label>
                <select value={form.cityId} onChange={e => updateField('cityId', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="">Company-wide</option>
                  {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Days of Week *</label>
              <div className="flex gap-2">
                {dayNames.map((name, i) => (
                  <button key={i} type="button" onClick={() => toggleDay(i)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.daysOfWeek.includes(i) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {name}
                  </button>
                ))}
              </div>
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
        {schedules.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  {s.description && <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{typeLabels[s.type] ?? s.type}</span>
                    <span className="text-xs text-slate-500 capitalize">{s.frequency}</span>
                    <span className="text-xs text-slate-500">{(s.daysOfWeek ?? []).map((d: number) => dayNames[d]).join(', ')}</span>
                  </div>
                  {(s.exceptions ?? []).length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-slate-500">Exceptions:</p>
                      {s.exceptions.map((ex: any) => (
                        <div key={ex.id} className="flex items-center gap-2 text-xs text-slate-500">
                          <AlertTriangle className="h-3 w-3 text-orange-400" />
                          {new Date(ex.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}{ex.reason ? ` — ${ex.reason}` : ''}
                          {ex.alternateDate && ` (alt: ${new Date(ex.alternateDate).toLocaleDateString('en-US', { timeZone: 'UTC' })})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowException(showException === s.id ? null : s.id)} className="p-1.5 hover:bg-orange-50 rounded-md" title="Add exception">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                </button>
                <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
              </div>
            </div>
            {showException === s.id && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Add Holiday/Exception</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="date" value={excDate} onChange={e => setExcDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Date" />
                  <input value={excReason} onChange={e => setExcReason(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Reason (e.g., Thanksgiving)" />
                  <input type="date" value={excAlt} onChange={e => setExcAlt(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Alternate date" />
                  <button onClick={() => handleAddException(s.id)} className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {schedules.length === 0 && <p className="text-slate-400 text-sm py-12 text-center">No schedules configured yet</p>}
      </div>
    </div>
  )
}
