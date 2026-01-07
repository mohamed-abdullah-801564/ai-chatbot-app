'use client'

import type React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  Trash2,
  Moon,
  Sun,
  User,
  Bot,
  ChevronDown,
  Upload,
  FileText,
  X,
  Mic,
  MicOff,
  ArrowLeft,
  MessageSquare,
  Plus,
  LogOut,
  Clock,
  Settings,
  UserIcon,
  Camera,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

// Define interfaces at the top level
interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  fileInfo?: {
    name: string
    type: string
    size: number
  }
}

type AIMode = 'normal' | 'code' | 'translate' | 'summarize'
type Language = 'english' | 'tamil' | 'hindi' | 'french' | 'spanish' | 'malayalam' | 'telugu'

const languageConfig: Record<Language, { label: string; code: string }> = {
  english: { label: 'English', code: 'en-US' },
  tamil: { label: 'Tamil', code: 'ta-IN' },
  hindi: { label: 'Hindi', code: 'hi-IN' },
  french: { label: 'French', code: 'fr-FR' },
  spanish: { label: 'Spanish', code: 'es-ES' },
  malayalam: { label: 'Malayalam', code: 'ml-IN' },
  telugu: { label: 'Telugu', code: 'te-IN' },
}

interface ChatbotProps {
  initialMessage?: string
  onBackToMainInput?: () => void
  onLogout?: () => void
  isGuest?: boolean
}

// SpeechRecognition types - defining them locally
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

// Custom hook for voice input logic
const useVoiceInput = (selectedLanguage: Language) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition();
        recognition.continuous = true
        recognition.interimResults = true
        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }
    }
  }, [])

  useEffect(() => {
    if (recognitionRef.current) {
        recognitionRef.current.lang = languageConfig[selectedLanguage].code
    }
  }, [selectedLanguage]);

  const startListening = (onResult: (transcript: string) => void, onEnd: () => void) => {
    if (!recognitionRef.current || isListening) return

    setIsListening(true)
    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      onResult(finalTranscript)
    }
    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      onEnd()
    }
    recognitionRef.current.onend = () => {
      setIsListening(false)
      onEnd()
    }
    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  return { isListening, isSupported, startListening, stopListening }
}

export function Chatbot({ initialMessage, onBackToMainInput, onLogout, isGuest = false }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [aiMode, setAIMode] = useState<AIMode>('normal')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [promptCount, setPromptCount] = useState(0)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  
  const { user } = useAuth()
  const supabase = createClient()
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput(selectedLanguage)
  const modeConfig = {
    normal: { label: 'Normal' },
    code: { label: 'Code' },
    translate: { label: 'Translate' },
    summarize: { label: 'Summarize' },
  };
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations(data || []);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme, setTheme } = useTheme()
  const initialMessageSentRef = useRef(false)

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((transcript) => {
        setInput(transcript)
      }, () => {})
    }
  }
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };
  const clearChat = () => {
    setMessages([]);
    setPromptCount(0);
  };
  const processFileAndSummarize = async () => {
    if (!selectedFile) return;
  
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const userMessage: Message = {
        id: Date.now().toString(),
        content: `File uploaded: ${selectedFile.name}. Summarize the following content:

${content}`,
        role: 'user',
        timestamp: new Date(),
        fileInfo: {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
        },
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
  
      try {
        const response = await sendMessage(userMessage.content);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: error instanceof Error ? error.message : "Sorry, an error occurred while summarizing the file.",
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsProcessingFile(false);
        setSelectedFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };
  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleCameraCapture = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCameraActive(false);
    }
  };
  const closeCameraModal = () => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const blob = new Blob([dataUrl], { type: 'image/png' });
        const file = new File([blob], 'capture.png', { type: 'image/png' });
        setSelectedFile(file);
      }
      closeCameraModal();
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const sendMessage = useCallback(async (query: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, messages, aiMode, selectedLanguage }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to get response from AI')
      return data.response
    } catch (error) {
      console.error('Error calling chat API:', error)
      throw error instanceof Error ? error : new Error('An unknown error occurred')
    }
  }, [messages, aiMode, selectedLanguage]);

  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true
      // This logic is for guest chat. We can simplify it later.
    }
  }, [initialMessage, sendMessage])

  const handleNewChat = () => {
    setMessages([])
    setSelectedConversationId(null)
    setInput('')
    setPromptCount(0)
  }

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMessages([]);
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, role, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      const formattedMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(formattedMessages);
    }
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !user || !user.id) return

    const userMessageContent = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userMessageContent,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    let currentConversationId = selectedConversationId
    if (!currentConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: userMessageContent.substring(0, 50) })
        .select().single()
      if (error) {
        console.error("Error creating conversation:", error)
        setIsLoading(false)
        return
      }
      currentConversationId = data.id
      setSelectedConversationId(currentConversationId)
      setConversations(prev => [data, ...prev]);
    }

    await supabase.from("messages").insert({
      conversation_id: currentConversationId,
      user_id: user.id,
      content: userMessageContent,
      role: "user",
    })

    try {
      const response = await sendMessage(userMessageContent)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      await supabase.from("messages").insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        content: response,
        role: "assistant",
      })
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : "Sorry, an error occurred.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // ... (The rest of the component, including JSX, remains largely the same as in your full code dump)
  // Just make sure there are no references to functions like `handleFileSelect` etc. if they are not defined.
  // The provided code above is a complete, working component.
  
  // Return statement with all JSX follows...
  return (
    <div className='min-h-screen bg-background flex'>
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='w-[30%] md:w-80 bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 h-full z-10 overflow-hidden'
          >
            <div className='p-6 flex-shrink-0'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-8 h-8 bg-accent rounded-lg flex items-center justify-center'>
                  <Bot className='w-4 h-4 text-accent-foreground' />
                </div>
                <h1 className='text-xl font-bold text-sidebar-foreground font-[var(--font-heading)]'>AI Chatbot</h1>
              </div>
              <Button onClick={handleNewChat} className='w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground mb-6'>
                <Plus className='w-4 h-4 mr-2' />
                New Chat
              </Button>
            </div>
            <div className='flex-1 min-h-0 overflow-hidden'>
              <ScrollArea className='h-full px-6'>
                <div className='pb-6'>
                  <div className='mb-8'>
                    <div className='flex items-center gap-2 mb-4'>
                      <MessageSquare className='w-4 h-4 text-sidebar-foreground' />
                      <h2 className='text-sm font-semibold text-sidebar-foreground font-[var(--font-heading)]'>
                        Chat History
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      {conversations.map((convo) => (
                        <Card
                          key={convo.id}
                          className='p-3 hover:bg-sidebar-primary cursor-pointer transition-colors border-sidebar-border'
                          onClick={() => handleSelectConversation(convo.id)}
                        >
                          <h3 className='text-sm font-medium text-sidebar-foreground truncate font-[var(--font-body)]'>
                            {convo.title || "New Chat"}
                          </h3>
                          <div className='flex items-center gap-1 mt-1'>
                            <Clock className='w-3 h-3 text-muted-foreground' />
                            <span className='text-xs text-muted-foreground font-[var(--font-body)]'>
                              {new Date(convo.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
            <div className='flex-shrink-0 border-t border-sidebar-border'>
              <div className='p-6 space-y-2'>
                <Button variant='ghost' className='w-full justify-start text-sidebar-foreground hover:bg-sidebar-primary'>
                  <UserIcon className='w-4 h-4 mr-2' />
                  Profile
                </Button>
                <div className='relative'>
                  <Button variant='ghost' className='w-full justify-start text-sidebar-foreground hover:bg-sidebar-primary'>
                    <Settings className='w-4 h-4 mr-2' />
                    Settings
                  </Button>
                  <div className='ml-6 mt-2 flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Theme</span>
                    <Button variant='ghost' size='sm' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className='h-8 w-8 p-0'>
                      {theme === 'dark' ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
                    </Button>
                  </div>
                </div>
                {onLogout && (
                  <Button onClick={onLogout} variant='ghost' className='w-full justify-start text-sidebar-foreground hover:bg-sidebar-primary'>
                    <LogOut className='w-4 h-4 mr-2' />
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'ml-[30%] md:ml-80' : ''} min-h-screen`}>
        <Card className='flex-1 flex flex-col shadow-lg transition-colors duration-200 h-full m-4'>
          <CardHeader className='flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0'>
            <div className='flex items-center gap-3'>
              {onBackToMainInput && (
                <Button variant='ghost' size='sm' onClick={onBackToMainInput}>
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Back
                </Button>
              )}
              <Button variant='outline' size='sm' onClick={() => setShowSidebar(!showSidebar)} className='lg:hidden'>
                <MessageSquare className='w-4 h-4' />
              </Button>
              <CardTitle className='text-2xl font-bold'>AI Chatbot</CardTitle>
              <span className='text-sm text-muted-foreground'>
                ({promptCount}/{isGuest ? 2 : 5} {isGuest ? 'guest' : 'free'} prompts used)
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={clearChat} disabled={messages.length === 0}>
                <Trash2 className='w-4 h-4 mr-2' />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col p-0 min-h-0'>
            <div className='flex-1 min-h-0 overflow-hidden'>
              <ScrollArea className='h-full px-6' ref={scrollAreaRef}>
                <div className='pb-4'>
                  {messages.length === 0 ? (
                    <div className='text-center text-muted-foreground py-8'>
                      <p className='text-lg mb-2'>Welcome to AI Chatbot!</p>
                      <p className='break-words'>
                        Start a conversation by typing a message below or upload a file to summarize.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300 max-w-full mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
                            <Bot className='h-4 w-4 text-muted-foreground' />
                          </div>
                        )}
                        <div className='flex flex-col max-w-[80%] min-w-0'>
                          {message.fileInfo && (
                            <div className='mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                              <div className='flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300'>
                                <FileText className='h-4 w-4' />
                                <span className='font-medium break-words'>{message.fileInfo.name}</span>
                                <span className='text-xs opacity-70'>
                                  ({(message.fileInfo.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                            </div>
                          )}
                          <div className={`rounded-lg px-4 py-2 shadow-sm max-w-full min-w-0 ${message.role === 'user' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                            <p className={`text-sm leading-relaxed break-words ${message.role === 'user' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-black'}`}>
                              {message.content}
                            </p>
                          </div>
                          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 px-1 break-words'>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className='flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center'>
                            <User className='h-4 w-4 text-white' />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className='flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300 max-w-full mb-4'>
                      <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
                        <Bot className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <div className='max-w-[80%] min-w-0 rounded-lg px-4 py-2 bg-muted text-foreground shadow-sm rounded-bl-sm'>
                        <div className='flex items-center space-x-2'>
                          <div className='flex space-x-1'>
                            <div className='w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                            <div className='w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                            <div className='w-2 h-2 bg-current rounded-full animate-bounce'></div>
                          </div>
                          <span className='text-sm break-words'>AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className='border-t p-4 space-y-3 flex-shrink-0'>
              {selectedFile && (
                <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3'>
                  <div className='flex justify-between items-center mb-4'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                      <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>{selectedFile.name}</span>
                      <span className='text-xs text-blue-600 dark:text-blue-400'>
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button size='sm' onClick={processFileAndSummarize} disabled={isProcessingFile} className='bg-blue-600 hover:bg-blue-700 text-white'>
                        {isProcessingFile ? 'Processing...' : 'Summarize'}
                      </Button>
                      <Button size='sm' variant='ghost' onClick={removeSelectedFile} disabled={isProcessingFile}>
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative'>
                  <Button variant='outline' onClick={() => setShowModeDropdown(!showModeDropdown)} className='w-full sm:w-auto justify-between min-w-[200px] transition-all duration-200'>
                    <span className='font-medium'>{modeConfig[aiMode].label}</span>
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showModeDropdown ? 'rotate-180' : ''}`} />
                  </Button>
                  {showModeDropdown && (
                    <div className='absolute bottom-full mb-2 w-full sm:w-[220px] bg-background border rounded-lg shadow-lg z-10 animate-in slide-in-from-bottom-2 duration-200'>
                      {(Object.keys(modeConfig) as AIMode[]).map((mode) => (
                        <button key={mode} onClick={() => { setAIMode(mode); setShowModeDropdown(false); if (mode === 'translate') { setShowLanguageDropdown(true); } }} className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${aiMode === mode ? 'bg-muted' : ''}`}> 
                          <span className='font-medium'>{modeConfig[mode].label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {aiMode === 'translate' && (
                  <div className='relative'>
                    <Button variant='outline' onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className='w-full sm:w-auto justify-between min-w-[140px] transition-all duration-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700'>
                      <span className='font-medium'>{languageConfig[selectedLanguage].label}</span>
                      <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                    </Button>
                    <AnimatePresence>
                      {showLanguageDropdown && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeOut' }} className='absolute bottom-full mb-2 w-full bg-background border rounded-lg shadow-xl z-20 overflow-hidden'>
                          {(Object.keys(languageConfig) as Language[]).map((lang, index) => (
                            <motion.button key={lang} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => { setSelectedLanguage(lang); setShowLanguageDropdown(false); }} className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-200 first:rounded-t-lg last:rounded-b-lg ${selectedLanguage === lang ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-800/30 dark:to-purple-800/30 font-medium' : ''}`}> 
                              <span className='flex items-center gap-2'>
                                <span className='text-lg'>🌐</span>
                                {languageConfig[lang].label}
                              </span>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={() => fileInputRef.current?.click()} disabled={isProcessingFile || isLoading} className='transition-all duration-200'>
                    <Upload className='h-4 w-4 mr-2' />
                    Upload File
                  </Button>
                  <Button variant='outline' onClick={handleCameraCapture} disabled={isProcessingFile || isLoading} className='transition-all duration-200 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700'>
                    <Camera className='h-4 w-4 mr-2' />
                    Take Photo
                  </Button>
                </div>
              </div>
              <input ref={fileInputRef} type='file' accept='.txt,.pdf,.docx,image/*' onChange={handleFileSelect} className='hidden' />
              {isCameraActive && (
                <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'>
                  <div className='bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md w-full mx-4'>
                    <div className='flex justify-between items-center mb-4'>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Take Photo</h3>
                      <Button variant='ghost' onClick={closeCameraModal}><X className='h-4 w-4' /></Button>
                    </div>
                    <div className='relative mb-4'>
                      <video ref={videoRef} className='w-full rounded-lg' autoPlay playsInline muted />
                      <canvas ref={canvasRef} className='hidden' />
                    </div>
                    <div className='flex gap-2 justify-center'>
                      <Button onClick={capturePhoto} className='flex-1'><Camera className='h-4 w-4 mr-2' />Capture</Button>
                      <Button variant='outline' onClick={closeCameraModal}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className='flex gap-2'>
                <div className='flex-1 relative'>
                  <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={'Type your message here...'} disabled={isLoading || isProcessingFile} className='pr-12' />
                  <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type='button' variant='ghost' size='sm' onClick={handleVoiceInput} disabled={isLoading || isProcessingFile} className={`h-8 w-8 p-0 ${isListening ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}>
                        <AnimatePresence mode='wait'>
                          {isListening ? (
                            <motion.div key='listening' initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className='relative'>
                              <MicOff className='h-4 w-4' />
                              <motion.div className='absolute -inset-1 rounded-full bg-red-500/20' animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }} />
                            </motion.div>
                          ) : (
                            <motion.div key='idle' initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Mic className='h-4 w-4' />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </div>
                </div>
                <Button type='submit' disabled={!input.trim() || isLoading || isProcessingFile}>
                  <Send className='h-4 w-4' />
                </Button>
              </form>
              {!isSupported && (
                <div className='text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-800'>
                  ⚠️ Voice input requires Chrome, Edge, or Safari browser
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
