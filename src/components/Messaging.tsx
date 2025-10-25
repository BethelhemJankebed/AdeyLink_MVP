import React, { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  text: string
  timestamp: string
  read: boolean
}

interface Conversation {
  userId: string
  user: {
    id: string
    name: string
    avatar: string
  }
  lastMessage: Message
}

interface MessagingProps {
  onBack: () => void
  initialUserId?: string
}

export function Messaging({ onBack, initialUserId }: MessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialUserId || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, accessToken } = useAuth()

  useEffect(() => {
    if (user && accessToken) {
      fetchConversations()
    }
  }, [user, accessToken])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        
        // If initialUserId is provided and not in conversations, fetch that user
        if (initialUserId && !data.find((c: Conversation) => c.userId === initialUserId)) {
          const userResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/user/${initialUserId}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`
              }
            }
          )
          if (userResponse.ok) {
            const userData = await userResponse.json()
            setConversations(prev => [{
              userId: initialUserId,
              user: userData,
              lastMessage: null as any
            }, ...prev])
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/messages/${selectedConversation}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            receiverId: selectedConversation,
            text: newMessage
          })
        }
      )

      if (response.ok) {
        setNewMessage('')
        await fetchMessages()
        await fetchConversations()
      }
    } catch (error) {
      console.error('Send message error:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Please log in to view messages</p>
      </div>
    )
  }

  const selectedUser = conversations.find(c => c.userId === selectedConversation)?.user

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Messages</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Conversations list */}
        <div className="w-80 bg-card border-r border-border overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <div>
              {conversations.map((conversation) => (
                <button
                  key={conversation.userId}
                  onClick={() => setSelectedConversation(conversation.userId)}
                  className={`w-full p-4 border-b border-border hover:bg-accent text-left transition-colors ${
                    selectedConversation === conversation.userId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {conversation.user?.avatar ? (
                      <ImageWithFallback
                        src={conversation.user.avatar}
                        alt={conversation.user.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white flex-shrink-0">
                        {conversation.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate mb-1">
                        {conversation.user?.name || 'User'}
                      </h4>
                      {conversation.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.senderId === user.id ? 'You: ' : ''}
                          {conversation.lastMessage.text}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col bg-card">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {selectedUser?.avatar ? (
                    <ImageWithFallback
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white">
                      {selectedUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <h3>{selectedUser?.name || 'User'}</h3>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user.id
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white'
                            : 'bg-accent text-foreground'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-purple-200' : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
