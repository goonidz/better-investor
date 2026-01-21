'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Send, CheckCircle, Clock, MessageSquare, X } from 'lucide-react'

interface Conversation {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'pending' | 'closed'
  created_at: string
  updated_at: string
  unread_count: number
  last_message?: {
    content: string
    sender_type: string
    created_at: string
  }
}

interface Message {
  id: string
  sender_id: string
  sender_type: 'user' | 'admin'
  content: string
  created_at: string
  read_at: string | null
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    // Poll for new conversations every 10 seconds
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [statusFilter])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => loadMessages(selectedConversation.id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      
      const res = await fetch(`/api/support/conversations?${params}`)
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/support/conversations/${conversationId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      await fetch(`/api/support/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })
      setNewMessage('')
      await loadMessages(selectedConversation.id)
      await loadConversations()
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (status: string) => {
    if (!selectedConversation) return

    try {
      await fetch(`/api/support/conversations/${selectedConversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await loadConversations()
      setSelectedConversation(prev => prev ? { ...prev, status: status as any } : null)
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Open</span>
      case 'pending':
        return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Pending</span>
      case 'closed':
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Closed</span>
      default:
        return null
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Support</h1>
          <p className="text-zinc-500">Manage customer support conversations</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-zinc-200 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100%-5rem)]">
        {/* Conversations List */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <h2 className="font-semibold text-zinc-900 text-sm">Conversations</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No conversations
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full px-4 py-3 text-left border-b border-zinc-50 hover:bg-zinc-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-zinc-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-900 truncate flex-1">
                      {conv.subject || 'Support Request'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate mb-1">
                    {conv.last_message?.content || 'No messages'}
                  </p>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(conv.status)}
                    <span className="text-xs text-zinc-400">{formatTime(conv.updated_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-2 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">{selectedConversation.subject}</h3>
                  <p className="text-xs text-zinc-500 font-mono">{selectedConversation.user_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.status !== 'closed' && (
                    <button
                      onClick={() => updateStatus('closed')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Close
                    </button>
                  )}
                  {selectedConversation.status === 'closed' && (
                    <button
                      onClick={() => updateStatus('open')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender_type === 'admin'
                            ? 'bg-zinc-900 text-white rounded-br-md'
                            : 'bg-zinc-100 text-zinc-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-zinc-100">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
