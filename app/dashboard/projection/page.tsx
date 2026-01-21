'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calculator, Calendar, PiggyBank, Sparkles, History, Save, Trash2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

interface SavedProjection {
  id: string
  name: string | null
  current_age: number
  duration: number
  return_rate: number
  inflation_rate: number
  initial_capital: number
  annual_addition: number
  annual_fees: number
  final_balance: number | null
  final_balance_real: number | null
  monthly_income: number | null
  created_at: string
}

interface ProjectionResult {
  finalBalance: number
  finalBalanceReal: number // Adjusted for inflation (purchasing power)
  totalInterest: number
  monthlyIncome: number
  monthlyIncomeReal: number
  yearlyIncome: number
  lostToFees: number
  balanceWithoutFees: number
  interestPercent: number
  tableData: {
    year: number
    age: number
    yearlyInterest: number
    yearlyFees: number
    monthlyInterest: number
    balance: number
    balanceReal: number
  }[]
  chartData: {
    labels: string[]
    dataInit: number[]
    dataDep: number[]
    dataFees: number[]
    dataInt: number[]
    dataNoFees: number[]
  }
}

export default function ProjectionPage() {
  const [currentAge, setCurrentAge] = useState(30)
  const [duration, setDuration] = useState(20)
  const [returnRate, setReturnRate] = useState(8)
  const [inflationRate, setInflationRate] = useState(0)
  const [initialCapital, setInitialCapital] = useState(50000)
  const [annualAddition, setAnnualAddition] = useState(15000)
  const [annualFees, setAnnualFees] = useState(0.5)
  const [annualFeesInput, setAnnualFeesInput] = useState('0.5')
  const [result, setResult] = useState<ProjectionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedProjections, setSavedProjections] = useState<SavedProjection[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<ChartJS | null>(null)
  const supabase = createClient()

  // Auto-fill with user's portfolio data
  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: portfolios } = await supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', user.id)

        if (portfolios && portfolios.length > 0) {
          const { data: holdings } = await supabase
            .from('holdings')
            .select('*')
            .eq('portfolio_id', portfolios[0].id)

          if (holdings && holdings.length > 0) {
            const totalValue = holdings.reduce((sum, h) => {
              const value = h.current_value || (h.quantity * (h.current_price || h.avg_price))
              return sum + (value || 0)
            }, 0)

            if (totalValue > 0) {
              setInitialCapital(Math.round(totalValue))
            }
          }
        }

        // Load user profile for settings
        const { data: profile } = await supabase
          .from('investment_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          if (profile.investment_horizon === 'short') setDuration(5)
          else if (profile.investment_horizon === 'medium') setDuration(10)
          else if (profile.investment_horizon === 'long') setDuration(25)

          if (profile.risk_tolerance === 'conservative') setReturnRate(5)
          else if (profile.risk_tolerance === 'moderate') setReturnRate(7)
          else if (profile.risk_tolerance === 'aggressive') setReturnRate(10)
        }
      } catch (err) {
        console.error('Failed to load portfolio data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPortfolioData()
  }, [supabase])

  // Load saved projections
  useEffect(() => {
    const loadSavedProjections = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('projections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setSavedProjections(data)
      }
    }

    loadSavedProjections()
  }, [supabase])

  const saveProjection = async () => {
    if (!result) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('projections')
        .insert({
          user_id: user.id,
          current_age: currentAge,
          duration,
          return_rate: returnRate,
          inflation_rate: inflationRate,
          initial_capital: initialCapital,
          annual_addition: annualAddition,
          annual_fees: annualFees,
          final_balance: result.finalBalance,
          final_balance_real: result.finalBalanceReal,
          monthly_income: result.monthlyIncome,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setSavedProjections(prev => [data, ...prev].slice(0, 10))
      }
    } catch (err) {
      console.error('Failed to save projection:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteProjection = async (id: string) => {
    try {
      await supabase.from('projections').delete().eq('id', id)
      setSavedProjections(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Failed to delete projection:', err)
    }
  }

  const loadProjection = (proj: SavedProjection) => {
    setCurrentAge(proj.current_age)
    setDuration(proj.duration)
    setReturnRate(proj.return_rate)
    setInflationRate(proj.inflation_rate)
    setInitialCapital(proj.initial_capital)
    setAnnualAddition(proj.annual_addition)
    setAnnualFees(proj.annual_fees)
    setAnnualFeesInput(proj.annual_fees.toString())
    setShowHistory(false)
    setResult(null) // Clear result, user can click Calculate again
  }

  const calculate = () => {
    const rate = returnRate / 100
    const fees = annualFees / 100
    const inflation = inflationRate / 100
    const currentYear = new Date().getFullYear()

    let currentBal = initialCapital
    let currentBalNoFees = initialCapital
    let currentPrin = initialCapital
    let totalFeesPaid = 0

    const labels: string[] = []
    const dataInit: number[] = []
    const dataDep: number[] = []
    const dataInt: number[] = []
    const dataFees: number[] = []
    const dataNoFees: number[] = []
    const tableData: ProjectionResult['tableData'] = []

    for (let i = 0; i <= duration; i++) {
      const year = currentYear + i
      const age = currentAge + i
      labels.push(year.toString())

      let yearlyInterest = 0
      let yearlyFees = 0

      if (i > 0) {
        yearlyInterest = currentBal - (currentBal / (1 + rate))
        yearlyFees = currentBal * fees
        totalFeesPaid += yearlyFees
      }
      const monthlyInterest = yearlyInterest / 12

      // Calculate real value (purchasing power adjusted for inflation)
      const inflationFactor = Math.pow(1 + inflation, i)
      const balanceReal = currentBal / inflationFactor

      dataInit.push(initialCapital)
      dataDep.push(currentPrin - initialCapital)
      dataFees.push(totalFeesPaid)
      dataInt.push(Math.max(0, currentBal - currentPrin))
      dataNoFees.push(currentBalNoFees)

      tableData.push({
        year,
        age,
        yearlyInterest,
        yearlyFees,
        monthlyInterest,
        balance: currentBal,
        balanceReal
      })

      if (i < duration) {
        currentBal = (currentBal + annualAddition) * (1 + rate) * (1 - fees)
        currentBalNoFees = (currentBalNoFees + annualAddition) * (1 + rate)
        currentPrin += annualAddition
      }
    }

    const lostToFees = currentBalNoFees - currentBal
    const totalInterest = currentBal - currentPrin
    const annualInc = currentBal * 0.04
    const monthlyInc = annualInc / 12
    const interestPct = Math.round((totalInterest / currentBal) * 100)

    // Calculate real (inflation-adjusted) values
    const inflationFactor = Math.pow(1 + inflation, duration)
    const finalBalanceReal = currentBal / inflationFactor
    const monthlyIncomeReal = monthlyInc / inflationFactor

    setResult({
      finalBalance: currentBal,
      finalBalanceReal,
      totalInterest,
      monthlyIncome: monthlyInc,
      monthlyIncomeReal,
      yearlyIncome: annualInc,
      lostToFees,
      balanceWithoutFees: currentBalNoFees,
      interestPercent: interestPct,
      tableData,
      chartData: {
        labels,
        dataInit,
        dataDep,
        dataFees,
        dataInt,
        dataNoFees,
      }
    })
  }

  // Create chart when result changes
  useEffect(() => {
    if (!result || !chartRef.current) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    const { labels, dataInit, dataDep, dataFees, dataInt, dataNoFees } = result.chartData

    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { 
            label: 'Initial', 
            data: dataInit, 
            backgroundColor: '#e4e4e7', 
            fill: true, 
            pointRadius: 0,
            // @ts-ignore
            stack: '1' 
          },
          { 
            label: 'Deposits', 
            data: dataDep, 
            backgroundColor: '#a1a1aa', 
            fill: true, 
            pointRadius: 0,
            // @ts-ignore
            stack: '1' 
          },
          { 
            label: 'Fees Lost', 
            data: dataFees, 
            backgroundColor: '#ef4444', 
            fill: true, 
            pointRadius: 0,
            // @ts-ignore
            stack: '1' 
          },
          { 
            label: 'Interest', 
            data: dataInt, 
            backgroundColor: '#18181b', 
            fill: true, 
            pointRadius: 0,
            // @ts-ignore
            stack: '1' 
          },
          { 
            label: 'Without Fees', 
            data: dataNoFees, 
            borderColor: '#10b981', 
            borderWidth: 2, 
            borderDash: [6, 4], 
            fill: false, 
            pointRadius: 0,
            // @ts-ignore
            stack: false 
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            enabled: true,
            padding: 15,
            backgroundColor: '#18181b',
            callbacks: {
              title: (items) => `Age ${currentAge + items[0].dataIndex}`,
              label: (ctx) => ` ${ctx.dataset.label}: ${fmt.format(ctx.raw as number)}`,
              footer: (items) => {
                const total = (items[0].raw as number) + (items[1].raw as number) + (items[3].raw as number)
                return ' NET BALANCE: ' + fmt.format(total)
              }
            }
          }
        },
        scales: {
          x: { display: true, stacked: true, grid: { display: false } },
          y: { 
            display: true, 
            stacked: true, 
            ticks: { 
              callback: (v) => '$' + (Number(v) / 1000).toFixed(0) + 'k' 
            } 
          }
        }
      }
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [result, currentAge])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900">Projection</h1>
          <p className="text-sm text-zinc-500 mt-1">Simulate your portfolio growth over time</p>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={saveProjection}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              showHistory 
                ? 'text-white bg-zinc-900' 
                : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h3 className="text-sm font-medium text-zinc-900 mb-3">Saved Projections</h3>
          {savedProjections.length === 0 ? (
            <p className="text-sm text-zinc-500">No saved projections yet</p>
          ) : (
            <div className="space-y-2">
              {savedProjections.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <button
                    onClick={() => loadProjection(proj)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-zinc-900">
                      {fmt.format(proj.initial_capital)} → {proj.final_balance ? fmt.format(proj.final_balance) : '?'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {proj.duration}y • {proj.return_rate}% return • {new Date(proj.created_at).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteProjection(proj.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-fill notice */}
      {initialCapital > 50000 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-sm text-emerald-800">
            <Sparkles className="w-4 h-4 inline mr-2" />
            Initial capital auto-filled with your current portfolio value
          </p>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Current Age</label>
                <input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Duration (years)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Return (%)</label>
                <input
                  type="number"
                  value={returnRate}
                  onChange={(e) => setReturnRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Inflation (%)</label>
                <input
                  type="number"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <PiggyBank className="w-4 h-4" />
              Strategy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Initial Capital ($)</label>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Annual Addition ($)</label>
                <input
                  type="number"
                  value={annualAddition}
                  onChange={(e) => setAnnualAddition(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Annual Fees (%)</label>
              <input
                type="text"
                value={annualFeesInput}
                onChange={(e) => {
                  const value = e.target.value.replace(',', '.')
                  setAnnualFeesInput(value)
                  const parsed = parseFloat(value)
                  if (!isNaN(parsed)) setAnnualFees(parsed)
                }}
                onBlur={() => {
                  // Clean up on blur
                  const parsed = parseFloat(annualFeesInput)
                  if (isNaN(parsed) || annualFeesInput === '') {
                    setAnnualFees(0)
                    setAnnualFeesInput('0')
                  }
                }}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <p className="text-xs text-zinc-400 mt-1">Typical: 0.03% (index) - 1% (active)</p>
            </div>
          </div>
        </div>

        <button
          onClick={calculate}
          className="w-full mt-6 py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          Calculate Projection
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 sm:p-6 text-center">
            <p className="text-sm sm:text-lg text-zinc-700 leading-relaxed">
              In <span className="font-bold text-zinc-900">{duration} years</span>, you will reach{' '}
              <span className="font-bold text-zinc-900">{fmt.format(result.finalBalance)}</span>
              {inflationRate > 0 && (
                <span className="text-zinc-500 text-xs sm:text-base"> ({fmt.format(result.finalBalanceReal)} real)</span>
              )}.
              Passive income:{' '}
              <span className="font-bold text-zinc-900">{fmt.format(result.monthlyIncome)}/mo</span>.
              {result.lostToFees > 0 && (
                <>
                  {' '}<span className="text-red-600 font-bold">
                    Fees: {fmt.format(result.lostToFees)}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
            <div className="h-[300px] sm:h-[400px] relative">
              <canvas ref={chartRef} id="projectionChart"></canvas>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-5 text-center">
              <p className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1 sm:mb-2">Final Net Worth</p>
              <p className="text-lg sm:text-2xl font-bold text-zinc-900">{fmt.format(result.finalBalance)}</p>
              {inflationRate > 0 && (
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">{fmt.format(result.finalBalanceReal)} real</p>
              )}
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 sm:p-5 text-center">
              <p className="text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 sm:mb-2">Compound Interest</p>
              <p className="text-lg sm:text-2xl font-bold text-white">{fmt.format(result.totalInterest)}</p>
            </div>
            <div className="bg-emerald-500 rounded-xl p-3 sm:p-5 text-center">
              <p className="text-[10px] sm:text-xs font-medium text-emerald-100 uppercase tracking-wider mb-1 sm:mb-2">Monthly Income</p>
              <p className="text-lg sm:text-2xl font-bold text-white">{fmt.format(result.monthlyIncome)}</p>
              {inflationRate > 0 && (
                <p className="text-[10px] sm:text-xs text-emerald-200 mt-1">{fmt.format(result.monthlyIncomeReal)} real</p>
              )}
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 sm:p-5 text-center">
              <p className="text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 sm:mb-2">Yearly Income</p>
              <p className="text-lg sm:text-2xl font-bold text-white">{fmt.format(result.yearlyIncome)}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100">
              <h3 className="text-sm font-medium text-zinc-900">Annual Growth Tracker</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Year</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Interest</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Balance</th>
                    {inflationRate > 0 && (
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Real</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {result.tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-zinc-900">
                        {row.year} <span className="text-zinc-400 font-normal">({row.age})</span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-center">
                        <span className="text-emerald-600 font-semibold">+{fmt.format(row.yearlyInterest)}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-right font-bold text-zinc-900">{fmt.format(row.balance)}</td>
                      {inflationRate > 0 && (
                        <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-right text-zinc-500">{fmt.format(row.balanceReal)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
