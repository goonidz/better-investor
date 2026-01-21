'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, ChevronLeft } from 'lucide-react'

interface Conversation {
  id: string
  subject: string
  status: string
  updated_at: string
  unread_count: number
  last_message?: {
    content: string
    sender_type: string
  }
}

interface Message {
  id: string
  sender_type: 'user' | 'admin'
  content: string
  created_at: string
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  useEffect(() => {
    // Check for unread messages periodically
    const checkUnread = async () => {
      try {
        const res = await fetch('/api/support/conversations')
        const data = await res.json()
        const total = data.conversations?.reduce((sum: number, c: Conversation) => sum + (c.unread_count || 0), 0) || 0
        setUnreadCount(total)
      } catch (err) {
        // Ignore errors for background check
      }
    }
    
    checkUnread()
    const interval = setInterval(checkUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConversation && view === 'chat') {
      loadMessages(selectedConversation.id)
      const interval = setInterval(() => loadMessages(selectedConversation.id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation?.id, view])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support/conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/support/conversations/${conversationId}`)
      const data = await res.json()
      setMessages(data.messages || [])
      // Update unread count
      setUnreadCount(prev => {
        const conv = conversations.find(c => c.id === conversationId)
        return Math.max(0, prev - (conv?.unread_count || 0))
      })
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const createConversation = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/support/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject || 'Support Request',
          message: newMessage,
        }),
      })
      const data = await res.json()
      setNewMessage('')
      setNewSubject('')
      setSelectedConversation(data.conversation)
      setView('chat')
      await loadConversations()
    } catch (err) {
      console.error('Error creating conversation:', err)
    } finally {
      setSending(false)
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
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const openConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setView('chat')
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 transition-all hover:scale-105 flex items-center justify-center z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <button
                  onClick={() => { setView('list'); setSelectedConversation(null) }}
                  className="p-1 hover:bg-zinc-800 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="font-semibold">
                  {view === 'list' && 'Support'}
                  {view === 'new' && 'New Message'}
                  {view === 'chat' && (selectedConversation?.subject || 'Chat')}
                </h3>
                {view === 'list' && (
                  <p className="text-xs text-zinc-400">We typically reply within minutes</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-zinc-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                </div>
              ) : (
                <>
                  {/* New conversation button */}
                  <button
                    onClick={() => setView('new')}
                    className="w-full px-4 py-4 text-left border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">Start a conversation</p>
                        <p className="text-sm text-zinc-500">We're here to help</p>
                      </div>
                    </div>
                  </button>

                  {/* Existing conversations */}
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className="w-full px-4 py-3 text-left border-b border-zinc-50 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-zinc-900 text-sm">{conv.subject}</span>
                        {conv.unread_count > 0 && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">
                        {conv.last_message?.sender_type === 'admin' && '👤 '}
                        {conv.last_message?.content || 'No messages'}
                      </p>
                    </button>
                  ))}

                  {conversations.length === 0 && (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      No conversations yet
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {view === 'new' && (
            <div className="flex-1 flex flex-col p-4">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="What can we help with?"
                    className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-zinc-700">Message</label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Describe your issue..."
                    rows={6}
                    className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  />
                </div>
              </div>
              <button
                onClick={createConversation}
                disabled={!newMessage.trim() || sending}
                className="w-full mt-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </div>
          )}

          {view === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                        msg.sender_type === 'user'
                          ? 'bg-zinc-900 text-white rounded-br-md'
                          : 'bg-zinc-100 text-zinc-900 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
