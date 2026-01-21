'use client'

import { useState, useEffect } from 'react'
import { FileUpload } from '@/components/file-upload'
import { ColumnMapper } from '@/components/column-mapper'
import { parseCSV } from '@/lib/parsers/csv-parser'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, Loader2, History, RotateCcw, Trash2, ChevronDown, ChevronUp, FileText, Sparkles, AlertCircle, Upload, FileSpreadsheet } from 'lucide-react'
import { UpgradePrompt } from '@/components/upgrade-prompt'

interface ImportHistoryItem {
  id: string
  import_date: string
  source_type: string
  source_name: string | null
  holdings_count: number
  total_value: number
  note: string | null
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[] | null>(null)
  const [fields, setFields] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'processing' | 'mapping' | 'success'>('upload')
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [checkingPlan, setCheckingPlan] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const res = await fetch('/api/subscription')
      const data = await res.json()
      setPlan(data.plan || 'free')
      if (data.plan === 'deepdive') {
        fetchHistory()
      }
    } catch (err) {
      setPlan('free')
    } finally {
      setCheckingPlan(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/import-history')
      const data = await res.json()
      if (data.history) {
        setImportHistory(data.history)
      }
    } catch (err) {
      console.error('Failed to fetch import history:', err)
    }
  }

  const createSnapshot = async (sourceType: string, sourceName: string) => {
    try {
      await fetch('/api/import-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: sourceType, source_name: sourceName })
      })
    } catch (err) {
      console.error('Failed to create snapshot:', err)
    }
  }

  const restoreFromSnapshot = async (snapshotId: string) => {
    if (!confirm('This will replace all your current holdings with the saved snapshot. Continue?')) {
      return
    }

    setRestoring(snapshotId)
    try {
      const res = await fetch('/api/import-history/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot_id: snapshotId })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`Restored ${data.restored_count} holdings successfully!`)
        fetchHistory()
        router.push('/dashboard')
      } else {
        alert('Restore failed: ' + data.error)
      }
    } catch (err: any) {
      alert('Restore failed: ' + err.message)
    } finally {
      setRestoring(null)
    }
  }

  const deleteSnapshot = async (snapshotId: string) => {
    if (!confirm('Delete this backup?')) return

    try {
      await fetch(`/api/import-history?id=${snapshotId}`, { method: 'DELETE' })
      fetchHistory()
    } catch (err) {
      console.error('Failed to delete snapshot:', err)
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setLoading(true)
    setStep('processing')
    
    // Create snapshot before importing (backup current holdings)
    const fileType = selectedFile.name.endsWith('.pdf') ? 'pdf' : 'csv'
    await createSnapshot(fileType, selectedFile.name)
    
    try {
      if (selectedFile.name.endsWith('.csv')) {
        const result = await parseCSV(selectedFile)
        setCsvData(result.data)
        setFields(result.meta.fields || [])
        setStep('mapping')
      } else if (selectedFile.name.endsWith('.pdf')) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        const response = await fetch('/api/parse/pdf', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) throw new Error('Error during PDF parsing')
        
        const result = await response.json()
        
        if (result.data && result.data.length > 0) {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          let { data: portfolios } = await supabase
            .from('portfolios')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

          let portfolioId: string
          if (!portfolios || portfolios.length === 0) {
            const { data: newPortfolio } = await supabase
              .from('portfolios')
              .insert({ user_id: user.id, name: 'My Portfolio' })
              .select().single()
            portfolioId = newPortfolio.id
          } else {
            portfolioId = portfolios[0].id
          }

          const holdings = result.data.map((row: any) => ({
            portfolio_id: portfolioId,
            name: row.name || 'Unknown',
            symbol: row.symbol || null,
            isin: row.isin || null,
            quantity: parseFloat(row.quantity) || 0,
            avg_price: row.avg_price ? parseFloat(row.avg_price) : 0,
            current_price: row.current_price ? parseFloat(row.current_price) : null,
            current_value: row.current_value ? parseFloat(row.current_value) : null,
            currency: row.currency || 'EUR',
            asset_type: row.asset_type || null,
            sector: row.sector || null
          }))

          console.log('Holdings to insert:', holdings)

          const { data: insertedData, error: insertError } = await supabase
            .from('holdings')
            .insert(holdings)
            .select()

          if (insertError) {
            console.error('Insert error:', insertError)
            throw new Error(insertError.message)
          }

          console.log('Inserted holdings:', insertedData)
          setStep('success')
          setTimeout(() => router.push('/dashboard'), 1500)
          return
        }
        
        setCsvData(result.data)
        setFields(result.fields)
        setDebugInfo(result.debug_info)
        setStep('mapping')
      }
    } catch (error: any) {
      alert(error.message)
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    if (!csvData || !file) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let { data: portfolios } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      let portfolioId: string

      if (!portfolios || portfolios.length === 0) {
        const { data: newPortfolio, error: pError } = await supabase
          .from('portfolios')
          .insert({ user_id: user.id, name: 'My Portfolio' })
          .select()
          .single()
        
        if (pError) throw pError
        portfolioId = newPortfolio.id
      } else {
        portfolioId = portfolios[0].id
      }

      const { data: importRecord, error: iError } = await supabase
        .from('imports')
        .insert({
          portfolio_id: portfolioId,
          filename: file.name,
          status: 'processing'
        })
        .select()
        .single()

      if (iError) throw iError

      const holdings = csvData.map(row => {
        const holding: any = {
          portfolio_id: portfolioId,
          name: row.name || row[mapping.name] || 'Unknown',
          symbol: row.symbol || row[mapping.symbol],
          isin: row.isin || row[mapping.isin],
          quantity: parseFloat(row.quantity || row[mapping.quantity]) || 0,
          avg_price: parseFloat(row.avg_price || row[mapping.avg_price]) || 0,
          currency: row.currency || row[mapping.currency] || 'EUR',
          asset_type: row.asset_type || row[mapping.asset_type]
        }
        return holding
      })

      const { error: hError } = await supabase
        .from('holdings')
        .upsert(holdings, { onConflict: 'portfolio_id,isin' })

      if (hError) throw hError

      await supabase
        .from('imports')
        .update({ status: 'completed' })
        .eq('id', importRecord.id)

      setStep('success')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (error: any) {
      console.error('Import error:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Check if user has access
  if (checkingPlan) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (plan !== 'deepdive') {
    return <UpgradePrompt feature="import" />
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Let us do the heavy lifting</h1>
        <p className="text-zinc-500 mt-1">Drop your broker statement, we handle the rest.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[
          { key: 'upload', label: 'Upload', icon: Upload },
          { key: 'processing', label: 'Processing', icon: Sparkles },
          { key: 'success', label: 'Done', icon: Check },
        ].map((s, i) => {
          const isActive = step === s.key || (step === 'mapping' && s.key === 'processing')
          const isPast = (step === 'processing' && s.key === 'upload') || 
                         (step === 'mapping' && s.key === 'upload') ||
                         (step === 'success' && s.key !== 'success')
          return (
            <div key={s.key} className="flex items-center gap-3">
              {i > 0 && <div className={`w-12 h-0.5 ${isPast ? 'bg-zinc-900' : 'bg-zinc-200'}`} />}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive ? 'bg-zinc-900 text-white' : 
                isPast ? 'bg-zinc-200 text-zinc-700' : 
                'bg-zinc-100 text-zinc-400'
              }`}>
                <s.icon className="w-4 h-4" />
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upload state */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-8">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>

          {/* Supported formats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 text-sm">PDF Statement</p>
                  <p className="text-xs text-zinc-500">AI-powered extraction</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Works with Trade Republic, DEGIRO, Interactive Brokers, and most brokers.
              </p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-200 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 text-sm">CSV Export</p>
                  <p className="text-xs text-zinc-500">Manual column mapping</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Export from your broker or spreadsheet. Map columns to match your data.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-900 text-sm">Tips for best results</p>
                <ul className="text-xs text-zinc-500 mt-1 space-y-1">
                  <li>• Use official broker statements (not screenshots)</li>
                  <li>• PDF works best with clear tables and text</li>
                  <li>• Your data is backed up before each import</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing state */}
      {step === 'processing' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          </div>
          <p className="text-lg font-medium text-zinc-900 mb-2">Processing your file</p>
          <p className="text-sm text-zinc-500">
            {file?.name.endsWith('.pdf') 
              ? 'AI is extracting your holdings from the PDF...' 
              : 'Parsing your CSV file...'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4" />
            <span>This usually takes a few seconds</span>
          </div>
        </div>
      )}

      {/* Mapping state */}
      {step === 'mapping' && csvData && fields.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-zinc-900">Map your columns</h2>
            <p className="text-sm text-zinc-500 mt-1">Match your CSV columns to the required fields.</p>
          </div>
          <ColumnMapper csvFields={fields} onMappingComplete={handleMappingComplete} />
        </div>
      )}

      {/* No data state */}
      {step === 'mapping' && csvData && fields.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="text-lg font-medium text-zinc-900 mb-2">No data found</p>
          <p className="text-sm text-zinc-500 mb-6">
            We couldn't extract any holdings from this file.
            {debugInfo && <span className="block mt-1 text-xs">{debugInfo}</span>}
          </p>
          <button 
            onClick={() => setStep('upload')}
            className="px-6 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Try another file
          </button>
        </div>
      )}

      {/* Success state */}
      {step === 'success' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-medium text-zinc-900 mb-2">Import successful!</p>
          <p className="text-sm text-zinc-500">Your holdings have been added. Redirecting to dashboard...</p>
        </div>
      )}

      {/* Import History */}
      {importHistory.length > 0 && step === 'upload' && (
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <History className="w-4 h-4" />
            Previous imports ({importHistory.length})
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && (
            <div className="mt-4 bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
              {importHistory.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                        {item.source_type?.toUpperCase()}
                      </span>
                      {item.source_name && (
                        <span className="text-sm text-zinc-700 truncate">
                          {item.source_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                      <span>{new Date(item.import_date).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                      <span>{item.holdings_count} holdings</span>
                      {item.total_value > 0 && (
                        <>
                          <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                          <span>${item.total_value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => restoreFromSnapshot(item.id)}
                      disabled={restoring === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                      {restoring === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Restore
                    </button>
                    <button
                      onClick={() => deleteSnapshot(item.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Delete backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
