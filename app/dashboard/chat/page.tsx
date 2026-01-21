'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, AlertTriangle, Bot, User, Loader2, Plus, MessageSquare, ChevronRight } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface Credits {
  used: number
  limit: number
  remaining: number
  percentage_used: string
  reset_date?: string
  warning?: string | null
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation)
    } else {
      setMessages([])
    }
  }, [activeConversation])

  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      const res = await fetch('/api/chat')
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
      if (data.credits) {
        setCredits(data.credits)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat?conversation_id=${conversationId}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
      if (data.credits) {
        setCredits(data.credits)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const startNewConversation = () => {
    setActiveConversation(null)
    setMessages([])
    setError(null)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }])

    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          conversation_id: activeConversation
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.credits_exhausted) {
          setError(`Monthly limit reached. Credits reset on ${new Date(data.reset_date).toLocaleDateString()}.`)
        } else {
          throw new Error(data.error || 'Failed to send message')
        }
        setMessages(prev => prev.filter(m => m.id !== tempId))
        return
      }

      // Set active conversation if new
      if (data.conversation_id && !activeConversation) {
        setActiveConversation(data.conversation_id)
        // Reload conversations list
        loadConversations()
      }

      // Add assistant response
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString()
      }])

      if (data.credits) {
        setCredits(data.credits)
      }

    } catch (err: any) {
      setError(err.message)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (convId: string) => {
    if (!confirm('Delete this conversation?')) return

    try {
      await fetch(`/api/chat?conversation_id=${convId}`, { method: 'DELETE' })
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeConversation === convId) {
        startNewConversation()
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (content: string) => {
    return content
      .replace(/###\s?(.*?)(\n|$)/g, '<strong class="text-base block mt-3 mb-1">$1</strong>')
      .replace(/##\s?(.*?)(\n|$)/g, '<strong class="text-lg block mt-4 mb-2">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\d+\.\s/gm, '• ')
      .replace(/^-\s/gm, '• ')
      .replace(/\n/g, '<br/>')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const creditPercentage = credits ? parseFloat(credits.percentage_used) : 0
  const isLowCredits = creditPercentage >= 80
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Mobile Toggle */}
      <div className="lg:hidden flex items-center justify-between bg-white rounded-xl border border-zinc-200 p-3">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600"
        >
          <MessageSquare className="w-4 h-4" />
          {showSidebar ? 'Hide conversations' : 'Conversations'}
          <ChevronRight className={`w-4 h-4 transition-transform ${showSidebar ? 'rotate-90' : ''}`} />
        </button>
        <button
          onClick={startNewConversation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Sidebar - Conversations */}
      <div className={`${showSidebar ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden max-h-64 lg:max-h-none`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-100">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New conversation
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative rounded-lg transition-colors ${
                    activeConversation === conv.id 
                      ? 'bg-zinc-100' 
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  <button
                    onClick={() => setActiveConversation(conv.id)}
                    className="w-full text-left px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-zinc-900 truncate pr-6">
                      {conv.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {formatDate(conv.updated_at)}
                    </p>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credits */}
        {credits && (
          <div className="p-3 border-t border-zinc-100 bg-zinc-50">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-500">Credits</span>
              <span className={`font-medium ${isLowCredits ? 'text-amber-600' : 'text-zinc-600'}`}>
                {credits.remaining.toLocaleString()} / {credits.limit.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  creditPercentage >= 90 ? 'bg-red-500' : 
                  creditPercentage >= 80 ? 'bg-amber-500' : 
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(creditPercentage, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 text-center">
              Resets on the 1st of each month
            </p>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-5">
                <span className="text-2xl font-bold text-white">B</span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">Better Investor Assistant</h2>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                I have access to your portfolio and investor profile. Ask me anything about your investments, market concepts, or financial education.
              </p>
              <p className="text-xs text-zinc-400 mb-8">
                You have <span className="font-medium">{credits?.limit.toLocaleString() || '2,500'} credits</span> per month. Credits reset on the 1st.
              </p>
              <div className="w-full space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Suggestions</p>
                <button 
                  onClick={() => setInput("How diversified is my portfolio?")}
                  className="block w-full text-left px-4 py-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors text-sm text-zinc-700"
                >
                  <ChevronRight className="w-4 h-4 inline mr-2 text-zinc-400" />
                  How diversified is my portfolio?
                </button>
                <button 
                  onClick={() => setInput("Explain the difference between ETFs and mutual funds")}
                  className="block w-full text-left px-4 py-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors text-sm text-zinc-700"
                >
                  <ChevronRight className="w-4 h-4 inline mr-2 text-zinc-400" />
                  Explain the difference between ETFs and mutual funds
                </button>
                <button 
                  onClick={() => setInput("What sectors am I most exposed to?")}
                  className="block w-full text-left px-4 py-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors text-sm text-zinc-700"
                >
                  <ChevronRight className="w-4 h-4 inline mr-2 text-zinc-400" />
                  What sectors am I most exposed to?
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-zinc-900' : 'bg-zinc-100'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-zinc-900 text-white' 
                      : 'bg-zinc-50 text-zinc-800 border border-zinc-100'
                  }`}>
                    <div 
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio..."
              disabled={loading || (credits && parseFloat(credits.percentage_used) >= 100)}
              rows={1}
              className="flex-1 resize-none px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:opacity-50 max-h-32"
              style={{ minHeight: '48px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || (credits && parseFloat(credits.percentage_used) >= 100)}
              className="shrink-0 w-12 h-12 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-3 text-center">
            Educational content only. This is not financial advice.
          </p>
        </div>
      </div>
    </div>
  )
}
