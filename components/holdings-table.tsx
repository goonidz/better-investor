'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface Holding {
  id: string
  name: string
  symbol: string | null
  isin: string | null
  quantity: number
  avg_price: number | null
  current_price: number | null
  current_value: number | null
  currency: string
  asset_type: string | null
  sector: string | null
}

export function HoldingsTable({ data, onRefresh, showPercent = true, currencySymbol = '$' }: { data: Holding[], onRefresh: () => void, showPercent?: boolean, currencySymbol?: string }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Holding>>({})
  const supabase = createClient()

  const handleEdit = (holding: Holding) => {
    setEditingId(holding.id)
    setEditForm(holding)
  }

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('holdings')
        .update({
          name: editForm.name,
          symbol: editForm.symbol,
          quantity: editForm.quantity,
          avg_price: editForm.avg_price,
          asset_type: editForm.asset_type
        })
        .eq('id', id)

      if (error) throw error
      setEditingId(null)
      onRefresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this holding?')) return

    try {
      const { error } = await supabase.from('holdings').delete().eq('id', id)
      if (error) throw error
      onRefresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const columnHelper = createColumnHelper<Holding>()

  const columns = [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-zinc-900 transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          {column.getIsSorted() === 'asc' ? <ChevronUp className="w-3 h-3" /> : 
           column.getIsSorted() === 'desc' ? <ChevronDown className="w-3 h-3" /> : null}
        </button>
      ),
      cell: info => {
        const isEditing = editingId === info.row.original.id
        if (isEditing) {
          return (
            <input
              className="w-full px-2 py-1 text-sm bg-zinc-50 border border-zinc-200 rounded focus:outline-none focus:border-zinc-400"
              value={editForm.name || ''}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            />
          )
        }
        return (
          <div>
            <p className="font-medium text-zinc-900">{info.getValue()}</p>
            <p className="text-xs text-zinc-400">{info.row.original.symbol || info.row.original.isin || '—'}</p>
          </div>
        )
      },
    }),
    columnHelper.accessor('quantity', {
      header: 'Qty',
      cell: info => {
        const isEditing = editingId === info.row.original.id
        if (isEditing) {
          return (
            <input
              type="number"
              className="w-20 px-2 py-1 text-sm bg-zinc-50 border border-zinc-200 rounded focus:outline-none focus:border-zinc-400"
              value={editForm.quantity || 0}
              onChange={e => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
            />
          )
        }
        return <span className="text-zinc-900">{info.getValue().toLocaleString()}</span>
      },
    }),
    columnHelper.accessor('avg_price', {
      header: 'Cost price',
      cell: info => {
        const isEditing = editingId === info.row.original.id
        const value = info.getValue()
        const h = info.row.original
        const symbol = h.currency === 'EUR' ? '€' : h.currency === 'GBP' ? '£' : currencySymbol
        if (isEditing) {
          return (
            <input
              type="number"
              step="0.01"
              className="w-24 px-2 py-1 text-sm bg-zinc-50 border border-zinc-200 rounded focus:outline-none focus:border-zinc-400"
              value={editForm.avg_price || 0}
              onChange={e => setEditForm({ ...editForm, avg_price: parseFloat(e.target.value) })}
            />
          )
        }
        if (value === null || value === undefined) return <span className="text-zinc-400">—</span>
        return (
          <span className="text-zinc-600">
            {symbol}{value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
    }),
    columnHelper.accessor('current_value', {
      header: 'Value',
      cell: info => {
        const currentValue = info.getValue()
        const h = info.row.original
        
        // Use current_value if available, otherwise calculate from current_price, otherwise from avg_price
        let displayValue = currentValue
        if (!displayValue && h.current_price) {
          displayValue = h.quantity * h.current_price
        }
        if (!displayValue && h.avg_price) {
          displayValue = h.quantity * h.avg_price
        }
        
        if (!displayValue) return <span className="text-zinc-400">—</span>
        
        // Calculate gain/loss if we have both current value and cost basis
        const costBasis = h.avg_price ? h.quantity * h.avg_price : null
        let gainPercent: number | null = null
        let gainAmount: number | null = null
        if (costBasis && costBasis > 0 && displayValue !== costBasis) {
          gainPercent = ((displayValue - costBasis) / costBasis) * 100
          gainAmount = displayValue - costBasis
        }
        
        const symbol = h.currency === 'EUR' ? '€' : h.currency === 'GBP' ? '£' : currencySymbol
        
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900">
              {symbol}{displayValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {gainPercent !== null && gainAmount !== null && (
              <span className="text-[10px] font-medium text-white bg-zinc-900 px-1.5 py-0.5 rounded">
                {showPercent 
                  ? `${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%`
                  : `${gainAmount >= 0 ? '+' : ''}${symbol}${Math.abs(gainAmount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
                }
              </span>
            )}
          </div>
        )
      },
    }),
    columnHelper.accessor('asset_type', {
      header: 'Type',
      cell: info => {
        const isEditing = editingId === info.row.original.id
        const type = info.getValue()
        if (isEditing) {
          return (
            <input
              className="w-20 px-2 py-1 text-sm bg-zinc-50 border border-zinc-200 rounded focus:outline-none focus:border-zinc-400"
              value={editForm.asset_type || ''}
              onChange={e => setEditForm({ ...editForm, asset_type: e.target.value })}
            />
          )
        }
        if (!type) return <span className="text-zinc-400">—</span>
        return (
          <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
            {type}
          </span>
        )
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => {
        const isEditing = editingId === info.row.original.id
        if (isEditing) {
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => handleSave(info.row.original.id)}
                className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        }
        return (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(info.row.original)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      },
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-zinc-100">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-zinc-500">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 sm:px-6 py-3 sm:py-4 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-zinc-100">
          <p className="text-xs text-zinc-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
