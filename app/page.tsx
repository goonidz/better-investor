'use client'

import Link from 'next/link'
import { ArrowRight, Check, Sparkles, Zap, BarChart3, Brain, FileText, TrendingUp, TrendingDown, Clock, Star, ChevronDown, Target, LineChart, PieChart, AlertCircle, Lightbulb, Shield, Users } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-zinc-900">Better Investor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
              Sign in
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-all hover:scale-105"
            >
              Start now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full mb-6">
            <Brain className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-medium text-violet-700">AI-Powered Portfolio Intelligence</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-zinc-900 leading-[1.1] tracking-tight">
            Invest smarter.<br />
            <span className="text-zinc-400">Not harder.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-zinc-500 leading-relaxed max-w-2xl mx-auto">
            AI analyzes your portfolio in real-time. Get actionable insights, 
            spot risks before they cost you, and discover opportunities you'd miss alone.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-all hover:scale-105 shadow-lg shadow-zinc-900/20"
            >
              Start 7-day free trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-zinc-400">Then $59/mo · Cancel anytime</p>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Setup in 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>AI insights daily</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Personalized to your goals</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Demo Visual */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-200 via-zinc-100 to-emerald-200 rounded-3xl blur-2xl opacity-50"></div>
            
            {/* Dashboard mockup */}
            <div className="relative bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-zinc-400">AI analyzing...</span>
                </div>
              </div>

              {/* Content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Portfolio Value + Chart */}
                <div className="lg:col-span-3 bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Portfolio Value</p>
                      <p className="text-2xl sm:text-3xl font-semibold text-white">$44,815.50</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
                      <TrendingUp className="w-3 h-3" />
                      +19.67%
                    </span>
                  </div>
                  
                  {/* Fake chart */}
                  <div className="h-32 sm:h-40 flex items-end gap-1 mt-4">
                    {[40, 45, 42, 48, 52, 49, 55, 58, 54, 62, 68, 65, 72, 78, 75, 82, 79, 85, 88, 92, 89, 95, 100, 97].map((h, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>Jun</span>
                    <span>Sep</span>
                    <span>Dec</span>
                  </div>
                </div>

                {/* AI Insights Panel */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Main insight */}
                  <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-medium text-violet-200">AI Insight</span>
                      </div>
                      <p className="text-sm leading-relaxed mb-3">
                        <strong>Tech concentration at 67%</strong> — Bonds or REITs can reduce volatility. Historically, 60/40 portfolios had 35% less drawdown.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Education</span>
                        <span className="text-[10px] text-violet-200">Updated 2h ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <PieChart className="w-4 h-4 text-zinc-400" />
                        <span className="text-[10px] text-zinc-500">Diversification</span>
                      </div>
                      <p className="text-lg font-semibold text-white">6/10</p>
                      <p className="text-[10px] text-amber-400">Needs work</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-zinc-400" />
                        <span className="text-[10px] text-zinc-500">Goal Progress</span>
                      </div>
                      <p className="text-lg font-semibold text-white">42%</p>
                      <p className="text-[10px] text-emerald-400">On track</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings row */}
              <div className="mt-4 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white">Top Holdings</span>
                  <span className="text-[10px] text-zinc-500">Live prices</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { symbol: 'AAPL', gain: '+23.1%', positive: true },
                    { symbol: 'MSFT', gain: '+35.3%', positive: true },
                    { symbol: 'VOO', gain: '+14.5%', positive: true },
                    { symbol: 'NVDA', gain: '+10.2%', positive: true },
                  ].map((stock, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-700/30 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-white">{stock.symbol}</span>
                      <span className={`text-xs font-medium ${stock.positive ? 'text-emerald-400' : 'text-red-400'}`}>{stock.gain}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Benefits Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">AI-Powered Advantage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 mb-4">
              Your AI investment analyst.<br />Working 24/7.
            </h2>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Stop second-guessing. Get data-driven insights that help you 
              make confident investment decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 - Spot Risks */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-xl transition-all group flex flex-col">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Spot risks early</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4 flex-1">
                AI monitors your portfolio concentration, sector exposure, and market conditions. See potential risks before they impact you.
              </p>
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-900">Concentration Alert</p>
                    <p className="text-[11px] text-zinc-500">70% in tech — historically volatile sector</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 - Find Opportunities */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-xl transition-all group flex flex-col">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Find opportunities</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4 flex-1">
                AI surfaces market data and patterns you might miss. See when assets hit key technical levels or unusual volume.
              </p>
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-900">Technical Signal</p>
                    <p className="text-[11px] text-zinc-500">VOO crossed below 200-day moving average</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 - Optimize Allocation */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-xl transition-all group flex flex-col">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <LineChart className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Analyze allocation</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4 flex-1">
                See how your allocation compares to model portfolios. Understand the historical risk/return of different strategies.
              </p>
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <PieChart className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-900">Allocation Analysis</p>
                    <p className="text-[11px] text-zinc-500">Adding bonds historically reduced volatility 22%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Avoid Panic Selling */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full mb-4">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-medium text-red-700">Avoid Panic Selling</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 mb-3">
              When fear says "sell everything"
            </h2>
            <p className="text-lg text-zinc-500">
              The AI keeps you rational with data, not opinions.
            </p>
          </div>

          {/* Chat mockup - FULL WIDTH */}
          <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-zinc-800">
              <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <p className="text-base font-medium text-white">Better Investor AI</p>
                <p className="text-sm text-zinc-500">Data over emotions</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex justify-end">
                <div className="bg-zinc-700 rounded-2xl rounded-tr-md px-5 py-4 max-w-[80%]">
                  <p className="text-base text-white">My portfolio is down 15% this month. Should I sell everything before it crashes more?</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-tl-md px-5 py-4 max-w-[95%]">
                  <p className="text-base text-zinc-300 mb-4">I understand the fear. Let me give you some data:</p>
                  <div className="p-4 bg-zinc-700/50 rounded-xl mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-zinc-500">Your drawdown:</span> <span className="text-red-400 font-semibold">-15%</span></div>
                      <div><span className="text-zinc-500">S&P 500 YTD:</span> <span className="text-red-400">-12%</span></div>
                      <div><span className="text-zinc-500">Your cost basis:</span> <span className="text-white">$38,200</span></div>
                      <div><span className="text-zinc-500">Current value:</span> <span className="text-white">$32,470</span></div>
                    </div>
                  </div>
                  <p className="text-base text-zinc-300 mb-3">
                    <strong className="text-white">What research says:</strong>
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-2.5">
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 text-lg">📉</span>
                      <span><strong className="text-zinc-300">Dalbar (2023):</strong> Average investor earns 4.3% less than the market annually by selling during dips</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 text-lg">📈</span>
                      <span><strong className="text-zinc-300">JP Morgan:</strong> Missing the 10 best market days over 20 years cuts your returns in half</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-violet-400 text-lg">📊</span>
                      <span><strong className="text-zinc-300">Fidelity:</strong> The S&P 500 has recovered from every correction within 2 years on average</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-sm text-emerald-300">
                      💡 Selling during a dip locks in your losses. Historically, staying invested has outperformed trying to time the market.
                    </p>
                  </div>
                  <p className="text-xs text-zinc-600 mt-4 pt-3 border-t border-zinc-700">
                    Educational information only — all investment decisions are yours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Avoid FOMO Buying */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Avoid FOMO Buying</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 mb-3">
              When hype says "buy now or miss out"
            </h2>
            <p className="text-lg text-zinc-500">
              The AI shows you what the data actually says.
            </p>
          </div>

          {/* Chat mockup - FULL WIDTH */}
          <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-zinc-800">
              <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <p className="text-base font-medium text-white">Better Investor AI</p>
                <p className="text-sm text-zinc-500">Data over hype</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex justify-end">
                <div className="bg-zinc-700 rounded-2xl rounded-tr-md px-5 py-4 max-w-[80%]">
                  <p className="text-base text-white">Bitcoin just hit $95k! Everyone's buying. Should I put $10k in right now?</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-tl-md px-5 py-4 max-w-[95%]">
                  <p className="text-base text-zinc-300 mb-4">Let me check the current market data:</p>
                  <div className="p-4 bg-zinc-700/50 rounded-xl mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-zinc-500">BTC 30d change:</span> <span className="text-emerald-400 font-semibold">+42%</span></div>
                      <div><span className="text-zinc-500">RSI (14d):</span> <span className="text-red-400 font-semibold">78</span> <span className="text-zinc-600">(overbought)</span></div>
                      <div><span className="text-zinc-500">Fear & Greed:</span> <span className="text-red-400 font-semibold">89</span></div>
                      <div><span className="text-zinc-500">Market sentiment:</span> <span className="text-red-400">Extreme greed</span></div>
                    </div>
                  </div>
                  <p className="text-base text-zinc-300 mb-3">
                    <strong className="text-white">Historical patterns:</strong>
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-2.5">
                    <li className="flex items-start gap-3">
                      <span className="text-amber-400 text-lg">⚡</span>
                      <span><strong className="text-zinc-300">Yale study:</strong> Buying during "extreme greed" periods returned -8% on average over the next 6 months</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-violet-400 text-lg">📊</span>
                      <span><strong className="text-zinc-300">Glassnode:</strong> BTC historically drops 20-40% within 60 days when RSI exceeds 75</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 text-lg">💡</span>
                      <span><strong className="text-zinc-300">Vanguard:</strong> Dollar-cost averaging outperforms lump sum 68% of the time during high volatility</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-amber-300">
                      ⚠️ "Everyone's buying" has historically signaled local tops. Consider spreading your entry over time.
                    </p>
                  </div>
                  <p className="text-xs text-zinc-600 mt-4 pt-3 border-t border-zinc-700">
                    Educational information only — all investment decisions are yours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Deep Analysis */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 rounded-full mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-medium text-violet-700">Portfolio Analysis</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 mb-3">
              Understand your risk like never before
            </h2>
            <p className="text-lg text-zinc-500">
              Compare your allocation to proven strategies with decades of data.
            </p>
          </div>

          {/* Chat mockup - FULL WIDTH */}
          <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-zinc-800">
              <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <p className="text-base font-medium text-white">Better Investor AI</p>
                <p className="text-sm text-zinc-500">Historical analysis</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex justify-end">
                <div className="bg-zinc-700 rounded-2xl rounded-tr-md px-5 py-4 max-w-[80%]">
                  <p className="text-base text-white">How does my portfolio compare to a classic 60/40 allocation?</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-tl-md px-5 py-4 max-w-[95%]">
                  <p className="text-base text-zinc-300 mb-4">Here's your allocation compared to a 60/40 portfolio:</p>
                  <div className="p-4 bg-zinc-700/50 rounded-xl mb-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Stocks</span>
                      <span><span className="text-white font-semibold">You: 95%</span> <span className="text-zinc-500 ml-2">vs 60%</span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Bonds</span>
                      <span><span className="text-white font-semibold">You: 0%</span> <span className="text-zinc-500 ml-2">vs 40%</span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Cash</span>
                      <span><span className="text-white font-semibold">You: 5%</span> <span className="text-zinc-500 ml-2">vs 0%</span></span>
                    </div>
                  </div>
                  <p className="text-base text-zinc-300 mb-3">
                    <strong className="text-white">Historical data (1980-2023):</strong>
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-2.5">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 text-lg">📈</span>
                      <span><strong className="text-zinc-300">100% stocks:</strong> 10.2% annual return, but max drawdown of -51% (2008)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-violet-400 text-lg">⚖️</span>
                      <span><strong className="text-zinc-300">60/40 portfolio:</strong> 8.7% annual return, max drawdown of only -29%</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-zinc-400 text-lg">📊</span>
                      <span><strong className="text-zinc-300">Sharpe ratio:</strong> 60/40 has historically delivered better risk-adjusted returns</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <p className="text-sm text-violet-300">
                      📊 Your portfolio has higher return potential (+1.5%/yr) but 75% more volatility during market downturns.
                    </p>
                  </div>
                  <p className="text-xs text-zinc-600 mt-4 pt-3 border-t border-zinc-700">
                    Educational information only — all investment decisions are yours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Insider Trading */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full mb-4">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Insider Trading Data</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 mb-4">
                See what insiders are doing
              </h2>
              <p className="text-lg text-zinc-500 mb-6">
                Track CEO and executive stock transactions in real-time. 
                When insiders buy their own stock, it often signals confidence.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">Cluster buys detection</p>
                    <p className="text-sm text-zinc-500">Multiple insiders buying = strong signal</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">AI-powered analysis</p>
                    <p className="text-sm text-zinc-500">Daily summary of notable insider activity</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">Updated daily</p>
                    <p className="text-sm text-zinc-500">Fresh data scraped every 24 hours</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Insider trading mockup */}
            <div className="bg-zinc-900 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-700">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-white">Recent Insider Activity</span>
                </div>
                <span className="text-xs text-zinc-500">Updated 2h ago</span>
              </div>
              
              {/* AI Insight */}
              <div className="bg-gradient-to-r from-violet-600/20 to-violet-500/10 rounded-xl p-4 mb-4 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-medium text-violet-300">AI Insight</span>
                </div>
                <p className="text-sm text-zinc-300">
                  <strong className="text-white">3 cluster buys</strong> detected this week in semiconductor sector. 
                  NVDA, AMD, and INTC executives purchased $4.2M combined.
                </p>
              </div>

              {/* Table preview */}
              <div className="space-y-2">
                {[
                  { ticker: 'NVDA', insider: 'Jensen Huang', title: 'CEO', type: 'Buy', amount: '$2.1M', date: 'Jan 18' },
                  { ticker: 'AAPL', insider: 'Tim Cook', title: 'CEO', type: 'Sell', amount: '$5.4M', date: 'Jan 17' },
                  { ticker: 'AMD', insider: 'Lisa Su', title: 'CEO', type: 'Buy', amount: '$1.8M', date: 'Jan 16' },
                  { ticker: 'MSFT', insider: 'Satya Nadella', title: 'CEO', type: 'Buy', amount: '$890K', date: 'Jan 15' },
                ].map((trade, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-zinc-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white w-12">{trade.ticker}</span>
                      <div>
                        <p className="text-xs text-zinc-300">{trade.insider}</p>
                        <p className="text-[10px] text-zinc-500">{trade.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        trade.type === 'Buy' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                      <span className="text-xs text-zinc-400 w-14 text-right">{trade.amount}</span>
                      <span className="text-[10px] text-zinc-500 w-12 text-right">{trade.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-[10px] text-zinc-600 mt-4 text-center">
                Data sourced from SEC filings • Educational purposes only
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Everything included. No hidden fees. Cancel anytime.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-2 bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white text-zinc-900' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all relative ${
                  billingCycle === 'yearly' 
                    ? 'bg-white text-zinc-900' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">2 months free</span>
              </button>
            </div>
          </div>

          {/* Pricing card */}
          <div className="max-w-md mx-auto bg-zinc-800/50 rounded-2xl p-8 border border-zinc-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Popular badge */}
            {billingCycle === 'yearly' && (
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Best Value
                </span>
              </div>
            )}
            
            <div className="relative">
              {/* Price */}
              <div className="mb-6">
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-zinc-500 mb-1">
                    <span className="line-through">$59</span>
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    ${billingCycle === 'monthly' ? '59' : '41'}
                  </span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  {billingCycle === 'yearly' 
                    ? <>$490 billed annually <span className="text-emerald-400">(save $218)</span></> 
                    : 'Billed monthly'
                  }
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited AI insights & analysis',
                  'Real-time market data',
                  'PDF & CSV import (unlimited)',
                  'AI chat assistant',
                  'Portfolio projections',
                  'Insider trading data',
                  'Performance tracking',
                  'Priority support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block w-full text-center px-6 py-4 bg-white text-zinc-900 font-medium rounded-xl hover:bg-zinc-100 transition-all hover:scale-105"
              >
                Start 7-day free trial
              </Link>
              <p className="text-center text-xs text-zinc-500 mt-4">
                No credit card required · Cancel anytime
              </p>

              {/* Value props */}
              <div className="mt-6 pt-6 border-t border-zinc-700/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">2h+</p>
                    <p className="text-xs text-zinc-500">saved per week vs spreadsheets</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">24/7</p>
                    <p className="text-xs text-zinc-500">AI monitoring your portfolio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 mb-4">
              Investors who stopped guessing
            </h2>
            <p className="text-lg text-zinc-500">
              Real stories from people who took control of their portfolio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "I was about to panic sell during the 2024 dip. The AI showed me historical recovery data. I held. My portfolio is now up 23%.",
                name: "Marc D.",
                title: "Long-term investor",
                highlight: "Avoided panic selling",
              },
              {
                quote: "I almost bought Bitcoin at the top because everyone on Twitter was hyped. The AI showed me the RSI was at 82. I waited, bought 30% lower.",
                name: "Sophie L.",
                title: "Crypto investor",
                highlight: "Avoided FOMO buying",
              },
              {
                quote: "I had no idea I was 85% in tech stocks. The AI flagged it immediately. Now I actually understand my risk exposure.",
                name: "Thomas R.",
                title: "Tech worker",
                highlight: "Discovered hidden risk",
              },
              {
                quote: "I used to spend 3 hours every Sunday updating my spreadsheet. Now I just upload my broker PDF. Done in 30 seconds.",
                name: "Julie M.",
                title: "Working mom, 2 kids",
                highlight: "Saved hours every week",
              },
              {
                quote: "Asked the AI 'what happens if Tesla drops 40%?' Got a detailed impact analysis on my whole portfolio. No advisor ever did that.",
                name: "Antoine B.",
                title: "Engineer",
                highlight: "Stress-tested scenarios",
              },
              {
                quote: "The research citations are what sold me. It's not just opinions — it's Vanguard studies, JP Morgan data. I can trust it.",
                name: "Claire P.",
                title: "Former banker",
                highlight: "Data-backed insights",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-zinc-200 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {testimonial.highlight}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed mb-4 flex-1">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium text-zinc-900">{testimonial.name}</p>
                  <p className="text-xs text-zinc-400">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 mb-4">
              Questions? Answers.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What can the AI actually do?",
                a: "The AI analyzes your portfolio composition, identifies risks (like over-concentration), spots opportunities based on market data, and answers any question about your investments. It's personalized to your goals and risk tolerance.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! You get 7 days completely free to test everything. No credit card required to start. If you love it, you can subscribe. If not, no charge.",
              },
              {
                q: "Do you connect to my broker account?",
                a: "No. We never ask for your broker credentials. You simply upload a PDF or CSV statement. Your login details stay with you.",
              },
              {
                q: "Which brokers are supported?",
                a: "Our AI can extract data from most broker statements (Trade Republic, DEGIRO, Interactive Brokers, Fidelity, Schwab, etc.). If it's a standard PDF format, it should work.",
              },
              {
                q: "Does the AI give financial advice?",
                a: "The AI provides educational insights and data-driven analysis, not regulated financial advice. We help you understand your portfolio better and make more informed decisions, but all investment decisions are yours.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel with one click, no questions asked. If you're on annual billing, you'll keep access until the end of your billing period.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-zinc-900">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-zinc-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#8b5cf6,transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#10b981,transparent_50%)]"></div>
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-medium text-zinc-300">AI-Powered Investing</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
                Stop guessing. Start knowing.
              </h2>
              <p className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
                Join investors who make smarter decisions with AI insights.
                Start your free trial today.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 font-medium rounded-xl hover:bg-zinc-100 transition-all hover:scale-105 shadow-xl"
              >
                Start 7-day free trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-6 text-sm text-zinc-500">
                Then $59/mo · Cancel anytime · No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-semibold text-zinc-900">Better Investor</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-zinc-900 transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-zinc-400">© 2026 Better Investor</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
