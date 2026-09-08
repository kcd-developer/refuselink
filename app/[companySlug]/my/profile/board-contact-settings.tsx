'use client'

import { useState } from 'react'
import { updateBoardContactPrivacy } from '@/lib/actions/profile'

interface BoardContactPreference {
  id: string
  publicEmail: string | null
  publicPhone: string | null
  shareEmailWithCommunity: boolean
  sharePhoneWithCommunity: boolean
  community: { name: string }
}

export function BoardContactSettings({ membership, companySlug }: { membership: BoardContactPreference; companySlug: string }) {
  const [shareEmail, setShareEmail] = useState(membership.shareEmailWithCommunity)
  const [sharePhone, setSharePhone] = useState(membership.sharePhoneWithCommunity)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ error?: string; success?: boolean }>({})

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setResult({})
    try {
      setResult(await updateBoardContactPrivacy(companySlug, {
        membershipId: membership.id, shareEmailWithCommunity: shareEmail, sharePhoneWithCommunity: sharePhone,
      }))
    } catch {
      setResult({ error: 'Unable to save privacy settings. Please try again.' })
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={save} className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">Board Contact Privacy — {membership.community.name}</h2>
      <p className="mt-2 text-sm text-slate-500">Choose which contact details to share with your community. Both are private by default. Fellow board members in this community can still see your board contact details.</p>
      <fieldset disabled={saving} className="mt-4 space-y-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" checked={shareEmail} onChange={(event) => setShareEmail(event.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" />
          <span>Share my email with the community<span className="block text-xs text-slate-500">{membership.publicEmail || 'No board email on file'}</span></span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" checked={sharePhone} onChange={(event) => setSharePhone(event.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" />
          <span>Share my phone number with the community<span className="block text-xs text-slate-500">{membership.publicPhone || 'No board phone number on file'}</span></span>
        </label>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Privacy Settings'}</button>
      </fieldset>
      <p role="status" className={`mt-3 text-sm ${result.error ? 'text-red-700' : 'text-green-700'}`}>{result.error || (result.success ? 'Privacy settings saved.' : '')}</p>
    </form>
  )
}
