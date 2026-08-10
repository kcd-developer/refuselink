'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, FileUp, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  createAddress,
  deleteAddress,
  importAddresses,
  updateAddress,
  type AddressImportRow,
  type AddressInput,
} from '@/lib/actions/addresses'

interface City {
  id: string
  name: string
  state: string
}

interface Community {
  id: string
  name: string
  cityId: string
}

interface AddressRecord {
  id: string
  address: string
  address2: string | null
  zipCode: string | null
  latitude: number | null
  longitude: number | null
  city: City
  community: { id: string; name: string } | null
  services: Array<{ id: string; service: 'trash' | 'recycling' | 'yard_waste'; route: string | null; containerSize: string | null; dayOfWeek: number }>
}

type SortKey = 'address' | 'city' | 'zip' | 'community' | 'services'
type SortDirection = 'asc' | 'desc'
const addressCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const serviceTypes = [
  { value: 'trash' as const, label: 'Trash' },
  { value: 'recycling' as const, label: 'Recycling' },
  { value: 'yard_waste' as const, label: 'Yard Waste' },
]
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const emptyForm: AddressInput = {
  address: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  latitude: null,
  longitude: null,
  latitudeDirection: 'N',
  longitudeDirection: 'W',
  communityId: '',
  services: [],
}

type AddressComponentField = 'softPakAddressNumber' | 'softPakPreDirection' | 'softPakStreet' | 'softPakStreetSuffix' | 'softPakPostDirection' | 'softPakUnit' | 'softPakAddress2' | 'county'
type ImportField = keyof AddressImportRow | AddressComponentField

const headerAliases: Record<string, ImportField> = {
  address: 'address',
  address1: 'address',
  streetaddress: 'address',
  address2: 'address2',
  direction1: 'softPakPreDirection',
  street: 'softPakStreet',
  streetsuffix: 'softPakStreetSuffix',
  direction2: 'softPakPostDirection',
  unit: 'softPakUnit',
  suite: 'address2',
  city: 'city',
  state: 'state',
  zip: 'zipCode',
  zipcode: 'zipCode',
  postalcode: 'zipCode',
  county: 'county',
  community: 'community',
  latitude: 'latitude',
  lat: 'latitude',
  latitudedirection: 'latitudeDirection',
  latdirection: 'latitudeDirection',
  longitude: 'longitude',
  lon: 'longitude',
  lng: 'longitude',
  longitudedirection: 'longitudeDirection',
  londirection: 'longitudeDirection',
  lngdirection: 'longitudeDirection',
  trash: 'trash',
  trashroute: 'trashRoute',
  trashday: 'trashDay',
  trashcontainersize: 'trashContainerSize',
  trashsize: 'trashContainerSize',
  recycle: 'recycle',
  recycling: 'recycle',
  recycleroute: 'recycleRoute',
  recyclingroute: 'recycleRoute',
  recycleday: 'recycleDay',
  recyclingday: 'recycleDay',
  recyclecontainersize: 'recycleContainerSize',
  recyclingcontainersize: 'recycleContainerSize',
  recyclesize: 'recycleContainerSize',
  yardwaste: 'yardWaste',
  yardwasteroute: 'yardWasteRoute',
  yardwasteday: 'yardWasteDay',
  yardwastecontainersize: 'yardWasteContainerSize',
  yardwastesize: 'yardWasteContainerSize',
  servaddr: 'softPakAddressNumber',
  servdir: 'softPakPreDirection',
  servstreet: 'softPakStreet',
  servstrtsufx: 'softPakStreetSuffix',
  servdir2: 'softPakPostDirection',
  servaptste: 'softPakUnit',
  servaddr2: 'softPakAddress2',
  servcity: 'city',
  servstate: 'state',
  servzip: 'zipCode',
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, '')
}

function formatSoftPakUnit(value: string) {
  const unit = value.trim()
  if (!unit || /^(?:apt|apartment|ste|suite|unit|#)\b/i.test(unit)) return unit
  return `Apt ${unit}`
}

function parseCsv(text: string) {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      record.push(field.trim())
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      record.push(field.trim())
      field = ''
      if (record.some(Boolean)) records.push(record)
      record = []
    } else {
      field += character
    }
  }
  record.push(field.trim())
  if (record.some(Boolean)) records.push(record)
  if (quoted) throw new Error('The CSV contains an unclosed quoted value')
  return records
}

function csvToAddresses(text: string) {
  const records = parseCsv(text)
  if (records.length < 2) throw new Error('The CSV must include a header and at least one address')
  const mappedHeaders = records[0].map((header) => headerAliases[normalizeHeader(header)] ?? null)
  const hasCompleteAddress = mappedHeaders.includes('address') || (
    mappedHeaders.includes('softPakAddressNumber') && mappedHeaders.includes('softPakStreet')
  )
  if (!hasCompleteAddress) throw new Error('Missing address column or Soft-Pak SERV ADDR# and SERV STREET columns')
  for (const required of ['city', 'state'] as const) {
    if (!mappedHeaders.includes(required)) throw new Error(`Missing required CSV column: ${required}`)
  }

  return records.slice(1).map((record) => {
    const row: AddressImportRow & Partial<Record<AddressComponentField, string>> = { address: '', city: '', state: '' }
    mappedHeaders.forEach((header, index) => {
      if (header) (row as any)[header] = record[index] ?? ''
    })
    if (row.softPakStreet) {
      row.address = [row.address || row.softPakAddressNumber, row.softPakPreDirection, row.softPakStreet, row.softPakStreetSuffix, row.softPakPostDirection]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ')
    }
    const unit = formatSoftPakUnit(row.softPakUnit ?? '')
    if (!row.address2) row.address2 = [unit, row.softPakAddress2?.trim()].filter(Boolean).join(', ')
    return row
  })
}

export function AddressesClient({ addresses, cities, communities, companySlug }: {
  addresses: AddressRecord[]
  cities: City[]
  communities: Community[]
  companySlug: string
}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'address', direction: 'asc' })
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<AddressRecord | null>(null)
  const [form, setForm] = useState<AddressInput>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [importRows, setImportRows] = useState<AddressImportRow[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [defaultCommunityId, setDefaultCommunityId] = useState('')
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number; citiesCreated: number; errors: string[] } | null>(null)

  const cityById = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities])
  const matchingCity = cities.find((city) =>
    city.name.toLocaleLowerCase() === form.city.toLocaleLowerCase() &&
    city.state.toLocaleLowerCase() === form.state.toLocaleLowerCase()
  )
  const filteredCommunities = communities.filter((community) => !matchingCity || community.cityId === matchingCity.id)

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
    setError('')
  }

  const openCreateForm = () => {
    setShowImport(false)
    resetForm()
    setShowForm(true)
  }

  const startEdit = (record: AddressRecord) => {
    setShowImport(false)
    setEditing(record)
    setForm({
      address: record.address,
      address2: record.address2 ?? '',
      city: record.city.name,
      state: record.city.state,
      zipCode: record.zipCode ?? '',
      latitude: record.latitude == null ? null : Math.abs(record.latitude),
      longitude: record.longitude == null ? null : Math.abs(record.longitude),
      latitudeDirection: record.latitude == null || record.latitude >= 0 ? 'N' : 'S',
      longitudeDirection: record.longitude == null || record.longitude < 0 ? 'W' : 'E',
      communityId: record.community?.id ?? '',
      services: record.services.map(({ service, route, containerSize, dayOfWeek }) => ({ service, route: route ?? '', containerSize: containerSize ?? '', dayOfWeek })),
    })
    setError('')
    setShowForm(true)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  const updateField = (field: keyof AddressInput, value: any) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...((field === 'city' || field === 'state') ? { communityId: '' } : {}),
    }))
  }

  const updateService = (service: 'trash' | 'recycling' | 'yard_waste', enabled: boolean, field?: 'route' | 'containerSize' | 'dayOfWeek', value?: string) => {
    setForm((current) => {
      const existing = current.services.find((assignment) => assignment.service === service)
      if (!enabled) return { ...current, services: current.services.filter((assignment) => assignment.service !== service) }
      const assignment = existing ?? { service, route: '', containerSize: '', dayOfWeek: 1 }
      const updated = field === 'dayOfWeek'
        ? { ...assignment, dayOfWeek: Number(value) }
        : field === 'route' ? { ...assignment, route: value }
          : field === 'containerSize' ? { ...assignment, containerSize: value } : assignment
      return { ...current, services: [...current.services.filter((item) => item.service !== service), updated] }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = editing
      ? await updateAddress(companySlug, editing.id, form)
      : await createAddress(companySlug, form)
    setLoading(false)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this address?')) return
    const result = await deleteAddress(companySlug, id)
    if ('error' in result && result.error) window.alert(result.error)
  }

  const handleFile = async (file?: File) => {
    setImportError('')
    setImportResult(null)
    setImportRows([])
    setImportFileName(file?.name ?? '')
    if (!file) return
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setImportError('Choose a CSV file')
      return
    }
    try {
      const parsed = csvToAddresses(await file.text())
      if (parsed.length > 1000) throw new Error('Import up to 1,000 addresses at a time')
      setImportRows(parsed)
    } catch (fileError) {
      setImportError(fileError instanceof Error ? fileError.message : 'Unable to read the CSV file')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setImportError('')
    const result = await importAddresses(companySlug, importRows, defaultCommunityId || null)
    setImporting(false)
    if (!('imported' in result)) {
      setImportError(result.error ?? 'Failed to import addresses')
      return
    }
    setImportResult({ imported: result.imported, updated: result.updated, skipped: result.skipped, citiesCreated: result.citiesCreated, errors: result.errors })
    setImportRows([])
    setImportFileName('')
  }

  const downloadTemplate = () => {
    const content = 'address,direction1,street,streetSuffix,direction2,unit,city,state,zip,county,community,latitude,longitude,trash,trashRoute,trashDay,trashContainerSize,recycle,recycleRoute,recycleDay,recycleContainerSize,yardWaste,yardWasteRoute,yardWasteDay,yardWasteContainerSize\n1234,SW,Main,St,,Apt 12,Kansas City,KS,64101,Jackson,Example HOA,39.0997,-94.5786,yes,RT08,Monday,95g,yes,RR14,Thursday,65g,yes,RY04,Tuesday,\n'
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'refuselink-address-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    const value = search.toLocaleLowerCase()
    const matching = addresses.filter((record) =>
      [record.address, record.address2, record.city.name, record.city.state, record.zipCode, record.community?.name]
        .some((part) => part?.toLocaleLowerCase().includes(value)),
    )
    const sortValue = (record: AddressRecord) => {
      if (sort.key === 'address') return `${record.address} ${record.address2 ?? ''}`
      if (sort.key === 'city') return `${record.city.name} ${record.city.state}`
      if (sort.key === 'zip') return record.zipCode ?? ''
      if (sort.key === 'community') return record.community?.name ?? ''
      return record.services.map((service) => `${service.service} ${service.route ?? ''} ${dayNames[service.dayOfWeek]}`).join(' ')
    }
    return [...matching].sort((left, right) => {
      const comparison = addressCollator.compare(sortValue(left), sortValue(right))
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }, [addresses, search, sort])

  const changeSort = (key: SortKey) => {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  }

  const sortableHeader = (key: SortKey, label: string) => {
    const active = sort.key === key
    const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ChevronUp : ChevronDown
    return (
      <th aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        <button type="button" onClick={() => changeSort(key)} className="inline-flex items-center gap-1.5 hover:text-slate-800" title={`Sort by ${label}`}>
          {label}<Icon className="h-3.5 w-3.5" />
        </button>
      </th>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Addresses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage service addresses and community assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setShowImport((visible) => !visible); setImportError(''); setImportResult(null) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            <FileUp className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={openCreateForm} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Add Address
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="font-semibold text-slate-900">Import addresses from CSV</h2>
              <p className="text-sm text-slate-500 mt-1">Upload a CSV file or download the ready-to-use RefuseLink template.</p>
            </div>
            <button onClick={() => setShowImport(false)} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>

          {importError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{importError}</div>}
          {importResult && (
            <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-lg text-sm">
              <p className="font-medium">Added {importResult.imported} addresses. Updated {importResult.updated}. Skipped {importResult.skipped}. Created {importResult.citiesCreated} cities.</p>
              {importResult.errors.length > 0 && <ul className="mt-2 list-disc pl-5 space-y-1">{importResult.errors.map((message) => <li key={message}>{message}</li>)}</ul>}
            </div>
          )}

          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-800">Address headers</p>
                <p className="mt-1"><span className="font-medium">Required:</span> <code>address</code> (house number), <code>street</code>, <code>city</code>, <code>state</code></p>
                <p className="mt-1"><span className="font-medium">Optional address parts:</span> <code>direction1</code>, <code>streetSuffix</code>, <code>direction2</code>, <code>unit</code></p>
                <p className="mt-1"><span className="font-medium">Optional location:</span> <code>zip</code>, <code>county</code></p>
                <p className="mt-1"><span className="font-medium">Other optional:</span> <code>community</code></p>
                <p className="mt-1 text-slate-500">Older CSV files may still place the complete street address in <code>address</code> and omit <code>street</code>.</p>
                <p className="mt-1"><span className="font-medium">Coordinates:</span> <code>latitude</code>, <code>longitude</code></p>
                <p className="mt-1 text-slate-500">Use signed decimal coordinates. Positive latitude is north, negative latitude is south, positive longitude is east, and negative longitude is west. Example: <code>39.0997</code>, <code>-94.5786</code>.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Service headers (all optional)</p>
                <p className="mt-1"><code>trash</code>, <code>trashRoute</code>, <code>trashDay</code>, <code>trashContainerSize</code></p>
                <p className="mt-1"><code>recycle</code>, <code>recycleRoute</code>, <code>recycleDay</code>, <code>recycleContainerSize</code></p>
                <p className="mt-1"><code>yardWaste</code>, <code>yardWasteRoute</code>, <code>yardWasteDay</code>, <code>yardWasteContainerSize</code></p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="font-semibold text-slate-800">Separated-address example</p>
              <div className="mt-2 overflow-x-auto rounded-md bg-white p-3 font-mono text-[11px] leading-5 text-slate-600">
                <p className="whitespace-nowrap">address,direction1,street,streetSuffix,direction2,unit,city,state,zip,county</p>
                <p className="whitespace-nowrap">12509,SW,55th,Ave,,Apt 12,Overland Park,KS,66213,Johnson</p>
              </div>
              <p className="mt-2 text-slate-500">Imported as <span className="font-medium text-slate-700">12509 SW 55th Ave</span> with unit <span className="font-medium text-slate-700">Apt 12</span>.</p>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-3 text-slate-500">
              <p><span className="font-medium text-slate-700">Service:</span> use <code>yes</code> to enable or <code>no</code> to remove it. Days may be full names such as <code>Monday</code> or numbers 0–6 (Sunday–Saturday). KC Disposal route codes use uppercase formats such as <code>RT08</code> and <code>RR14</code>.</p>
              <p className="mt-1"><span className="font-medium text-slate-700">Containers:</span> use values such as <code>95g</code>, <code>65g</code>, or <code>35g</code>. Leave the container-size cell blank when service is provided without a container, such as bagged Yard Waste.</p>
              <p className="mt-1">Uploading an existing address updates its supplied service, route, day, container, coordinate, and community information without creating a duplicate.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CSV file</label>
              <input type="file" accept=".csv,text/csv" onChange={(event) => handleFile(event.target.files?.[0])} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" />
              {importFileName && <p className="text-xs text-slate-500 mt-1">{importFileName}: {importRows.length} rows ready</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Assign all to community (optional)</label>
              <select value={defaultCommunityId} onChange={(event) => setDefaultCommunityId(event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="">Use CSV community column / none</option>
                {communities.map((community) => {
                  const city = cityById.get(community.cityId)
                  return <option key={community.id} value={community.id}>{community.name}{city ? ` — ${city.name}, ${city.state}` : ''}</option>
                })}
              </select>
            </div>
            <button onClick={handleImport} disabled={!importRows.length || importing} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {importing ? 'Importing...' : `Import ${importRows.length || ''}`.trim()}
            </button>
          </div>
          <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
            <Download className="h-4 w-4" /> Download CSV template
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">{editing ? 'Edit Address' : 'Add Address'}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Street address *</label>
                <input required value={form.address} onChange={(event) => updateField('address', event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Address 2</label>
                <input value={form.address2 ?? ''} onChange={(event) => updateField('address2', event.target.value)} placeholder="Unit, suite, apartment" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">City *</label>
                <input required list="address-city-options" value={form.city} onChange={(event) => updateField('city', event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                <datalist id="address-city-options">{cities.map((city) => <option key={city.id} value={city.name}>{city.state}</option>)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">State *</label>
                <input required value={form.state} onChange={(event) => updateField('state', event.target.value)} maxLength={50} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">ZIP code</label>
                <input value={form.zipCode ?? ''} onChange={(event) => updateField('zipCode', event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Community (optional)</label>
                <select value={form.communityId ?? ''} onChange={(event) => updateField('communityId', event.target.value)} disabled={!matchingCity} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">None</option>
                  {filteredCommunities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Latitude (optional)</label>
                <input type="text" inputMode="decimal" value={form.latitude ?? ''} onChange={(event) => updateField('latitude', event.target.value)} placeholder="38.99725" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Latitude Direction</label>
                <select value={form.latitudeDirection ?? 'N'} onChange={(event) => updateField('latitudeDirection', event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"><option value="N">N</option><option value="S">S</option></select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Longitude (optional)</label>
                <input type="text" inputMode="decimal" value={form.longitude ?? ''} onChange={(event) => updateField('longitude', event.target.value)} placeholder="94.82948" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Longitude Direction</label>
                <select value={form.longitudeDirection ?? 'W'} onChange={(event) => updateField('longitudeDirection', event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"><option value="E">E</option><option value="W">W</option></select>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Services and route assignments</p>
              <div className="space-y-2">
                {serviceTypes.map((serviceType) => {
                  const assignment = form.services.find((item) => item.service === serviceType.value)
                  return (
                    <div key={serviceType.value} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[140px_1fr_160px_180px] sm:items-center">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input type="checkbox" checked={Boolean(assignment)} onChange={(event) => updateService(serviceType.value, event.target.checked)} />
                        {serviceType.label}
                      </label>
                      <input disabled={!assignment} value={assignment?.route ?? ''} onChange={(event) => updateService(serviceType.value, true, 'route', event.target.value)} placeholder="Route (Employees Only)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50" />
                      <select disabled={!assignment} value={assignment?.containerSize ?? ''} onChange={(event) => updateService(serviceType.value, true, 'containerSize', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50">
                        <option value="">No Container</option><option value="35g">35g</option><option value="65g">65g</option><option value="95g">95g</option>
                      </select>
                      <select disabled={!assignment} value={assignment?.dayOfWeek ?? 1} onChange={(event) => updateService(serviceType.value, true, 'dayOfWeek', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50">
                        {dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Update Address' : 'Create Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search addresses..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {sortableHeader('address', 'Address')}
              {sortableHeader('city', 'City / State')}
              {sortableHeader('zip', 'ZIP')}
              {sortableHeader('community', 'Community')}
              {sortableHeader('services', 'Services / Routes')}
              <th className="px-6 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((record) => (
              <tr
                key={record.id}
                role="button"
                tabIndex={0}
                onClick={() => startEdit(record)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    startEdit(record)
                  }
                }}
                className="cursor-pointer hover:bg-slate-50 focus:bg-blue-50 focus:outline-none"
                aria-label={`Edit ${record.address}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-none" />
                    <div><p className="text-sm font-medium text-slate-900">{record.address}</p>{record.address2 && <p className="text-xs text-slate-500">{record.address2}</p>}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.city.name}, {record.city.state}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.zipCode ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.community?.name ?? '—'}</td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  {record.services.length ? record.services.map((service) => (
                    <div key={service.id}><span className="font-medium capitalize">{service.service.replace('_', ' ')}</span>: {dayNames[service.dayOfWeek]}{service.route ? ` · ${service.route}` : ''}{service.containerSize ? ` · ${service.containerSize}` : ''}</div>
                  )) : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button onKeyDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); startEdit(record) }} className="p-1.5 hover:bg-slate-100 rounded-md" title="Edit address"><Pencil className="h-4 w-4 text-slate-400" /></button>
                    <button onKeyDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); handleDelete(record.id) }} className="p-1.5 hover:bg-red-50 rounded-md" title="Delete address"><Trash2 className="h-4 w-4 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No addresses found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
