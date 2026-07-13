'use client'

import { useState } from 'react'
import { Building, Plus, Pencil, Trash2, X } from 'lucide-react'
import { createCommunity, updateCommunity, deleteCommunity } from '@/lib/actions/communities'

interface Community { id: string; name: string; cityId: string; city: { name: string; state: string }; _count: { customers: number } }
interface City { id: string; name: string; state: string }

export function CommunitiesClient({ communities, companySlug, cities }: { communities: Community[]; companySlug: string; cities: City[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Community | null>(null)
  const [name, setName] = useState('')
  const [cityId, setCityId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => { setShowForm(false); setEditing(null); setName(''); setCityId(''); setError('') }
  const startEdit = (c: Community) => { setEditing(c); setName(c.name); setCityId(c.cityId); setShowForm(true); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = editing
      ? await updateCommunity(companySlug, editing.id, { name, cityId })
      : await createCommunity(companySlug, { name, cityId })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this community?')) return
    const result = await deleteCommunity(companySlug, id)
    if (result.error) alert(result.error)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Communities</h1>
          <p className="text-sm text-slate-500 mt-1">HOAs, subdivisions, and managed associations</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4" /> Add Community
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Community' : 'Add Community'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Community name" required className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <select value={cityId} onChange={e => setCityId(e.target.value)} required className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Select city...</option>
              {cities.map((c: City) => <option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}
            </select>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((c: Community) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center"><Building className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.city?.name}, {c.city?.state}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(c)} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-md"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">{c._count.customers} customers</div>
          </div>
        ))}
        {communities.length === 0 && <p className="text-slate-400 text-sm col-span-full py-12 text-center">No communities added yet</p>}
      </div>
    </div>
  )
}
