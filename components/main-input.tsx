"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Plus, Search, LogOut, Clock, Sparkles, ArrowRight, History } from "lucide-react"

interface MainInputProps {
  onStartChat: (initialMessage: string) => void
  onLogout: () => void
  isGuest?: boolean
}

export function MainInput({ onStartChat, onLogout, isGuest = false }: MainInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [chatHistory] = useState([
    { id: 1, title: "AI Translation Help", timestamp: "2 hours ago" },
    { id: 2, title: "Voice Input Tutorial", timestamp: "Yesterday" },
    { id: 3, title: "File Upload Questions", timestamp: "2 days ago" },
    { id: 4, title: "Getting Started Guide", timestamp: "1 week ago" },
  ])
  const [searchHistory] = useState([
    "How to use voice input",
    "Translate documents",
    "Upload files to chat",
    "AI conversation tips",
  ])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (inputValue.trim()) {
        if (isGuest) {
          onStartChat(inputValue.trim())
          return
        }
        setShowSidebar(true)
        onStartChat(inputValue.trim())
      }
    },
    [inputValue, onStartChat, isGuest],
  )

  const handleNewChat = useCallback(() => {
    setInputValue("")
    setShowSidebar(false)
  }, [])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isGuest) {
        onStartChat(suggestion)
        return
      }
      setInputValue(suggestion)
    },
    [isGuest, onStartChat],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (inputValue.trim()) {
          if (isGuest) {
            onStartChat(inputValue.trim())
            return
          }
          setShowSidebar(true)
          onStartChat(inputValue.trim())
        }
      }
    },
    [inputValue, onStartChat, isGuest],
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent-foreground" />
                </div>
                <h1 className="text-xl font-bold text-sidebar-foreground font-[var(--font-heading)]">AI Chatbot</h1>
              </div>

              <Button
                onClick={handleNewChat}
                className="w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground mb-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1 px-6">
              {/* Chat History */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-sidebar-foreground" />
                  <h2 className="text-sm font-semibold text-sidebar-foreground font-[var(--font-heading)]">
                    Chat History
                  </h2>
                </div>
                <div className="space-y-2">
                  {chatHistory.map((chat) => (
                    <Card
                      key={chat.id}
                      className="p-3 hover:bg-sidebar-primary cursor-pointer transition-colors border-sidebar-border"
                    >
                      <h3 className="text-sm font-medium text-sidebar-foreground truncate font-[var(--font-body)]">
                        {chat.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-[var(--font-body)]">{chat.timestamp}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator className="mb-8 bg-sidebar-border" />

              {/* Search History */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-sidebar-foreground" />
                  <h2 className="text-sm font-semibold text-sidebar-foreground font-[var(--font-heading)]">
                    Search History
                  </h2>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(search)}
                      className="w-full text-left p-2 rounded-md hover:bg-sidebar-primary text-sm text-sidebar-foreground transition-colors font-[var(--font-body)]"
                    >
                      <Search className="w-3 h-3 inline mr-2 text-muted-foreground" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-sidebar-border">
              <Button
                onClick={onLogout}
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-primary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-8 h-8 text-accent-foreground" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-[var(--font-heading)]"
            >
              What do you want to
              <span className="text-accent block">explore today?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-muted-foreground font-[var(--font-body)]"
            >
              Start a conversation, ask questions, or explore AI capabilities
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative"
          >
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isGuest
                      ? "Type your message and press Enter (2 free prompts)"
                      : "What do you want to explore today?"
                  }
                  className="w-full h-16 text-lg px-6 pr-16 bg-card border-2 border-border focus:border-accent rounded-2xl shadow-lg font-[var(--font-body)]"
                  autoFocus={!isGuest}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Quick Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8"
          >
            <p className="text-sm text-muted-foreground mb-4 font-[var(--font-body)]">Try these suggestions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Help me write a professional email",
                "Translate this document to Spanish",
                "Explain quantum computing simply",
                "Create a workout plan for beginners",
              ].map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 text-left bg-card hover:bg-muted border border-border rounded-xl transition-colors font-[var(--font-body)]"
                >
                  <span className="text-foreground">{suggestion}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
