'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Users, DollarSign, Calendar, Search, Clock, Info, Sparkles, ArrowUpRight, ArrowDownRight, Lock } from 'lucide-react'
import Link from 'next/link'

interface InsiderInsight {
  headline: string
  summary: string
  notable_buys?: { ticker: string; company: string; activity: string }[]
  notable_sells?: { ticker: string; company: string; activity: string }[]
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

interface InsiderTrade {
  id: string
  filing_date: string
  trade_date: string
  ticker: string
  company_name: string
  insider_name: string
  insider_title: string | null
  trade_type: 'P' | 'S'
  price: number | null
  quantity: number | null
  owned: number | null
  delta_own: string | null
  value: number | null
  filing_flag: string | null
  perf_1d: number | null
  perf_1w: number | null
  perf_1m: number | null
  perf_6m: number | null
  created_at?: string
}

type Category = 
  | 'purchases' 
  | 'sales' 
  | 'cluster-buys'
  | 'purchases-25k'
  | 'sales-100k'
  | 'top-week'
  | 'top-month'

const categories: { id: Category; label: string; icon: any }[] = [
  { id: 'purchases', label: 'Latest Buys', icon: TrendingUp },
  { id: 'sales', label: 'Latest Sales', icon: TrendingDown },
  { id: 'cluster-buys', label: 'Cluster Buys', icon: Users },
  { id: 'purchases-25k', label: 'Buys > $25K', icon: DollarSign },
  { id: 'sales-100k', label: 'Sales > $100K', icon: DollarSign },
  { id: 'top-week', label: 'Top This Week', icon: Calendar },
  { id: 'top-month', label: 'Top This Month', icon: Calendar },
]

// Column definitions with tooltips
const columns = [
  { key: 'filing_flag', label: 'X', tooltip: 'Filing indicator: A=Amended, D=Derivative transaction, M=Multiple transactions on one day' },
  { key: 'filing_date', label: 'Filing', tooltip: 'Date and time when the SEC Form 4 was filed' },
  { key: 'trade_date', label: 'Trade', tooltip: 'Date when the trade was executed' },
  { key: 'ticker', label: 'Ticker', tooltip: 'Stock ticker symbol' },
  { key: 'insider', label: 'Insider', tooltip: 'Name of the insider who made the trade' },
  { key: 'title', label: 'Title', tooltip: 'Position of the insider (CEO, CFO, Director, 10% Owner, etc.)' },
  { key: 'type', label: 'Type', tooltip: 'P = Open market Purchase, S = Open market Sale' },
  { key: 'price', label: 'Price', tooltip: 'Price per share at which the trade was executed' },
  { key: 'qty', label: 'Qty', tooltip: 'Number of shares bought or sold' },
  { key: 'owned', label: 'Owned', tooltip: 'Total shares owned after the transaction' },
  { key: 'delta_own', label: 'ΔOwn', tooltip: 'Percentage change in ownership position' },
  { key: 'value', label: 'Value', tooltip: 'Total dollar value of the transaction (Price × Qty)' },
  { key: 'perf_1d', label: '1d', tooltip: 'Stock price change 1 day after the SEC filing' },
  { key: 'perf_1w', label: '1w', tooltip: 'Stock price change 1 week after the SEC filing' },
  { key: 'perf_1m', label: '1m', tooltip: 'Stock price change 1 month after the SEC filing' },
  { key: 'perf_6m', label: '6m', tooltip: 'Stock price change 6 months after the SEC filing' },
]

// Tooltip component - instant hover
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLSpanElement>(null)

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPosition({ x: rect.left + rect.width / 2, y: rect.top })
    }
    setShow(true)
  }

  return (
    <>
      <span 
        ref={ref}
        className="inline-flex items-center gap-1 cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </span>
      {show && (
        <div 
          className="fixed z-[9999] px-2.5 py-1.5 bg-zinc-900 text-white text-xs rounded shadow-lg max-w-[220px] pointer-events-none"
          style={{
            left: position.x,
            top: position.y - 8,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {text}
        </div>
      )}
    </>
  )
}

export default function InsiderPage() {
  const [trades, setTrades] = useState<InsiderTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [category, setCategory] = useState<Category>('purchases')
  const [searchTicker, setSearchTicker] = useState('')
  const [lastSync, setLastSync] = useState<string | null>(null)
  const hasCheckedSync = useRef(false)
  const [insight, setInsight] = useState<InsiderInsight | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const hasLoadedInsight = useRef(false)
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set())
  const [displayLimit, setDisplayLimit] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    checkSubscription()
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [category])

  const checkSubscription = async () => {
    try {
      const res = await fetch('/api/subscription')
      const data = await res.json()
      setPlan(data.plan || 'free')
    } catch (err) {
      setPlan('free')
    }
  }

  const loadData = async () => {
    setLoading(true)
    setDisplayLimit(50) // Reset display limit when changing category
    
    try {
      const res = await fetch(`/api/insider?category=${category}&limit=1000`)
      const data = await res.json()
      setTrades(data.trades || [])
      setTotalCount(data.trades?.length || 0)
      setLoading(false) // Stop loading as soon as we have data
      
      if (data.trades?.length > 0 && data.trades[0].created_at) {
        setLastSync(data.trades[0].created_at)
        
        if (!hasCheckedSync.current) {
          hasCheckedSync.current = true
          const lastSyncDate = new Date(data.trades[0].created_at).toDateString()
          const today = new Date().toDateString()
          
          if (lastSyncDate !== today) {
            // Sync in background without blocking UI
            autoSync()
          }
        }
      } else if (!hasCheckedSync.current) {
        hasCheckedSync.current = true
        // No data at all, sync and show loading
        await autoSync()
      }
    } catch (error) {
      console.error('Error loading trades:', error)
      setLoading(false)
    }
  }

  const autoSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/insider?category=all', { method: 'POST' })
      const data = await res.json()
      
      if (data.scraped > 0) {
        const reloadRes = await fetch(`/api/insider?category=${category}&limit=1000`)
        const reloadData = await reloadRes.json()
        setTrades(reloadData.trades || [])
        setTotalCount(reloadData.trades?.length || 0)
        setLastSync(new Date().toISOString())
      }
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setSyncing(false)
    }
  }

  const loadInsight = async () => {
    if (hasLoadedInsight.current) return
    hasLoadedInsight.current = true
    setInsightLoading(true)
    
    try {
      // Try to get existing insight
      const res = await fetch('/api/insider-insights')
      const data = await res.json()
      
      if (data.insight) {
        setInsight(data.insight)
      } else {
        // No insight exists, generate one
        const genRes = await fetch('/api/insider-insights', { method: 'POST' })
        const genData = await genRes.json()
        if (genData.insight) {
          setInsight(genData.insight)
        }
      }
    } catch (error) {
      console.error('Error loading insight:', error)
    } finally {
      setInsightLoading(false)
    }
  }

  // Load insight on mount (only for paid users)
  useEffect(() => {
    if (plan === 'deepdive') {
      loadInsight()
    }
  }, [plan])

  const formatValue = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatQty = (qty: number | null) => {
    if (qty === null || qty === undefined) return '-'
    if (Math.abs(qty) >= 1000000) return `${(qty / 1000000).toFixed(1)}M`
    if (Math.abs(qty) >= 1000) return `${(qty / 1000).toFixed(0)}K`
    return qty.toLocaleString()
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatFilingDate = (date: string | null) => {
    if (!date) return '-'
    const d = new Date(date)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${dateStr} ${timeStr}`
  }

  const formatPerf = (perf: number | null) => {
    if (perf === null || perf === undefined) return '-'
    const sign = perf >= 0 ? '+' : ''
    return `${sign}${perf.toFixed(0)}%`
  }

  const getPerfColor = (perf: number | null) => {
    if (perf === null || perf === undefined) return 'text-zinc-400'
    if (perf > 0) return 'text-emerald-600'
    if (perf < 0) return 'text-red-600'
    return 'text-zinc-500'
  }

  const formatLastSync = (date: string | null) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTrades = searchTicker 
    ? trades.filter(t => t.ticker.toLowerCase().includes(searchTicker.toLowerCase()))
    : trades
  
  const displayedTrades = filteredTrades.slice(0, displayLimit)
  const hasMore = filteredTrades.length > displayLimit

  const toggleColExpand = (colKey: string) => {
    setExpandedCols(prev => {
      const next = new Set(prev)
      if (next.has(colKey)) {
        next.delete(colKey)
      } else {
        next.add(colKey)
      }
      return next
    })
  }

  const isExpanded = (colKey: string) => expandedCols.has(colKey)

  const isSellCategory = category.includes('sales')

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Insider Trading</h1>
          <p className="text-sm text-zinc-500">SEC Form 4 filings</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {syncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Updating data...</span>
            </>
          ) : lastSync ? (
            <>
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {formatLastSync(lastSync)}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* AI Insight */}
      {plan !== 'deepdive' ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-200 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="font-medium text-zinc-900 text-sm">AI Insights</p>
                <p className="text-xs text-zinc-500">Upgrade to unlock AI analysis of insider activity</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </div>
      ) : (insight || insightLoading) && (
        <div className={`rounded-xl border p-4 ${
          insight?.sentiment === 'bullish' ? 'bg-emerald-50/50 border-emerald-100' :
          insight?.sentiment === 'bearish' ? 'bg-red-50/50 border-red-100' :
          'bg-zinc-50 border-zinc-100'
        }`}>
          {insightLoading ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Analyzing insider activity...</span>
            </div>
          ) : insight && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${
                    insight.sentiment === 'bullish' ? 'text-emerald-600' :
                    insight.sentiment === 'bearish' ? 'text-red-600' :
                    'text-zinc-600'
                  }`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    insight.sentiment === 'bullish' ? 'text-emerald-700' :
                    insight.sentiment === 'bearish' ? 'text-red-700' :
                    'text-zinc-600'
                  }`}>
                    {insight.sentiment === 'bullish' ? 'Bullish Signal' :
                     insight.sentiment === 'bearish' ? 'Bearish Signal' :
                     'Market Neutral'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">AI Analysis</span>
              </div>
              
              <p className="font-semibold text-zinc-900 text-sm">{insight.headline}</p>
              <p className="text-xs text-zinc-600 leading-relaxed">{insight.summary}</p>
              
              <div className="mt-2 px-2 py-1.5 bg-zinc-900/5 rounded border border-zinc-200/50">
                <p className="text-[10px] text-zinc-500 font-medium">
                  ⚠️ Educational purposes only. Not financial advice. Always do your own research.
                </p>
              </div>
              
              {((insight.notable_buys && insight.notable_buys.length > 0) || 
                (insight.notable_sells && insight.notable_sells.length > 0)) && (
                <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-200/50">
                  {insight.notable_buys && insight.notable_buys.length > 0 && (
                    <div className="space-y-1">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase">Notable Buys</span>
                        <span className="text-[9px] text-zinc-400 ml-1">Insiders buying their own stock</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {insight.notable_buys.map((b, i) => (
                          <Tooltip key={i} text={`${b.company} — ${b.activity}`}>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">
                              <ArrowUpRight className="w-2.5 h-2.5" />
                              {b.ticker}
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.notable_sells && insight.notable_sells.length > 0 && (
                    <div className="space-y-1">
                      <div>
                        <span className="text-[10px] font-semibold text-red-700 uppercase">Notable Sells</span>
                        <span className="text-[9px] text-zinc-400 ml-1">Insiders selling their shares</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {insight.notable_sells.map((s, i) => (
                          <Tooltip key={i} text={`${s.company} — ${s.activity}`}>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                              <ArrowDownRight className="w-2.5 h-2.5" />
                              {s.ticker}
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 sm:gap-2 min-w-max pb-2 sm:pb-0 sm:flex-wrap">
          {categories.map(cat => {
            const Icon = cat.icon
            const isActive = category === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-zinc-900 text-white' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search ticker..."
            value={searchTicker}
            onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
            className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Showing:</span>
            <span className="font-semibold text-zinc-900">{displayedTrades.length}</span>
            <span className="text-zinc-400">/ {filteredTrades.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Total:</span>
            <span className={`font-semibold ${isSellCategory ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatValue(filteredTrades.reduce((sum, t) => sum + (t.value || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                {columns.map(col => (
                  <th 
                    key={col.key} 
                    className={`text-left px-1.5 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wide ${
                      ['ticker', 'insider', 'title'].includes(col.key) ? 'cursor-pointer hover:bg-zinc-100 select-none' : ''
                    }`}
                    onClick={() => ['ticker', 'insider', 'title'].includes(col.key) && toggleColExpand(col.key)}
                  >
                    <Tooltip text={`${col.tooltip}${['ticker', 'insider', 'title'].includes(col.key) ? ' (click to expand)' : ''}`}>
                      <span>{col.label}</span>
                      <Info className="w-2.5 h-2.5 text-zinc-300" />
                      {['ticker', 'insider', 'title'].includes(col.key) && (
                        <span className={`ml-0.5 text-[8px] ${isExpanded(col.key) ? 'text-emerald-500' : 'text-zinc-300'}`}>
                          {isExpanded(col.key) ? '−' : '+'}
                        </span>
                      )}
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading && trades.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading {categories.find(c => c.id === category)?.label || 'trades'}...
                  </td>
                </tr>
              ) : displayedTrades.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">
                    {searchTicker ? `No trades found for "${searchTicker}"` : 'No trades found'}
                  </td>
                </tr>
              ) : (
                displayedTrades.map((trade, idx) => (
                  <tr key={trade.id || idx} className="hover:bg-zinc-50/50 transition-colors">
                    {/* X */}
                    <td className="px-1.5 py-1.5 text-center">
                      {trade.filing_flag ? (
                        <Tooltip text={
                          trade.filing_flag === 'A' ? 'Amended filing' :
                          trade.filing_flag === 'D' ? 'Derivative transaction' :
                          trade.filing_flag === 'M' ? 'Multiple transactions' : trade.filing_flag
                        }>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-zinc-100 text-zinc-600 text-[9px] font-medium">
                            {trade.filing_flag}
                          </span>
                        </Tooltip>
                      ) : <span className="text-zinc-300">-</span>}
                    </td>
                    {/* Filing */}
                    <td className="px-1.5 py-1.5 text-zinc-600 whitespace-nowrap">{formatFilingDate(trade.filing_date)}</td>
                    {/* Trade */}
                    <td className="px-1.5 py-1.5 text-zinc-500 whitespace-nowrap">{formatDate(trade.trade_date)}</td>
                    {/* Ticker */}
                    <td className={`px-1.5 py-1.5 ${isExpanded('ticker') ? '' : 'max-w-[100px]'}`}>
                      <Tooltip text={`${trade.ticker} - ${trade.company_name}`}>
                        <span className="font-bold text-zinc-900">{trade.ticker}</span>
                        <span className={`text-[9px] text-zinc-400 block ${isExpanded('ticker') ? '' : 'truncate max-w-[80px]'}`}>
                          {trade.company_name}
                        </span>
                      </Tooltip>
                    </td>
                    {/* Insider */}
                    <td className={`px-1.5 py-1.5 text-zinc-700 ${isExpanded('insider') ? '' : 'max-w-[100px]'}`}>
                      <Tooltip text={trade.insider_name}>
                        <span className={isExpanded('insider') ? '' : 'truncate block max-w-[100px]'}>{trade.insider_name}</span>
                      </Tooltip>
                    </td>
                    {/* Title */}
                    <td className={`px-1.5 py-1.5 text-zinc-500 ${isExpanded('title') ? '' : 'max-w-[80px]'}`}>
                      <Tooltip text={trade.insider_title || '-'}>
                        <span className={isExpanded('title') ? '' : 'truncate block max-w-[80px]'}>{trade.insider_title || '-'}</span>
                      </Tooltip>
                    </td>
                    {/* Type */}
                    <td className="px-1.5 py-1.5 text-center">
                      <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold ${
                        trade.trade_type === 'P' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {trade.trade_type === 'P' ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    {/* Price */}
                    <td className="px-1.5 py-1.5 text-right text-zinc-700">{trade.price ? `$${trade.price.toFixed(2)}` : '-'}</td>
                    {/* Qty */}
                    <td className="px-1.5 py-1.5 text-right font-medium text-zinc-700">{formatQty(trade.quantity)}</td>
                    {/* Owned */}
                    <td className="px-1.5 py-1.5 text-right text-zinc-500">{formatQty(trade.owned)}</td>
                    {/* ΔOwn */}
                    <td className="px-1.5 py-1.5 text-right text-zinc-500">{trade.delta_own || '-'}</td>
                    {/* Value */}
                    <td className="px-1.5 py-1.5 text-right">
                      <span className={`font-semibold ${trade.trade_type === 'P' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trade.trade_type === 'P' ? '+' : '-'}{formatValue(trade.value)}
                      </span>
                    </td>
                    {/* Perf */}
                    <td className={`px-1.5 py-1.5 text-right font-medium ${getPerfColor(trade.perf_1d)}`}>{formatPerf(trade.perf_1d)}</td>
                    <td className={`px-1.5 py-1.5 text-right font-medium ${getPerfColor(trade.perf_1w)}`}>{formatPerf(trade.perf_1w)}</td>
                    <td className={`px-1.5 py-1.5 text-right font-medium ${getPerfColor(trade.perf_1m)}`}>{formatPerf(trade.perf_1m)}</td>
                    <td className={`px-1.5 py-1.5 text-right font-medium ${getPerfColor(trade.perf_6m)}`}>{formatPerf(trade.perf_6m)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setDisplayLimit(prev => prev + 100)}
            className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Load more ({filteredTrades.length - displayLimit} remaining)
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-zinc-400 text-center">
        Performance columns show stock price change after SEC filing date. Updated daily.
      </p>
    </div>
  )
}
