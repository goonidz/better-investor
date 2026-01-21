'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ColumnMapperProps {
  csvFields: string[]
  onMappingComplete: (mapping: Record<string, string>) => void
}

const REQUIRED_FIELDS = [
  { id: 'name', label: 'Name' },
  { id: 'symbol', label: 'Symbol' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'avg_price', label: 'Avg price' },
]

const OPTIONAL_FIELDS = [
  { id: 'isin', label: 'ISIN' },
  { id: 'currency', label: 'Currency' },
  { id: 'asset_type', label: 'Type' },
]

export function ColumnMapper({ csvFields, onMappingComplete }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const handleSelect = (internalField: string, csvField: string) => {
    setMapping(prev => ({ ...prev, [internalField]: csvField }))
  }

  const isComplete = REQUIRED_FIELDS.every(field => !!mapping[field.id])

  return (
    <div>
      <h2 className="text-sm font-medium text-zinc-900 mb-4">Map columns</h2>

      <div className="space-y-3">
        {REQUIRED_FIELDS.map(field => (
          <div key={field.id} className="flex items-center gap-4">
            <label className="w-24 text-sm text-zinc-600">{field.label} *</label>
            <div className="relative flex-1">
              <select
                className="w-full appearance-none px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 cursor-pointer"
                value={mapping[field.id] || ''}
                onChange={(e) => handleSelect(field.id, e.target.value)}
              >
                <option value="">Select...</option>
                {csvFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        ))}
        
        <div className="border-t border-zinc-100 my-4"></div>
        
        {OPTIONAL_FIELDS.map(field => (
          <div key={field.id} className="flex items-center gap-4">
            <label className="w-24 text-sm text-zinc-500">{field.label}</label>
            <div className="relative flex-1">
              <select
                className="w-full appearance-none px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 cursor-pointer"
                value={mapping[field.id] || ''}
                onChange={(e) => handleSelect(field.id, e.target.value)}
              >
                <option value="">Select...</option>
                {csvFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => onMappingComplete(mapping)}
          disabled={!isComplete}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Import
        </button>
      </div>
    </div>
  )
}
