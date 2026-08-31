'use client'

import { useState } from 'react'
import { Building2, CheckCircle2 } from 'lucide-react'
import { updateCommunityServiceRouting } from '@/lib/actions/community-settings'

export function CommunitySettingsClient({ companySlug, community }: { companySlug: string; community: { id: string; name: string; serviceIssueRouting: string; hasManager: boolean } }) {
  const [routing, setRouting] = useState(community.serviceIssueRouting)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const save = async () => {
    setSaving(true); setMessage('')
    const result = await updateCommunityServiceRouting(companySlug, { communityId: community.id, serviceIssueRouting: routing })
    setSaving(false)
    setMessage(result.error ?? 'Routing preference saved')
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-slate-900">Community Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Board-only settings for {community.name}</p>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Building2 className="h-5 w-5" /></div>
          <div><h2 className="font-semibold text-slate-900">Resident service issue routing</h2><p className="mt-1 text-sm text-slate-500">Choose who receives new non-billing service requests from community residents.</p></div>
        </div>
        <div className="space-y-3">
          <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${routing === 'company' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
            <input type="radio" name="routing" value="company" checked={routing === 'company'} onChange={() => setRouting('company')} className="mt-1" />
            <span><span className="block font-medium text-slate-900">Send directly to KC Disposal</span><span className="mt-1 block text-sm text-slate-500">KC Disposal receives and manages resident service requests.</span></span>
          </label>
          <label className={`flex gap-3 rounded-xl border p-4 ${community.hasManager ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${routing === 'community_manager' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
            <input type="radio" name="routing" value="community_manager" disabled={!community.hasManager} checked={routing === 'community_manager'} onChange={() => setRouting('community_manager')} className="mt-1" />
            <span><span className="block font-medium text-slate-900">Send to the Community Manager</span><span className="mt-1 block text-sm text-slate-500">{community.hasManager ? 'The manager receives requests first and can escalate them to KC Disposal.' : 'Assign an active Community Manager before selecting this option.'}</span></span>
          </label>
        </div>
        {message && <p className={`mt-4 flex items-center gap-2 text-sm ${message.includes('saved') ? 'text-green-700' : 'text-red-700'}`}><CheckCircle2 className="h-4 w-4" />{message}</p>}
        <div className="mt-5 flex justify-end"><button onClick={save} disabled={saving || routing === community.serviceIssueRouting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Setting'}</button></div>
      </section>
    </div>
  )
}
