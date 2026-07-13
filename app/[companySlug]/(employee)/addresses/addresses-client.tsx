'use client'

import { useMemo, useState } from 'react'
import { Download, FileUp, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
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
  city: City
  community: { id: string; name: string } | null
}

const emptyForm: AddressInput = {
  address: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  communityId: '',
}

const headerAliases: Record<string, keyof AddressImportRow> = {
  address: 'address',
  address1: 'address',
  street: 'address',
  streetaddress: 'address',
  address2: 'address2',
  unit: 'address2',
  suite: 'address2',
  city: 'city',
  state: 'state',
  zip: 'zipCode',
  zipcode: 'zipCode',
  postalcode: 'zipCode',
  community: 'community',
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim().toLocaleLowerCase().replace(/[\s_-]+/g, '')
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
  for (const required of ['address', 'city', 'state'] as const) {
    if (!mappedHeaders.includes(required)) throw new Error(`Missing required CSV column: ${required}`)
  }

  return records.slice(1).map((record) => {
    const row: AddressImportRow = { address: '', city: '', state: '', address2: '', zipCode: '', community: '' }
    mappedHeaders.forEach((header, index) => {
      if (header) row[header] = record[index] ?? ''
    })
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
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; citiesCreated: number; errors: string[] } | null>(null)

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
      communityId: record.community?.id ?? '',
    })
    setError('')
    setShowForm(true)
  }

  const updateField = (field: keyof AddressInput, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...((field === 'city' || field === 'state') ? { communityId: '' } : {}),
    }))
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
    setImportResult({ imported: result.imported, skipped: result.skipped, citiesCreated: result.citiesCreated, errors: result.errors })
    setImportRows([])
    setImportFileName('')
  }

  const downloadTemplate = () => {
    const content = 'address,address2,city,state,zipCode,community\n123 Main St,,Kansas City,KS,66101,\n'
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'refuselink-address-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const filtered = addresses.filter((record) => {
    const value = search.toLocaleLowerCase()
    return [record.address, record.address2, record.city.name, record.city.state, record.zipCode, record.community?.name]
      .some((part) => part?.toLocaleLowerCase().includes(value))
  })

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
              <p className="text-sm text-slate-500 mt-1">Required columns: address, city, state. Optional: address2, zipCode, community.</p>
            </div>
            <button onClick={() => setShowImport(false)} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>

          {importError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{importError}</div>}
          {importResult && (
            <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-lg text-sm">
              <p className="font-medium">Imported {importResult.imported} addresses. Skipped {importResult.skipped}. Created {importResult.citiesCreated} cities.</p>
              {importResult.errors.length > 0 && <ul className="mt-2 list-disc pl-5 space-y-1">{importResult.errors.map((message) => <li key={message}>{message}</li>)}</ul>}
            </div>
          )}

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
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">City / State</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ZIP</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Community</th>
              <th className="px-6 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-none" />
                    <div><p className="text-sm font-medium text-slate-900">{record.address}</p>{record.address2 && <p className="text-xs text-slate-500">{record.address2}</p>}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.city.name}, {record.city.state}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.zipCode ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.community?.name ?? '—'}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(record)} className="p-1.5 hover:bg-slate-100 rounded-md" title="Edit address"><Pencil className="h-4 w-4 text-slate-400" /></button>
                    <button onClick={() => handleDelete(record.id)} className="p-1.5 hover:bg-red-50 rounded-md" title="Delete address"><Trash2 className="h-4 w-4 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No addresses found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
