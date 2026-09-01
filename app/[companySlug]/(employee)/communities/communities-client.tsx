'use client'

import { useState } from 'react'
import { Building, Plus, Pencil, Printer, Trash2, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { applyCommunityRouteAssignment, createCommunity, updateCommunity, deleteCommunity, removeCommunityServiceAssignment } from '@/lib/actions/communities'
import { assignBoardMember, assignCommunityManager, removeCommunityMembership } from '@/lib/actions/community-memberships'
import { colorForRoute, CommunityMap, type CommunityMapPoint } from '@/components/community-map'

interface CommunityMembership { id: string; role: 'board_member' | 'community_manager'; positionTitle: string | null; publicEmail: string | null; publicPhone: string | null; showEmail: boolean; showPhone: boolean; customerUser: { id: string; name: string; email: string; phone: string | null } }
interface ServiceSummary { service: 'trash' | 'recycling' | 'yard_waste'; assignedCount: number; routes: string[]; containerSizes: string[]; daysOfWeek: number[]; weekCycles: string[] }
interface Community { id: string; name: string; cityId: string; city: { name: string; state: string }; addresses: CommunityMapPoint[]; memberships: CommunityMembership[]; serviceSummaries: ServiceSummary[]; _count: { customers: number; addresses: number } }
interface City { id: string; name: string; state: string }
interface ResidentAccess { customerUser: { id: string; name: string; email: string; phone: string | null }; customer: { communityId: string | null } }
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function CommunitiesClient({ communities, companySlug, cities, residentAccess }: { communities: Community[]; companySlug: string; cities: City[]; residentAccess: ResidentAccess[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Community | null>(null)
  const [name, setName] = useState('')
  const [cityId, setCityId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Community | null>(null)
  const [mapService, setMapService] = useState<'all' | 'trash' | 'recycling' | 'yard_waste'>('all')
  const [showAssignment, setShowAssignment] = useState<'board' | 'manager' | null>(null)
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [residentUserId, setResidentUserId] = useState('')
  const [positionTitle, setPositionTitle] = useState('Board Member')
  const [manager, setManager] = useState({ name: '', email: '', phone: '', password: '', positionTitle: 'Community Manager' })
  const [bulkRoute, setBulkRoute] = useState<{ service: string; route: string; containerSize: string; dayOfWeek: number; weekCycle: 'a' | 'b' | null }>({ service: 'trash', route: '', containerSize: '', dayOfWeek: 1, weekCycle: null })
  const [bulkRouteError, setBulkRouteError] = useState('')
  const [bulkRouteResult, setBulkRouteResult] = useState('')
  const [bulkRouteLoading, setBulkRouteLoading] = useState(false)
  const [editingService, setEditingService] = useState<string | null>(null)

  const resetForm = () => { setShowForm(false); setEditing(null); setName(''); setCityId(''); setError('') }
  const resetServiceEditor = () => {
    setEditingService(null)
    setBulkRoute({ service: 'trash', route: '', containerSize: '', dayOfWeek: 1, weekCycle: null })
    setBulkRouteError('')
    setBulkRouteResult('')
  }
  const startEdit = (c: Community) => {
    setEditing(c); setName(c.name); setCityId(c.cityId); setShowForm(true); setError('')
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

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

  const printMap = () => {
    document.body.classList.add('printing-community-map')
    const cleanup = () => document.body.classList.remove('printing-community-map')
    window.addEventListener('afterprint', cleanup, { once: true })
    window.setTimeout(() => window.print(), 100)
  }

  const serviceLabels = { all: 'All Services', trash: 'Trash', recycling: 'Recycling', yard_waste: 'Yard Waste' }
  const mappedAddresses = selected?.addresses.flatMap((address) => {
    if (mapService === 'all') return [address]
    const services = address.services.filter((service) => service.service === mapService)
    return services.length ? [{ ...address, services }] : []
  }) ?? []
  const mappedRoutes = [...new Set(mappedAddresses.flatMap((address) => address.services.map((service) => service.route || 'Unassigned')))].sort()
  const eligibleResidents = selected ? residentAccess
    .filter((access) => access.customer.communityId === selected.id)
    .filter((access, index, all) => all.findIndex((candidate) => candidate.customerUser.id === access.customerUser.id) === index)
    : []

  const handleBoardAssignment = async () => {
    if (!selected || !residentUserId) return
    setAssignmentLoading(true); setAssignmentError('')
    const resident = eligibleResidents.find((item) => item.customerUser.id === residentUserId)
    const result = await assignBoardMember(companySlug, {
      communityId: selected.id, customerUserId: residentUserId, positionTitle,
      publicEmail: resident?.customerUser.email ?? '', publicPhone: resident?.customerUser.phone ?? '', showEmail: true, showPhone: true,
    })
    setAssignmentLoading(false)
    if (result.error) { setAssignmentError(result.error); return }
    setShowAssignment(null); setResidentUserId(''); setSelected(null); router.refresh()
  }

  const handleManagerAssignment = async () => {
    if (!selected) return
    setAssignmentLoading(true); setAssignmentError('')
    const result = await assignCommunityManager(companySlug, {
      communityId: selected.id, ...manager, publicEmail: manager.email, publicPhone: manager.phone, showEmail: true, showPhone: true,
    })
    setAssignmentLoading(false)
    if (result.error) { setAssignmentError(result.error); return }
    setShowAssignment(null); setManager({ name: '', email: '', phone: '', password: '', positionTitle: 'Community Manager' }); setSelected(null); router.refresh()
  }

  const handleRemoveMembership = async (membershipId: string) => {
    if (!window.confirm('Remove this community access assignment?')) return
    const result = await removeCommunityMembership(companySlug, membershipId)
    if (result.error) window.alert(result.error)
    else { setSelected(null); router.refresh() }
  }

  const handleBulkRouteAssignment = async () => {
    if (!selected || !bulkRoute.route.trim()) return
    const savedRoute = companySlug === 'kc-disposal' ? bulkRoute.route.trim().toLocaleUpperCase() : bulkRoute.route.trim()
    const serviceName = serviceLabels[bulkRoute.service as keyof typeof serviceLabels]
    if (!window.confirm(`Apply ${serviceName} route ${savedRoute} on ${dayNames[bulkRoute.dayOfWeek]} to all ${selected._count.addresses} addresses in ${selected.name}?`)) return
    setBulkRouteLoading(true); setBulkRouteError(''); setBulkRouteResult('')
    const result = await applyCommunityRouteAssignment(companySlug, selected.id, { ...bulkRoute, route: savedRoute })
    setBulkRouteLoading(false)
    if (result.error) { setBulkRouteError(result.error); return }
    setBulkRouteResult(`Updated ${result.updated} addresses.`)
    setSelected((current) => current ? {
      ...current,
      serviceSummaries: [
        ...current.serviceSummaries.filter((summary) => summary.service !== bulkRoute.service),
        {
          service: bulkRoute.service as ServiceSummary['service'],
          assignedCount: current._count.addresses,
          routes: [savedRoute],
          containerSizes: [bulkRoute.containerSize || 'No Container'],
          daysOfWeek: [bulkRoute.dayOfWeek],
          weekCycles: [bulkRoute.weekCycle || 'every'],
        },
      ],
      addresses: current.addresses.map((address) => ({
        ...address,
        services: [
          ...address.services.filter((service) => service.service !== bulkRoute.service),
          { service: bulkRoute.service, route: savedRoute, containerSize: bulkRoute.containerSize || null, dayOfWeek: bulkRoute.dayOfWeek, weekCycle: bulkRoute.weekCycle },
        ],
      })),
    } : current)
    setBulkRoute({ service: 'trash', route: '', containerSize: '', dayOfWeek: 1, weekCycle: null })
    setEditingService(null)
    router.refresh()
  }

  const startEditCommunityService = (summary: ServiceSummary) => {
    const weekCycle = summary.weekCycles[0] === 'a' || summary.weekCycles[0] === 'b' ? summary.weekCycles[0] : null
    setBulkRoute({ service: summary.service, route: summary.routes[0] === 'Unassigned' ? '' : summary.routes[0], containerSize: summary.containerSizes[0] === 'No Container' ? '' : summary.containerSizes[0], dayOfWeek: summary.daysOfWeek[0] ?? 1, weekCycle })
    setEditingService(summary.service)
    setBulkRouteError(''); setBulkRouteResult('')
  }

  const handleDeleteCommunityService = async (summary: ServiceSummary) => {
    if (!selected || !window.confirm(`Remove ${serviceLabels[summary.service]} service from all ${selected.name} addresses?`)) return
    const result = await removeCommunityServiceAssignment(companySlug, selected.id, summary.service)
    if (result.error) { setBulkRouteError(result.error); return }
    setBulkRouteResult(`Removed ${serviceLabels[summary.service]} from ${result.removed} addresses.`)
    setSelected((current) => current ? {
      ...current,
      serviceSummaries: current.serviceSummaries.filter((service) => service.service !== summary.service),
      addresses: current.addresses.map((address) => ({ ...address, services: address.services.filter((service) => service.service !== summary.service) })),
    } : current)
    if (editingService === summary.service) { setEditingService(null); setBulkRoute((current) => ({ ...current, route: '' })) }
    router.refresh()
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

      {selected && (
        <div className="community-map-print-area mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">{selected.name} — {serviceLabels[mapService]}</h2>
              <p className="mt-1 text-sm text-slate-500">{selected.city.name}, {selected.city.state} · {mappedAddresses.length} mapped {mapService === 'all' ? 'addresses' : 'stops'}</p>
              <p className="community-map-print-date hidden text-xs text-slate-500">Printed {new Date().toLocaleDateString()}</p>
            </div>
            <div className="community-map-print-controls flex items-center gap-2">
              <button onClick={printMap} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Printer className="h-4 w-4" /> Print Map</button>
              <button onClick={() => { setSelected(null); resetServiceEditor() }} className="rounded p-1 hover:bg-slate-100" aria-label="Close community map"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="community-map-screen-controls mb-4 flex flex-wrap gap-2">
            {(['all', 'trash', 'recycling', 'yard_waste'] as const).map((service) => (
              <button key={service} onClick={() => setMapService(service)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${mapService === service ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                {serviceLabels[service]}
              </button>
            ))}
          </div>
          {mapService !== 'all' && mappedRoutes.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
              {mappedRoutes.map((route) => (
                <span key={route} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorForRoute(route, mappedRoutes) }} />{route}</span>
              ))}
            </div>
          )}
          {mappedAddresses.length ? (
            <CommunityMap points={mappedAddresses} showRouteLabels={mapService !== 'all'} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">No mapped addresses have this service assignment.</div>
          )}

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div>
              <h3 className="font-semibold text-slate-900">Applied Community Services</h3>
              <p className="text-sm text-slate-500">Review, edit, or remove services assigned across this community.</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {selected.serviceSummaries.map((summary) => (
                <div key={summary.service} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{serviceLabels[summary.service]}</p>
                      <p className="mt-1 text-xs text-slate-500">{summary.assignedCount} of {selected._count.addresses} addresses</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditCommunityService(summary)} className="rounded p-1.5 hover:bg-slate-100" title="Edit service"><Pencil className="h-4 w-4 text-slate-400" /></button>
                      <button onClick={() => handleDeleteCommunityService(summary)} className="rounded p-1.5 hover:bg-red-50" title="Delete service"><Trash2 className="h-4 w-4 text-red-500" /></button>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Route</dt><dd className="text-right font-medium text-slate-700">{summary.routes.join(', ')}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Container</dt><dd className="text-right font-medium text-slate-700">{summary.containerSizes.join(', ')}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Day</dt><dd className="text-right font-medium text-slate-700">{summary.daysOfWeek.map((day) => dayNames[day]).join(', ')}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Frequency</dt><dd className="text-right font-medium text-slate-700">{summary.weekCycles.map((cycle) => cycle === 'a' ? 'A Week' : cycle === 'b' ? 'B Week' : 'Every Week').join(', ')}</dd></div>
                  </dl>
                </div>
              ))}
              {!selected.serviceSummaries.length && <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 md:col-span-3">No community-wide services are assigned yet.</div>}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div>
              <h3 className="font-semibold text-slate-900">{editingService ? `Edit ${serviceLabels[editingService as keyof typeof serviceLabels]}` : 'Add Another Service'}</h3>
              <p className="text-sm text-slate-500">Assign or replace one service route and collection day for all {selected._count.addresses} addresses. Other services are not changed.</p>
            </div>
            {bulkRouteError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{bulkRouteError}</div>}
            {bulkRouteResult && <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{bulkRouteResult}</div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_130px_140px_130px_auto]">
              <select value={bulkRoute.service} disabled={Boolean(editingService)} onChange={(event) => setBulkRoute((current) => ({ ...current, service: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500">
                <option value="trash">Trash</option><option value="recycling">Recycling</option><option value="yard_waste">Yard Waste</option>
              </select>
              <input value={bulkRoute.route} onChange={(event) => setBulkRoute((current) => ({ ...current, route: event.target.value }))} placeholder="Route Name or Number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <select value={bulkRoute.containerSize} onChange={(event) => setBulkRoute((current) => ({ ...current, containerSize: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">No Container</option><option value="35g">35g</option><option value="65g">65g</option><option value="95g">95g</option>
              </select>
              <select value={bulkRoute.dayOfWeek} onChange={(event) => setBulkRoute((current) => ({ ...current, dayOfWeek: Number(event.target.value) }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                {dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
              <select value={bulkRoute.weekCycle ?? ''} onChange={(event) => setBulkRoute((current) => ({ ...current, weekCycle: event.target.value === 'a' || event.target.value === 'b' ? event.target.value : null }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Every Week</option><option value="a">A Week</option><option value="b">B Week</option>
              </select>
              <div className="flex gap-2">
                {editingService && <button type="button" onClick={resetServiceEditor} disabled={bulkRouteLoading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>}
                <button onClick={handleBulkRouteAssignment} disabled={!bulkRoute.route.trim() || bulkRouteLoading} className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{bulkRouteLoading ? 'Applying...' : editingService ? 'Update Service' : 'Add Service'}</button>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Board Members & Community Managers</h3>
                <p className="text-sm text-slate-500">Manage community-level access and resident-visible contacts.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAssignment('board'); setAssignmentError('') }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"><UserPlus className="h-4 w-4" /> Board Member</button>
                <button onClick={() => { setShowAssignment('manager'); setAssignmentError('') }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"><UserPlus className="h-4 w-4" /> Community Manager</button>
              </div>
            </div>

            {assignmentError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{assignmentError}</div>}
            {showAssignment === 'board' && (
              <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <select value={residentUserId} onChange={(event) => setResidentUserId(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Select a resident...</option>
                  {eligibleResidents.map((access) => <option key={access.customerUser.id} value={access.customerUser.id}>{access.customerUser.name} · {access.customerUser.email}</option>)}
                </select>
                <input value={positionTitle} onChange={(event) => setPositionTitle(event.target.value)} placeholder="Position (e.g., President)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <button onClick={handleBoardAssignment} disabled={!residentUserId || assignmentLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Assign</button>
              </div>
            )}
            {showAssignment === 'manager' && (
              <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <input value={manager.name} onChange={(event) => setManager((current) => ({ ...current, name: event.target.value }))} placeholder="Full Name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input type="email" value={manager.email} onChange={(event) => setManager((current) => ({ ...current, email: event.target.value }))} placeholder="Email Address" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input value={manager.phone} onChange={(event) => setManager((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone Number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input value={manager.positionTitle} onChange={(event) => setManager((current) => ({ ...current, positionTitle: event.target.value }))} placeholder="Position" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input type="password" value={manager.password} onChange={(event) => setManager((current) => ({ ...current, password: event.target.value }))} placeholder="Temporary Password (New Users)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <button onClick={handleManagerAssignment} disabled={!manager.name || !manager.email || assignmentLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Assign Manager</button>
              </div>
            )}

            <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {selected.memberships.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div><p className="text-sm font-medium text-slate-900">{membership.customerUser.name}</p><p className="text-xs text-slate-500">{membership.positionTitle || (membership.role === 'board_member' ? 'Board Member' : 'Community Manager')} · {membership.customerUser.email}</p></div>
                  <button onClick={() => handleRemoveMembership(membership.id)} className="text-xs font-medium text-red-600 hover:text-red-700">Remove</button>
                </div>
              ))}
              {!selected.memberships.length && <p className="px-4 py-6 text-center text-sm text-slate-400">No board members or managers assigned.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((c: Community) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => { setSelected(c); setMapService('all'); resetServiceEditor() }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setSelected(c); setMapService('all'); resetServiceEditor()
              }
            }}
            className="cursor-pointer bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
            aria-label={`View ${c.name} map`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center"><Building className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.city?.name}, {c.city?.state}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onKeyDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); startEdit(c) }} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                <button onKeyDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); handleDelete(c.id) }} className="p-1.5 hover:bg-red-50 rounded-md"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">{c._count.customers} customers · {c._count.addresses} addresses</div>
          </div>
        ))}
        {communities.length === 0 && <p className="text-slate-400 text-sm col-span-full py-12 text-center">No communities added yet</p>}
      </div>
    </div>
  )
}
