'use client'

import { createClient } from '@/lib/supabase/client'
import { HoldingsTable, Holding } from '@/components/holdings-table'
import { PortfolioChart } from '@/components/portfolio-chart'
import { AIInsights } from '@/components/ai-insights'
import { useEffect, useState, useCallback } from 'react'
import { ArrowUpRight, Plus, Percent, DollarSign, Building2, Layers, Send, MessageCircle, Expand, X, RefreshCw, Search, Loader2, ChevronDown, TrendingUp, TrendingDown, Sparkles, AlertTriangle, BookOpen, Trash2, Lock, Zap } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string | null>(null)
  const [showPercent, setShowPercent] = useState(true)
  const [chartView, setChartView] = useState<'holdings' | 'sectors'>('holdings')
  const [performancePeriod, setPerformancePeriod] = useState<'7d' | '30d' | 'ytd' | 'total'>('total')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatQuestion, setChatQuestion] = useState<string | null>(null)
  const [chatResponse, setChatResponse] = useState<string | null>(null)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [refreshingPrices, setRefreshingPrices] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTicker, setAddTicker] = useState('')
  const [addQuantity, setAddQuantity] = useState('')
  const [addCostPrice, setAddCostPrice] = useState('')
  const [addSearching, setAddSearching] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addTickerInfo, setAddTickerInfo] = useState<{ symbol: string; price: number; name?: string; latestTradingDay?: string; previousClose?: number } | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [showDemoInsight, setShowDemoInsight] = useState(false)
  const [periodPerformance, setPeriodPerformance] = useState<{
    '7d': { amount: number; percent: number } | null
    '30d': { amount: number; percent: number } | null
    'ytd': { amount: number; percent: number } | null
  } | null>(null)
  const supabase = createClient()

  const searchTicker = async () => {
    if (!addTicker.trim()) return
    
    setAddSearching(true)
    setAddError(null)
    setAddTickerInfo(null)
    
    try {
      const res = await fetch(`/api/market?symbol=${encodeURIComponent(addTicker.trim().toUpperCase())}`)
      const data = await res.json()
      
      if (data.price) {
        setAddTickerInfo({
          symbol: data.symbol || addTicker.toUpperCase(),
          price: data.price,
          name: data.name,
          latestTradingDay: data.latestTradingDay,
          previousClose: data.previousClose
        })
      } else {
        setAddError('Ticker not found. Try adding exchange suffix (e.g., .PAR for Paris, .DEX for Xetra)')
      }
    } catch (err) {
      setAddError('Failed to search ticker')
    } finally {
      setAddSearching(false)
    }
  }

  const addHolding = async () => {
    if (!addTickerInfo || !addQuantity) return
    
    setAddSaving(true)
    setAddError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get or create portfolio
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
          .select()
          .single()
        portfolioId = newPortfolio.id
      } else {
        portfolioId = portfolios[0].id
      }

      const quantity = parseFloat(addQuantity)
      const costPrice = addCostPrice ? parseFloat(addCostPrice) : addTickerInfo.price
      const currentValue = quantity * addTickerInfo.price

      const { error } = await supabase
        .from('holdings')
        .insert({
          portfolio_id: portfolioId,
          name: addTickerInfo.name || addTickerInfo.symbol,
          symbol: addTickerInfo.symbol,
          quantity: quantity,
          avg_price: costPrice,
          current_price: addTickerInfo.price,
          current_value: currentValue,
          currency: 'USD',
          asset_type: 'Stock'
        })

      if (error) throw error

      // Reset and close modal
      setShowAddModal(false)
      setAddTicker('')
      setAddQuantity('')
      setAddCostPrice('')
      setAddTickerInfo(null)
      
      // Refresh holdings
      fetchData()
    } catch (err: any) {
      setAddError(err.message || 'Failed to add holding')
    } finally {
      setAddSaving(false)
    }
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setAddTicker('')
    setAddQuantity('')
    setAddCostPrice('')
    setAddTickerInfo(null)
    setAddError(null)
  }

  const refreshMarketData = async () => {
    setRefreshingPrices(true)
    setRefreshStatus('Syncing...')
    
    try {
      // First, sync holdings from cached prices (instant)
      const syncRes = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_from_cache' })
      })
      
      const syncData = await syncRes.json()
      
      if (syncData.success && syncData.updated > 0) {
        setRefreshStatus(`Synced ${syncData.updated} holdings`)
        // Fetch updated holdings silently (realtime subscription will also help)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: portfolios } = await supabase
            .from('portfolios')
            .select('id')
            .eq('user_id', user.id)
          
          if (portfolios && portfolios.length > 0) {
            const { data: holdingsData } = await supabase
              .from('holdings')
              .select('*')
              .eq('portfolio_id', portfolios[0].id)
              .order('name')
            
            if (holdingsData) {
              const formatted = holdingsData.map(h => ({
                id: h.id,
                name: h.name,
                symbol: h.symbol,
                isin: h.isin,
                quantity: parseFloat(h.quantity),
                avg_price: h.avg_price ? parseFloat(h.avg_price) : null,
                current_price: h.current_price ? parseFloat(h.current_price) : null,
                current_value: h.current_value ? parseFloat(h.current_value) : null,
                currency: h.currency,
                asset_type: h.asset_type,
                sector: h.sector
              }))
              setHoldings(formatted)
            }
          }
        }
      }

      // Then check if we need to refresh stale symbols from API
      setRefreshStatus('Checking market...')
      
      const refreshRes = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_all' })
      })
      
      const refreshData = await refreshRes.json()
      
      if (refreshData.success) {
        if (refreshData.updated > 0) {
          setRefreshStatus(`Updated ${refreshData.updated} prices`)
          // Silently update holdings state
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: portfolios } = await supabase
              .from('portfolios')
              .select('id')
              .eq('user_id', user.id)
            
            if (portfolios && portfolios.length > 0) {
              const { data: holdingsData } = await supabase
                .from('holdings')
                .select('*')
                .eq('portfolio_id', portfolios[0].id)
                .order('name')
              
              if (holdingsData) {
                const formatted = holdingsData.map(h => ({
                  id: h.id,
                  name: h.name,
                  symbol: h.symbol,
                  isin: h.isin,
                  quantity: parseFloat(h.quantity),
                  avg_price: h.avg_price ? parseFloat(h.avg_price) : null,
                  current_price: h.current_price ? parseFloat(h.current_price) : null,
                  current_value: h.current_value ? parseFloat(h.current_value) : null,
                  currency: h.currency,
                  asset_type: h.asset_type,
                  sector: h.sector
                }))
                setHoldings(formatted)
              }
            }
          }
        } else if (refreshData.fromCache > 0) {
          setRefreshStatus('Prices up to date')
        } else {
          setRefreshStatus('No symbols found')
        }
        setTimeout(() => setRefreshStatus(null), 3000)
      } else {
        setRefreshStatus(refreshData.error || 'Failed')
        setTimeout(() => setRefreshStatus(null), 5000)
      }
    } catch (err) {
      setRefreshStatus('Failed')
      setTimeout(() => setRefreshStatus(null), 5000)
    } finally {
      setRefreshingPrices(false)
    }
  }

  const sendQuickChat = async (message?: string) => {
    const msg = message || chatInput.trim()
    if (!msg || chatLoading) return
    
    setChatLoading(true)
    setChatQuestion(msg)
    setChatResponse(null)
    setChatInput('')
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      })
      const data = await res.json()
      if (data.message) {
        setChatResponse(data.message)
      }
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setChatLoading(false)
    }
  }

  const clearChat = () => {
    setChatQuestion(null)
    setChatResponse(null)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      setLoading(false)
      return
    }

    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', currentUser.id)

    if (portfolios && portfolios.length > 0) {
      const { data: holdingsData } = await supabase
        .from('holdings')
        .select('*')
        .eq('portfolio_id', portfolios[0].id)
        .order('name')

      const formatted = (holdingsData || []).map(h => ({
        id: h.id,
        name: h.name,
        symbol: h.symbol,
        isin: h.isin,
        quantity: parseFloat(h.quantity),
        avg_price: h.avg_price ? parseFloat(h.avg_price) : null,
        current_price: h.current_price ? parseFloat(h.current_price) : null,
        current_value: h.current_value ? parseFloat(h.current_value) : null,
        currency: h.currency,
        asset_type: h.asset_type,
        sector: h.sector
      }))
      setHoldings(formatted)
    }
    setLoading(false)
  }, [supabase])

  const fetchPortfolioHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio-history')
      const data = await res.json()
      if (data.periods) {
        setPeriodPerformance(data.periods)
      }
    } catch (err) {
      console.error('Failed to fetch portfolio history:', err)
    }
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showDemoInsight || showAddModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showDemoInsight, showAddModal])

  useEffect(() => {
    fetchData()
    fetchPortfolioHistory()
    
    // Check subscription
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => setPlan(data.plan || 'free'))
      .catch(() => setPlan('free'))

    // Auto-sync from cache on load (no API calls, instant)
    fetch('/api/market', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync_from_cache' })
    }).then(() => fetchData()).catch(() => {})

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holdings' }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchData, fetchPortfolioHistory, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Sample data for demo view
  const sampleHoldings: Holding[] = [
    { id: '1', name: 'Apple Inc.', symbol: 'AAPL', isin: null, quantity: 50, avg_price: 145.00, current_price: 178.50, current_value: 8925, currency: 'USD', asset_type: 'Stock', sector: 'Technology' },
    { id: '2', name: 'Microsoft Corporation', symbol: 'MSFT', isin: null, quantity: 30, avg_price: 280.00, current_price: 378.90, current_value: 11367, currency: 'USD', asset_type: 'Stock', sector: 'Technology' },
    { id: '3', name: 'Vanguard S&P 500 ETF', symbol: 'VOO', isin: null, quantity: 25, avg_price: 380.00, current_price: 435.20, current_value: 10880, currency: 'USD', asset_type: 'ETF', sector: 'Diversified' },
    { id: '4', name: 'Tesla Inc.', symbol: 'TSLA', isin: null, quantity: 15, avg_price: 220.00, current_price: 248.50, current_value: 3727.5, currency: 'USD', asset_type: 'Stock', sector: 'Automotive' },
    { id: '5', name: 'NVIDIA Corporation', symbol: 'NVDA', isin: null, quantity: 20, avg_price: 450.00, current_price: 495.80, current_value: 9916, currency: 'USD', asset_type: 'Stock', sector: 'Technology' },
  ]

  const isDemo = holdings.length === 0
  const displayHoldings = isDemo ? sampleHoldings : holdings

  // Calculate total current value (market value)
  // Priority: current_price * qty (most accurate), then current_value, then fallback to avg_price * qty
  const totalValue = displayHoldings.reduce((sum, h) => {
    if (h.current_price && h.current_price > 0) {
      return sum + (h.quantity * h.current_price)
    }
    if (h.current_value && h.current_value > 0) {
      return sum + h.current_value
    }
    // Fallback: use cost as value (no market data)
    if (h.avg_price) {
      return sum + (h.quantity * h.avg_price)
    }
    return sum
  }, 0)

  // Calculate total cost basis (what you paid)
  const totalCost = displayHoldings.reduce((sum, h) => {
    if (h.avg_price && h.avg_price > 0) {
      return sum + (h.quantity * h.avg_price)
    }
    return sum
  }, 0)

  // Lifetime gain/loss = (current value - cost) / cost
  const totalGainAmount = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGainAmount / totalCost) * 100 : 0

  // Detect primary currency (most common in holdings)
  const currencyCounts = displayHoldings.reduce((acc, h) => {
    const c = h.currency || 'USD'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const primaryCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD'
  const currencySymbol = primaryCurrency === 'EUR' ? '€' : primaryCurrency === 'GBP' ? '£' : '$'

  // Period labels
  const periodLabels: Record<string, string> = {
    '7d': '7 days',
    '30d': '30 days',
    'ytd': 'Year to date',
    'total': 'Lifetime'
  }

  // Get performance value based on period
  // Lifetime = (current value - cost basis) / cost basis
  const getPerformanceData = () => {
    if (performancePeriod === 'total') {
      // Lifetime: simple calculation from cost basis
      return {
        percent: totalGainPercent,
        amount: totalGainAmount,
        available: true
      }
    }
    
    // Use historical data for other periods (7d, 30d, ytd)
    const periodData = periodPerformance?.[performancePeriod]
    if (periodData) {
      return {
        percent: periodData.percent,
        amount: periodData.amount,
        available: true
      }
    }
    
    // No historical data yet - show message
    return {
      percent: null,
      amount: null,
      available: false
    }
  }
  
  const perfData = getPerformanceData()

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      {isDemo && (
        <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 sm:p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full text-xs font-medium mb-3">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Demo Preview
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                See what your portfolio could look like
              </h2>
              <p className="text-zinc-300 text-sm max-w-md">
                This is sample data. Import your own investment statement to track your real portfolio with AI-powered insights.
              </p>
            </div>
            <a
              href="/dashboard/import"
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-100 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Import My Data
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-sm text-zinc-500">Total value</p>
            <button
              onClick={refreshMarketData}
              disabled={refreshingPrices}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50 transition-colors"
              title="Refresh market prices"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingPrices ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshStatus || 'Refresh prices'}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight">
              {currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h1>
            {perfData.available && perfData.percent !== null ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white px-1.5 py-0.5 rounded bg-zinc-900">
                {perfData.percent >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {showPercent 
                  ? `${perfData.percent >= 0 ? '+' : ''}${perfData.percent.toFixed(2)}%`
                  : `${(perfData.amount || 0) >= 0 ? '+' : ''}${currencySymbol}${Math.abs(perfData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                }
              </span>
            ) : !perfData.available ? (
              <span className="text-[10px] font-medium text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-100" title="Historical data coming soon">
                —
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <div className="text-left sm:text-right">
            <p className="text-zinc-500">Positions</p>
            <p className="font-semibold text-zinc-900">{displayHoldings.length}</p>
          </div>
          <div className="w-px h-8 bg-zinc-200"></div>
          <div className="text-left sm:text-right">
            <p className="text-zinc-500">Asset types</p>
            <p className="font-semibold text-zinc-900">{[...new Set(displayHoldings.map(h => h.asset_type).filter(Boolean))].length || 1}</p>
          </div>
        </div>
      </div>

      {/* Chart + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-sm font-medium text-zinc-900">Allocation</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartView('holdings')}
                  className={`p-1.5 rounded-md transition-colors ${chartView === 'holdings' ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                  title="By holdings"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartView('sectors')}
                  className={`p-1.5 rounded-md transition-colors ${chartView === 'sectors' ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                  title="By sector"
                >
                  <Building2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
                Live
              </span>
            </div>
          </div>
          <div className="h-[220px] sm:h-[260px]">
            <PortfolioChart holdings={displayHoldings} viewMode={chartView} />
          </div>
        </div>

        {isDemo ? (
          <>
            <div 
              className="bg-zinc-900 rounded-xl p-5 relative overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors"
              onClick={() => setShowDemoInsight(true)}
            >
              {/* Demo badge */}
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-medium rounded-full">
                  Sample
                </span>
              </div>
              
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-white">AI Insights</span>
              </div>

              {/* Sample insight content */}
              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                Well-diversified tech-focused portfolio with strong growth potential. Heavy concentration in technology sector (~70%) suits aggressive growth strategy.
              </p>

              {/* Portfolio Fit */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Portfolio Fit</span>
                  <span className="text-sm font-semibold text-emerald-400">8/10</span>
                </div>
                <span className="text-[10px] text-zinc-500">Jan 20</span>
              </div>

              {/* View details button */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="w-full py-2 text-sm font-medium text-zinc-900 bg-white rounded-lg text-center">
                  View details
                </div>
              </div>
            </div>

            {/* Demo Insight Modal */}
            {showDemoInsight && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDemoInsight(false)} />
                
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-zinc-900">Portfolio Analysis</h2>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">Sample</span>
                        </div>
                        <p className="text-xs text-zinc-500">Jan 20, 2026</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDemoInsight(false)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="overflow-y-auto p-6 space-y-6 overscroll-contain" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                    {/* Summary */}
                    <div className="border-l-4 border-zinc-900 pl-4 py-2">
                      <p className="text-base font-medium text-zinc-900 leading-relaxed">
                        Well-diversified tech-focused portfolio with strong growth potential. The heavy concentration in technology sector (~70%) aligns with aggressive growth strategies.
                      </p>
                    </div>

                    {/* Score + Note */}
                    <div className="grid grid-cols-2 gap-5">
                      <div className="border border-zinc-200 rounded-xl p-5">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Portfolio Fit</p>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-4xl font-bold text-emerald-600">8</span>
                          <span className="text-lg text-zinc-400 font-medium">/10</span>
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                          Strong alignment with growth objectives. Consider slight diversification into defensive sectors for risk management.
                        </p>
                      </div>

                      <div className="border border-zinc-200 rounded-xl p-5">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Educational Note</p>
                        <p className="text-sm text-zinc-600 leading-relaxed pt-2">
                          Tech-heavy portfolios historically show higher volatility but stronger long-term returns. Dollar-cost averaging helps smooth entry points.
                        </p>
                      </div>
                    </div>

                    {/* Market Context */}
                    <div className="border border-zinc-200 rounded-xl p-5">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Market Context</p>
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        Technology sector continues to lead market gains in 2026, driven by AI adoption and cloud computing growth. NVIDIA and Microsoft remain key beneficiaries of enterprise AI spending.
                      </p>
                    </div>

                    {/* Recent News */}
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recent News</p>
                      <div className="space-y-3">
                        <div className="border border-zinc-200 rounded-xl p-4 bg-gradient-to-br from-white to-zinc-50">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded">NVDA</span>
                              <span className="text-xs text-zinc-500">NVIDIA Corporation</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-zinc-400">Reuters</p>
                              <p className="text-[10px] text-zinc-500 font-medium">Jan 18</p>
                            </div>
                          </div>
                          <h4 className="font-semibold text-zinc-900 mb-2 leading-snug">NVIDIA announces next-gen AI chips at CES 2026</h4>
                          <p className="text-sm text-zinc-600 leading-relaxed">
                            New Blackwell Ultra architecture promises 2x performance gains for enterprise AI workloads, strengthening competitive position.
                          </p>
                        </div>
                        <div className="border border-zinc-200 rounded-xl p-4 bg-gradient-to-br from-white to-zinc-50">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded">AAPL</span>
                              <span className="text-xs text-zinc-500">Apple Inc.</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-zinc-400">Bloomberg</p>
                              <p className="text-[10px] text-zinc-500 font-medium">Jan 15</p>
                            </div>
                          </div>
                          <h4 className="font-semibold text-zinc-900 mb-2 leading-snug">Apple Vision Pro 2 production ramps up ahead of launch</h4>
                          <p className="text-sm text-zinc-600 leading-relaxed">
                            Supply chain reports indicate 40% cost reduction, potentially expanding the spatial computing market significantly.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Key Insights</p>
                      <div className="space-y-3">
                        <div className="border border-zinc-200 rounded-xl p-4">
                          <div className="flex gap-3">
                            <div className="shrink-0 mt-1">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 mb-1">Sector Concentration Risk</p>
                              <p className="text-sm text-zinc-600">70% technology exposure increases correlation risk during sector downturns. Consider adding healthcare or consumer staples for balance.</p>
                            </div>
                          </div>
                        </div>
                        <div className="border border-zinc-200 rounded-xl p-4">
                          <div className="flex gap-3">
                            <div className="shrink-0 mt-1">
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 mb-1">Strong momentum in top holdings</p>
                              <p className="text-sm text-zinc-600">NVDA +45% and MSFT +28% YTD performance indicates continued AI-driven growth trajectory.</p>
                            </div>
                          </div>
                        </div>
                        <div className="border border-zinc-200 rounded-xl p-4">
                          <div className="flex gap-3">
                            <div className="shrink-0 mt-1">
                              <BookOpen className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 mb-1">VOO provides broad diversification</p>
                              <p className="text-sm text-zinc-600">Your S&P 500 ETF holding adds exposure to 500 companies across all sectors, balancing single-stock concentration.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Study */}
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Research & Studies</p>
                      <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-900 text-base">The Equity Risk Premium</p>
                            <p className="text-xs text-zinc-500 mt-1 font-medium">Fama & French · 2002</p>
                            <div className="mt-4 space-y-3">
                              <p className="text-sm text-zinc-600 leading-relaxed">
                                Landmark study analyzing stock returns vs. bonds over extended periods, establishing foundational understanding of equity risk compensation.
                              </p>
                              <div className="bg-white/80 rounded-lg p-3">
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Key Finding</p>
                                <p className="text-sm text-zinc-700 leading-relaxed">
                                  Equities have historically returned 3-5% more annually than bonds, compensating investors for higher volatility.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
                    <a
                      href="/dashboard/import"
                      className="block w-full text-center py-3 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Import my data to get personalized insights
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <AIInsights holdings={displayHoldings} />
        )}
      </div>

      {/* Quick Chat */}
      <div className={`bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 transition-all ${chatExpanded ? 'fixed inset-2 sm:inset-4 z-50 flex flex-col' : ''}`}>
        {chatExpanded && <div className="fixed inset-0 bg-black/20 -z-10" onClick={() => setChatExpanded(false)} />}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-900">Ask AI</h2>
            {plan !== 'deepdive' && (
              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-medium rounded">PRO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {plan === 'deepdive' && (chatQuestion || chatResponse) && (
              <button
                onClick={clearChat}
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {plan === 'deepdive' && (
              <button
                onClick={() => setChatExpanded(!chatExpanded)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                title={chatExpanded ? 'Minimize' : 'Expand'}
              >
                {chatExpanded ? <X className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
              </button>
            )}
            <Link 
              href={plan === 'deepdive' ? "/dashboard/chat" : "/pricing"}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              {plan === 'deepdive' ? 'Full chat →' : 'Upgrade →'}
            </Link>
          </div>
        </div>
        
        {/* Locked state for free users */}
        {plan !== 'deepdive' ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="font-medium text-zinc-900 mb-1">AI Assistant is a Pro feature</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Get personalized portfolio analysis and insights
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Upgrade to Deepdive
            </Link>
          </div>
        ) : (
          <>
            {/* Quick suggestions */}
            {!chatQuestion && !chatLoading && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => sendQuickChat("How diversified is my portfolio?")}
                  className="text-xs px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full hover:bg-zinc-200 transition-colors"
                >
                  How diversified am I?
                </button>
                <button
                  onClick={() => sendQuickChat("What's my biggest risk?")}
                  className="text-xs px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full hover:bg-zinc-200 transition-colors"
                >
                  My biggest risk?
                </button>
                <button
                  onClick={() => sendQuickChat("Summarize my portfolio in one sentence")}
                  className="text-xs px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full hover:bg-zinc-200 transition-colors"
                >
                  Summarize my portfolio
                </button>
              </div>
            )}

            {/* Chat messages */}
            {(chatQuestion || chatLoading) && (
              <div className={`space-y-4 mb-4 ${chatExpanded ? 'flex-1 overflow-y-auto' : 'max-h-96 overflow-y-auto'}`}>
                {/* User question */}
                {chatQuestion && (
                  <div className="flex justify-end">
                    <div className="bg-zinc-900 text-white rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm">{chatQuestion}</p>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-100 rounded-2xl rounded-tl-md px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* AI response */}
                {chatResponse && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                      <div 
                        className="text-sm text-zinc-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: chatResponse
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/###\s?(.*?)(\n|$)/g, '<strong class="text-zinc-900 block mt-3 mb-1">$1</strong>')
                            .replace(/##\s?(.*?)(\n|$)/g, '<strong class="text-zinc-900 text-base block mt-4 mb-2">$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Clear button */}
                {chatResponse && (
                  <div className="flex justify-center">
                    <button 
                      onClick={clearChat}
                      className="text-xs text-zinc-500 hover:text-zinc-700 px-3 py-1"
                    >
                      Clear conversation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className={`flex items-center gap-2 ${chatExpanded ? 'mt-auto pt-4 border-t border-zinc-100' : ''}`}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendQuickChat()}
                placeholder="Ask anything about your portfolio..."
                disabled={chatLoading}
                className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={() => sendQuickChat()}
                disabled={!chatInput.trim() || chatLoading}
                className="shrink-0 w-10 h-10 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl border border-zinc-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-zinc-900">Holdings</h2>
            {isDemo && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">
                Sample Data
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!isDemo && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
            
            {/* Period dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                {performancePeriod === '7d' ? '7 days' : 
                 performancePeriod === '30d' ? '30 days' : 
                 performancePeriod === 'ytd' ? 'Year' : 'Lifetime'}
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showPeriodDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPeriodDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 min-w-[120px]">
                    {[
                      { value: '7d', label: '7 days' },
                      { value: '30d', label: '30 days' },
                      { value: 'ytd', label: 'Year' },
                      { value: 'total', label: 'Lifetime' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPerformancePeriod(option.value as any)
                          setShowPeriodDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 transition-colors flex items-center justify-between ${
                          performancePeriod === option.value ? 'text-zinc-900 font-medium bg-zinc-50' : 'text-zinc-600'
                        }`}
                      >
                        {option.label}
                        {option.value !== 'total' && (
                          <span className="text-[9px] text-zinc-400 ml-2">soon</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* % / $ toggle */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setShowPercent(true)}
                className={`p-1.5 rounded-md transition-colors ${showPercent ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                title="Show percentage"
              >
                <Percent className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowPercent(false)}
                className={`p-1.5 rounded-md transition-colors ${!showPercent ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                title="Show currency"
              >
                <DollarSign className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <HoldingsTable data={displayHoldings} onRefresh={fetchData} showPercent={showPercent} currencySymbol={currencySymbol} />
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeAddModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-zinc-900">Add Holding</h3>
              <button onClick={closeAddModal} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Ticker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Ticker Symbol</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addTicker}
                  onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && searchTicker()}
                  placeholder="AAPL, MSFT, LQQ.PAR..."
                  className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  onClick={searchTicker}
                  disabled={addSearching || !addTicker.trim()}
                  className="px-4 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {addSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                US: AAPL, MSFT • Paris: .PAR • Xetra: .DEX • London: .LON
              </p>
            </div>

            {/* Ticker Info */}
            {addTickerInfo && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-900">{addTickerInfo.symbol}</p>
                    {addTickerInfo.name && <p className="text-xs text-emerald-700">{addTickerInfo.name}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-900">${addTickerInfo.price.toFixed(2)}</p>
                    {addTickerInfo.latestTradingDay && (
                      <p className="text-[10px] text-emerald-600">as of {addTickerInfo.latestTradingDay}</p>
                    )}
                  </div>
                </div>
                {addTickerInfo.previousClose && addTickerInfo.previousClose !== addTickerInfo.price && (
                  <p className="text-xs text-emerald-600 mt-2">Previous close: ${addTickerInfo.previousClose.toFixed(2)}</p>
                )}
              </div>
            )}

            {/* Error */}
            {addError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{addError}</p>
              </div>
            )}

            {/* Quantity & Cost */}
            {addTickerInfo && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    placeholder="10"
                    step="any"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Cost Price (optional)</label>
                  <input
                    type="number"
                    value={addCostPrice}
                    onChange={(e) => setAddCostPrice(e.target.value)}
                    placeholder={`${addTickerInfo.price.toFixed(2)} (current price)`}
                    step="any"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Leave empty to use current price</p>
                </div>

                {/* Preview */}
                {addQuantity && (
                  <div className="bg-zinc-50 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-1">Position Value</p>
                    <p className="text-xl font-semibold text-zinc-900">
                      ${(parseFloat(addQuantity) * addTickerInfo.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeAddModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addHolding}
                disabled={!addTickerInfo || !addQuantity || addSaving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Holding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
