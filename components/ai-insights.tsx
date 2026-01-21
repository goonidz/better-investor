'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, BookOpen, RefreshCw, X, ChevronRight, Newspaper, Check, User, History } from 'lucide-react'
import { Holding } from './holdings-table'

interface Insight {
  type: 'news' | 'education' | 'risk'
  title: string
  description: string
  ticker: string | null
}

interface Study {
  title: string
  authors: string
  year: string
  what: string
  finding: string
  relevance: string
}

interface NewsItem {
  holding_name: string
  ticker: string
  headline: string
  summary: string
  date: string
  source: string
  impact: string
}

interface InsightsData {
  id?: string
  summary: string
  profile_note?: string
  market_context: string
  diversification_score: number // renamed from portfolio_fit_score in API
  diversification_feedback: string // renamed from portfolio_fit_feedback in API
  educational_note: string
  scientific_studies?: Study[]
  recent_news?: NewsItem[]
  insights: Insight[]
  created_at?: string
}

interface InvestmentProfile {
  investment_horizon: string
  risk_tolerance: string
  investment_goal: string
  experience_level: string
}

interface AIInsightsProps {
  holdings: Holding[]
}

const QUESTIONS = [
  {
    id: 'investment_horizon',
    question: 'Investment horizon',
    options: [
      { value: 'short', label: 'Short term', description: '< 2 years' },
      { value: 'medium', label: 'Medium term', description: '2-7 years' },
      { value: 'long', label: 'Long term', description: '7+ years' },
    ]
  },
  {
    id: 'risk_tolerance',
    question: 'Risk tolerance',
    options: [
      { value: 'conservative', label: 'Conservative', description: 'Preserve capital' },
      { value: 'moderate', label: 'Moderate', description: 'Balanced approach' },
      { value: 'aggressive', label: 'Aggressive', description: 'Maximize growth' },
    ]
  },
  {
    id: 'investment_goal',
    question: 'Primary goal',
    options: [
      { value: 'retirement', label: 'Retirement', description: 'Long-term savings' },
      { value: 'growth', label: 'Growth', description: 'Build wealth' },
      { value: 'income', label: 'Income', description: 'Generate cash flow' },
      { value: 'preservation', label: 'Preservation', description: 'Protect assets' },
    ]
  },
  {
    id: 'experience_level',
    question: 'Experience level',
    options: [
      { value: 'beginner', label: 'Beginner', description: '< 2 years investing' },
      { value: 'intermediate', label: 'Intermediate', description: '2-5 years' },
      { value: 'advanced', label: 'Advanced', description: '5+ years' },
    ]
  },
]

export function AIInsights({ holdings }: AIInsightsProps) {
  const [allInsights, setAllInsights] = useState<InsightsData[]>([])
  const [selectedInsight, setSelectedInsight] = useState<InsightsData | null>(null)
  const [profile, setProfile] = useState<InvestmentProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your portfolio...')
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [tempProfile, setTempProfile] = useState<Partial<InvestmentProfile>>({})

  // Rotating loading messages
  useEffect(() => {
    if (!loading) return
    
    const messages = [
      'Analyzing your portfolio...',
      'Searching recent market news...',
      'Finding relevant research studies...',
      'Evaluating portfolio composition...',
      'Personalizing insights for you...',
      'Cross-referencing academic data...',
      'Assessing risk alignment...',
      'Almost done...'
    ]
    
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % messages.length
      setLoadingMessage(messages[index])
    }, 2500)
    
    return () => clearInterval(interval)
  }, [loading])

  // Load all insights and profile on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [insightsRes, profileRes] = await Promise.all([
          fetch('/api/insights'),
          fetch('/api/profile')
        ])
        const insightsData = await insightsRes.json()
        const profileData = await profileRes.json()
        
        if (insightsData.data && Array.isArray(insightsData.data)) {
          setAllInsights(insightsData.data)
          if (insightsData.data.length > 0) {
            setSelectedInsight(insightsData.data[0]) // Most recent
          }
        }
        if (profileData.data) setProfile(profileData.data)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [])

  const handleGenerateClick = () => {
    if (profile) {
      setTempProfile(profile)
      generateWithProfile(profile)
    } else {
      setShowQuestionnaire(true)
    }
  }

  const handleEditProfile = () => {
    if (profile) {
      setTempProfile(profile)
    }
    setShowQuestionnaire(true)
  }

  const generateWithProfile = async (profileData: InvestmentProfile) => {
    if (holdings.length === 0) {
      setError('Add holdings first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings, profile: profileData })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate')
      }

      // Reload all insights to get the new one
      const insightsRes = await fetch('/api/insights')
      const insightsData = await insightsRes.json()
      
      if (insightsData.data && Array.isArray(insightsData.data)) {
        setAllInsights(insightsData.data)
        setSelectedInsight(insightsData.data[0]) // The new one
      }

      setShowQuestionnaire(false)
      setIsOpen(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSelect = (questionId: string, value: string) => {
    setTempProfile(prev => ({ ...prev, [questionId]: value }))
  }

  const isProfileComplete = () => {
    return QUESTIONS.every(q => tempProfile[q.id as keyof InvestmentProfile])
  }

  const saveProfileAndGenerate = async () => {
    if (!isProfileComplete()) return
    
    setLoading(true)
    setError(null)

    try {
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempProfile)
      })
      const profileResult = await profileRes.json()
      if (profileResult.data) {
        setProfile(profileResult.data)
      }

      await generateWithProfile(tempProfile as InvestmentProfile)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper className="w-4 h-4 text-zinc-500" />
      case 'risk': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'education': return <BookOpen className="w-4 h-4 text-zinc-500" />
      default: return <BookOpen className="w-4 h-4 text-zinc-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const getProfileLabel = (questionId: string, value: string) => {
    const question = QUESTIONS.find(q => q.id === questionId)
    const option = question?.options.find(o => o.value === value)
    return option?.label || value
  }

  // Loading state
  if (loadingInitial) {
    return (
      <div className="bg-zinc-900 rounded-xl p-5">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
          Loading...
        </div>
      </div>
    )
  }

  // No data yet - show generate button
  if (!selectedInsight) {
    return (
      <>
        <div className="bg-zinc-900 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-white">AI Insights</span>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Get educational analysis based on your investor profile.
          </p>
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <button 
            onClick={handleGenerateClick}
            disabled={holdings.length === 0}
            className="w-full py-2 text-sm font-medium text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Generate analysis
          </button>
        </div>

        {showQuestionnaire && (
          <QuestionnaireModal
            tempProfile={tempProfile}
            profile={profile}
            loading={loading}
            onSelect={handleProfileSelect}
            onSubmit={saveProfileAndGenerate}
            onClose={() => setShowQuestionnaire(false)}
            isComplete={isProfileComplete()}
          />
        )}
      </>
    )
  }

  // Has data - show in black card
  return (
    <>
      <div className="bg-zinc-900 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-white">AI Insights</span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* History list */}
        {showHistory && allInsights.length > 1 && (
          <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
            {allInsights.map((insight) => (
              <button
                key={insight.id}
                onClick={() => {
                  setSelectedInsight(insight)
                  setShowHistory(false)
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  insight.id === selectedInsight.id 
                    ? 'bg-zinc-800 border border-zinc-700' 
                    : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">
                    {insight.created_at && formatDateShort(insight.created_at)}
                  </span>
                  <span className={`text-xs font-bold ${
                    insight.diversification_score >= 7 ? 'text-emerald-400' : 
                    insight.diversification_score >= 4 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {insight.diversification_score}/10
                  </span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2">{insight.summary}</p>
              </button>
            ))}
          </div>
        )}

        {/* Current insight preview */}
        <div 
          className="cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <p className="text-sm text-zinc-300 mb-3">{selectedInsight.summary}</p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">Portfolio Fit</span>
              <span className={`text-xs font-bold ${
                selectedInsight.diversification_score >= 7 ? 'text-emerald-400' : 
                selectedInsight.diversification_score >= 4 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {selectedInsight.diversification_score}/10
              </span>
            </div>
            {selectedInsight.created_at && (
              <span className="text-xs text-zinc-500">{formatDateShort(selectedInsight.created_at)}</span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs">
            <span>View details</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <button 
            onClick={handleGenerateClick}
            disabled={loading || holdings.length === 0}
            className="w-full py-2 text-sm font-medium text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                New analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Questionnaire Modal */}
      {showQuestionnaire && (
        <QuestionnaireModal
          tempProfile={tempProfile}
          profile={profile}
          loading={loading}
          onSelect={handleProfileSelect}
          onSubmit={saveProfileAndGenerate}
          onClose={() => setShowQuestionnaire(false)}
          isComplete={isProfileComplete()}
        />
      )}

      {/* Insights Detail Modal */}
      {isOpen && selectedInsight && (
        <InsightDetailModal
          data={selectedInsight}
          profile={profile}
          loading={loading}
          onRefresh={handleGenerateClick}
          onEditProfile={handleEditProfile}
          onClose={() => setIsOpen(false)}
          getIcon={getIcon}
          formatDate={formatDate}
          getProfileLabel={getProfileLabel}
        />
      )}
    </>
  )
}

// Questionnaire Modal Component
function QuestionnaireModal({ 
  tempProfile, 
  profile,
  loading, 
  onSelect, 
  onSubmit, 
  onClose,
  isComplete 
}: {
  tempProfile: Partial<InvestmentProfile>
  profile: InvestmentProfile | null
  loading: boolean
  onSelect: (questionId: string, value: string) => void
  onSubmit: () => void
  onClose: () => void
  isComplete: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="font-semibold text-zinc-900">Your investor profile</h2>
            <p className="text-xs text-zinc-500">
              {profile ? 'Review or update your profile' : 'Help us personalize your analysis'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {QUESTIONS.map((question) => (
            <div key={question.id}>
              <p className="text-sm font-medium text-zinc-900 mb-3">{question.question}</p>
              <div className="grid grid-cols-1 gap-2">
                {question.options.map((option) => {
                  const isSelected = tempProfile[question.id as keyof InvestmentProfile] === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => onSelect(question.id, option.value)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? 'border-zinc-900 bg-zinc-50' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-zinc-500">{option.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <button
            onClick={onSubmit}
            disabled={!isComplete || loading}
            className="w-full py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate analysis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Insight Detail Modal
function InsightDetailModal({
  data,
  profile,
  loading,
  onRefresh,
  onEditProfile,
  onClose,
  getIcon,
  formatDate,
  getProfileLabel
}: {
  data: InsightsData
  profile: InvestmentProfile | null
  loading: boolean
  onRefresh: () => void
  onEditProfile: () => void
  onClose: () => void
  getIcon: (type: string) => JSX.Element
  formatDate: (date: string) => string
  getProfileLabel: (questionId: string, value: string) => string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900">Portfolio Analysis</h2>
              <p className="text-xs text-zinc-500">
                {data.created_at ? formatDate(data.created_at) : 'Just now'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditProfile}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <User className="w-3 h-3" />
              Edit profile
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(85vh - 70px)' }}>
          
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Educational content only.</strong> This analysis is for informational purposes and does not constitute financial advice. Always consult a qualified professional before making investment decisions.
            </p>
          </div>

          {/* Personalization note */}
          {data.profile_note && (
            <div className="bg-zinc-900 text-white rounded-xl px-5 py-4">
              <p className="text-sm leading-relaxed">{data.profile_note}</p>
            </div>
          )}

          {/* Profile Summary */}
          {profile && (
            <div className="border border-zinc-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Your Profile</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg">{getProfileLabel('investment_horizon', profile.investment_horizon)}</span>
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg">{getProfileLabel('risk_tolerance', profile.risk_tolerance)}</span>
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg">{getProfileLabel('investment_goal', profile.investment_goal)}</span>
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg">{getProfileLabel('experience_level', profile.experience_level)}</span>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="border-l-4 border-zinc-900 pl-4 py-2">
            <p className="text-base font-medium text-zinc-900 leading-relaxed">{data.summary}</p>
          </div>

          {/* Score + Note */}
          <div className="grid grid-cols-2 gap-5">
            <div className="border border-zinc-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Portfolio Fit</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-bold ${data.diversification_score >= 7 ? 'text-emerald-600' : data.diversification_score >= 4 ? 'text-amber-500' : 'text-red-500'}`}>
                  {data.diversification_score}
                </span>
                <span className="text-lg text-zinc-400 font-medium">/10</span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {data.diversification_feedback}
              </p>
            </div>

            <div className="border border-zinc-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Educational Note</p>
              <p className="text-sm text-zinc-600 leading-relaxed pt-2">
                {data.educational_note}
              </p>
            </div>
          </div>

          {/* Market Context */}
          <div className="border border-zinc-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Market Context</p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {data.market_context}
            </p>
          </div>

          {/* Recent News */}
          {data.recent_news && data.recent_news.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recent News</p>
              <div className="space-y-3">
                {data.recent_news.map((news, i) => (
                  <div key={i} className="border border-zinc-200 rounded-xl p-4 bg-gradient-to-br from-white to-zinc-50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                          {news.ticker}
                        </span>
                        <span className="text-xs text-zinc-500">{news.holding_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-400">{news.source}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{news.date}</p>
                      </div>
                    </div>
                    <h4 className="font-semibold text-zinc-900 mb-2 leading-snug">{news.headline}</h4>
                    <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                      {news.summary}
                    </p>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Impact</p>
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {news.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Key Insights</p>
            <div className="space-y-3">
              {data.insights.map((insight, i) => (
                <div key={i} className="border border-zinc-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-1">
                      {getIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-zinc-900">{insight.title}</p>
                        {insight.ticker && (
                          <span className="text-[10px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                            {insight.ticker}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Studies */}
          {data.scientific_studies && data.scientific_studies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Research & Studies</p>
              <div className="space-y-4">
                {data.scientific_studies.map((study, i) => (
                  <div key={i} className="border border-blue-200 bg-blue-50/50 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 text-base">{study.title}</p>
                        <p className="text-xs text-zinc-500 mt-1 font-medium">
                          {study.authors}{study.year && study.year !== 'N/A' ? ` · ${study.year}` : ''}
                        </p>
                        
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-zinc-600 leading-relaxed">
                            {study.what}
                          </p>
                          
                          <div className="bg-white/80 rounded-lg p-3">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Key Finding</p>
                            <p className="text-sm text-zinc-700 leading-relaxed">
                              {study.finding}
                            </p>
                          </div>
                          
                          <div className="bg-blue-100/50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Why It Matters For You</p>
                            <p className="text-sm text-blue-900 leading-relaxed">
                              {study.relevance}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-zinc-200 pt-4">
            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              Generated by AI using public market data. Not financial advice. Do your own research.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
