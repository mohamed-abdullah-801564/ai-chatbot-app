"use client"

import type React from "react"


import { useState, useRef, useEffect } from "react"
import { useChat } from '@ai-sdk/react'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Send, Mic, User, Bot, Globe } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: {
    transcript: string;
  };
}

interface SpeechRecognitionResultList {
  [key: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface GuestChatProps {
  initialMessage: string
  onBack: () => void
  onSignUp: () => void
}

const languageConfig = {
  english: { label: "English", code: "en-US" },
  tamil: { label: "Tamil", code: "ta-IN" },
  hindi: { label: "Hindi", code: "hi-IN" },
  french: { label: "French", code: "fr-FR" },
  spanish: { label: "Spanish", code: "es-ES" },
  malayalam: { label: "Malayalam", code: "ml-IN" },
  telugu: { label: "Telugu", code: "te-IN" },
}

export function GuestChat({ initialMessage, onBack, onSignUp }: GuestChatProps) {
  // Re-declare state variables needed for voice/other UI that were part of the big block replaced
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<CustomSpeechRecognition | null>(null)
  const [promptCount, setPromptCount] = useState(0)
  const [hasReachedLimit, setHasReachedLimit] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof languageConfig>("english")
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialMessageSentRef = useRef(false)
  // useChat hook from Vercel AI SDK
  const { messages, input, setInput, append, isLoading, setMessages, handleSubmit } = useChat({
    streamProtocol: 'text',
    api: '/api/chat',
    body: {
      aiMode: "normal",
      selectedLanguage: selectedLanguage,
    },
    onFinish: () => {
      const newPromptCount = promptCount + 1
      setPromptCount(newPromptCount)
      localStorage.setItem("guestPromptCount", newPromptCount.toString())
      if (newPromptCount >= 2) {
        setHasReachedLimit(true)
      }
    },
    onError: (error) => {
      console.error("Chat error:", error)
      // Optional: Add a system message for error?
    }
  })

  // Set input for useChat when voice changes it
  useEffect(() => {
    if (inputValue !== input) {
      setInput(inputValue)
    }
  }, [inputValue, setInput])

  // Sync useChat input back to local inputValue (bi-directional for Voice/UI sync)
  useEffect(() => {
    if (input !== inputValue) {
      setInputValue(input)
    }
  }, [input])


  // Load prompt count from local storage
  useEffect(() => {
    const stored = localStorage.getItem("guestPromptCount")
    if (stored) {
      const count = parseInt(stored, 10)
      setPromptCount(count)
      if (count >= 2) setHasReachedLimit(true)
    }
  }, [])

  // Process initial message
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current) {
      // Check storage before sending initial message
      const stored = localStorage.getItem("guestPromptCount")
      const currentCount = stored ? parseInt(stored, 10) : 0

      if (currentCount >= 2) {
        setPromptCount(currentCount)
        setHasReachedLimit(true)
        return
      }

      initialMessageSentRef.current = true

      // Use append to send the initial message
      append({
        role: 'user',
        content: initialMessage
      })
    }
  }, [initialMessage, append]) // Added append to deps

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])


  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || hasReachedLimit) return

    if (promptCount >= 2) {
      setHasReachedLimit(true)
      return
    }

    handleSubmit(e)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.lang = languageConfig[selectedLanguage].code
      recognition.start()
      setIsListening(true)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900 font-[var(--font-heading)]">AI Chat</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{promptCount}/2 Free Prompts Used</span>
              <Button onClick={onSignUp} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign Up for Unlimited
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-200px)]">
          <div className="space-y-6 max-w-4xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <Card
                    className={`max-w-[70%] border ${message.role === "user" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200"
                      }`}
                  >
                    <div className="p-4">
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap break-words font-[var(--font-body)] ${message.role === "user" ? "text-white" : "text-black"
                          }`}
                      >
                        {message.content}
                      </p>
                      <span
                        className={`text-xs mt-2 block ${message.role === "user" ? "text-blue-100" : "text-gray-500"
                          }`}
                      >
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  </Card>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <Card className="bg-white border-gray-200">
                  <div className="p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {hasReachedLimit && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <Card className="bg-yellow-50 border-yellow-200 max-w-md">
                  <div className="p-4 text-center">
                    <p className="text-sm text-yellow-800 mb-3 font-[var(--font-body)]">
                      You've reached the free limit. Please log in to continue.
                    </p>
                    <Button onClick={onSignUp} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Login to continue
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                  className="flex items-center gap-2 bg-white border-gray-300 hover:bg-gray-50"
                >
                  <Globe className="w-4 h-4 text-gray-600" />
                  Translate
                </Button>

                {showTranslateDropdown && (
                  <div className="absolute bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    {Object.entries(languageConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedLanguage(key as keyof typeof languageConfig)
                          setShowTranslateDropdown(false)
                          if (recognition) {
                            recognition.lang = config.code
                          }
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${selectedLanguage === key ? "bg-blue-50 text-blue-700" : "text-gray-700"
                          }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedLanguage !== "english" && (
                <span className="text-sm text-gray-600">Selected: {languageConfig[selectedLanguage].label}</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={hasReachedLimit ? "Sign up to continue chatting..." : "Type your message..."}
                  disabled={hasReachedLimit}
                  className="pr-24 h-12 bg-white border-gray-300 focus:border-blue-500 font-[var(--font-body)] text-black"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleVoiceInput}
                    disabled={hasReachedLimit}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    {isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                        className="w-4 h-4 bg-red-500 rounded-full"
                      />
                    ) : (
                      <Mic className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputValue.trim() || hasReachedLimit}
                    className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
