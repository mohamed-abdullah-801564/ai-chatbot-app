'use client'

import type React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
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
  MoreHorizontal,
  Pencil,
  Check,
  Zap, // Added
  AlertTriangle, // Added
  Loader2, // Added
  Pen, // Added
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useToast } from '@/components/ui/use-toast'
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
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition();
        recognition.continuous = true
        recognition.interimResults = true
        recognitionRef.current = recognition;
      }
    } else {
      setIsSupported(false);
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
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [newChatTitle, setNewChatTitle] = useState("")

  // Profile & Limit State
  const [userProfile, setUserProfile] = useState<{ daily_prompts_used: number, subscription_tier: 'free' | 'pro' | 'admin' } | null>(null)
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Fetch User Profile on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('daily_prompts_used, subscription_tier')
            .eq('id', user.id)
            .single()

          if (data && !error) {
            setUserProfile(data as any) // Type assertion to handle potential mismatch safely
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  const { toast } = useToast()

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
      }, () => { })
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
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
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

  const handleRenameChat = async () => {
    if (!renamingChatId || !newChatTitle.trim()) return

    const { error } = await supabase
      .from('conversations')
      .update({ title: newChatTitle.trim() })
      .eq('id', renamingChatId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to rename chat.",
        variant: "destructive",
      })
    } else {
      setConversations(conversations.map(c =>
        c.id === renamingChatId ? { ...c, title: newChatTitle.trim() } : c
      ))
      toast({
        title: "Success",
        description: "Chat renamed successfully.",
      })
      setIsRenameDialogOpen(false)
      setRenamingChatId(null)
    }
  }

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat.",
        variant: "destructive",
      })
    } else {
      setConversations(conversations.filter(c => c.id !== id))
      if (selectedConversationId === id) {
        handleNewChat()
      }
      toast({
        title: "Success",
        description: "Chat deleted.",
      })
    }
  }

  const openRenameDialog = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingChatId(id)
    setNewChatTitle(currentTitle)
    setIsRenameDialogOpen(true)
  }

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

    // Limit Check (Client-side pre-check)
    if (userProfile?.subscription_tier === 'free' && userProfile.daily_prompts_used >= 5) {
      setIsLimitModalOpen(true)
      return
    }

    const userMessageContent = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userMessageContent,
      role: "user",
      timestamp: new Date(),
      fileInfo: selectedFile ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type } : undefined
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessageContent,
          messages: [...messages, userMessage], // Include history
          aiMode,
          selectedLanguage
        }),
      })

      if (response.status === 403) {
        const data = await response.json()
        if (data.error === "Limit Reached") {
          setIsLimitModalOpen(true)
          setIsLoading(false)
          // Remove the user message we just optimistically added? 
          // Or let them see it but get the error? Better to remove it or mark error.
          // For now, let's keep it simple and just show modal.
          return
        }
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to get response from AI')

      // On success, increment local count optimistically
      if (userProfile) {
        setUserProfile({ ...userProfile, daily_prompts_used: userProfile.daily_prompts_used + 1 })
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      await supabase.from("messages").insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        content: data.response,
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
      if (selectedFile) removeSelectedFile()
    }
  }

  // ... (The rest of the component, including JSX, remains largely the same as in your full code dump)
  // Just make sure there are no references to functions like `handleFileSelect` etc. if they are not defined.
  // The provided code above is a complete, working component.
  return (
    <div className='h-screen bg-background flex overflow-hidden'>
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Chat Title"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameChat()
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameChat}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limit Reached Modal */}
      <Dialog open={isLimitModalOpen} onOpenChange={setIsLimitModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              Limit Reached
            </DialogTitle>
            <DialogDescription>
              You have reached your daily limit of 5 prompts on the Free plan. Upgrade to Pro for unlimited access.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">Daily Usage</span>
              <span className="text-sm font-bold">{userProfile?.daily_prompts_used || 5} / 5</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600">
              <Zap className="h-4 w-4 mr-2" /> Upgrade to Pro
            </Button>
            <Button variant="outline" onClick={() => setIsLimitModalOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-full z-10 flex-shrink-0'
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
              <ScrollArea className='h-full px-4'>
                <div className='pb-6 space-y-2'>
                  {conversations.length > 0 && (
                    <div className='flex items-center gap-2 mb-2 px-2'>
                      <MessageSquare className='w-4 h-4 text-sidebar-foreground' />
                      <h2 className='text-sm font-semibold text-sidebar-foreground font-[var(--font-heading)]'>
                        Chat History
                      </h2>
                    </div>
                  )}

                  {/* List - Limited to 5 */}
                  {conversations.slice(0, 5).map((convo) => (
                    <div
                      key={convo.id}
                      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-sidebar-border hover:bg-sidebar-primary ${selectedConversationId === convo.id ? 'bg-sidebar-primary border-sidebar-border' : ''}`}
                      onClick={() => handleSelectConversation(convo.id)}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className='text-sm font-medium text-sidebar-foreground truncate font-[var(--font-body)]'>
                          {convo.title || "New Chat"}
                        </h3>
                        <div className='flex items-center gap-1 mt-0.5'>
                          <Clock className='w-3 h-3 text-muted-foreground' />
                          <span className='text-xs text-muted-foreground font-[var(--font-body)]'>
                            {new Date(convo.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e: any) => openRenameDialog(convo.id, convo.title, e)}>
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e: any) => handleDeleteChat(convo.id, e)} className="text-red-500 hover:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {/* View All Button */}
                  {conversations.length > 5 && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="w-full mt-2 text-sidebar-foreground">
                          View All ({conversations.length})
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>All Conversations</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-2">
                          {conversations.map((convo) => (
                            <div
                              key={convo.id}
                              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${selectedConversationId === convo.id ? 'bg-muted border-primary/20' : 'hover:bg-muted border-transparent'}`}
                              onClick={() => handleSelectConversation(convo.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <h3 className='font-medium truncate'>{convo.title || "New Chat"}</h3>
                                <span className='text-xs text-muted-foreground'>{new Date(convo.created_at).toLocaleDateString()}</span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e: any) => openRenameDialog(convo.id, convo.title, e)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e: any) => handleDeleteChat(convo.id, e)} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
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
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background">
        {/* Header */}
        <div className='flex-none h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <div className='flex items-center gap-3'>
            {onBackToMainInput && (
              <Button variant='ghost' size='sm' onClick={onBackToMainInput}>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back
              </Button>
            )}
            <Button variant='ghost' size='icon' onClick={() => setShowSidebar(!showSidebar)} className='lg:hidden'>
              <MessageSquare className='w-5 h-5' />
            </Button>
            <div className="flex flex-col">
              <CardTitle className='text-lg font-bold'>AI Chatbot</CardTitle>
              <span className='text-xs text-muted-foreground'>
                {promptCount}/{isGuest ? 2 : 5} prompts
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' onClick={clearChat} disabled={messages.length === 0} className="text-muted-foreground hover:text-destructive">
              <Trash2 className='w-4 h-4 mr-2' />
              Clear
            </Button>
          </div>
        </div>
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
                          <div className={`text-sm leading-relaxed break-words ${message.role === 'user' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            <ReactMarkdown
                              components={{
                                p: (props: any) => {
                                  const { node, ...rest } = props;
                                  return <p className="mb-2 last:mb-0" {...rest} />
                                },
                                ul: (props: any) => {
                                  const { node, ...rest } = props;
                                  return <ul className="list-disc pl-4 mb-2" {...rest} />
                                },
                                ol: (props: any) => {
                                  const { node, ...rest } = props;
                                  return <ol className="list-decimal pl-4 mb-2" {...rest} />
                                },
                                li: (props: any) => {
                                  const { node, ...rest } = props;
                                  return <li className="mb-1" {...rest} />
                                },
                                code: ({ node, className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !className?.includes('language-') ? (
                                    <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="bg-slate-950 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto my-2 text-white">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  )
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
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
        </CardContent>
        {/* Input Area */}
        <div className='flex-none border-t bg-card p-4'>
          <div className="max-w-4xl mx-auto w-full">
            {selectedFile && (
              <div className='flex items-center gap-2 mb-3 animate-in fade-in slide-in-from-bottom-1'>
                <div className="bg-muted border border-border rounded-full pl-3 pr-2 py-1.5 flex items-center gap-2 max-w-[200px]">
                  <FileText className='h-3.5 w-3.5 text-primary' />
                  <span className='text-xs font-medium truncate flex-1'>{selectedFile.name}</span>
                  <button onClick={removeSelectedFile} className="hover:bg-background rounded-full p-0.5 transition-colors">
                    <X className='h-3.5 w-3.5 text-muted-foreground' />
                  </button>
                </div>
                <Button size='sm' variant="secondary" onClick={processFileAndSummarize} disabled={isProcessingFile} className='h-7 text-xs rounded-full'>
                  {isProcessingFile ? 'Processing...' : 'Summarize File'}
                </Button>
              </div>
            )}

            <div className='flex flex-col sm:flex-row gap-2 mb-2'>
              {/* Mode Selectors */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size="sm" className='h-8 text-xs gap-1.5'>
                      {modeConfig[aiMode].label}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(Object.keys(modeConfig) as AIMode[]).map((mode) => (
                      <DropdownMenuItem key={mode} onClick={() => setAIMode(mode)}>
                        {modeConfig[mode].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {aiMode === 'translate' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size="sm" className='h-8 text-xs gap-1.5'>
                        {languageConfig[selectedLanguage].label}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[200px] overflow-y-auto">
                      {(Object.keys(languageConfig) as Language[]).map((lang) => (
                        <DropdownMenuItem key={lang} onClick={() => setSelectedLanguage(lang)}>
                          {languageConfig[lang].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Button variant='ghost' size="sm" onClick={() => fileInputRef.current?.click()} className='h-8 text-xs text-muted-foreground'>
                  <Upload className='h-3.5 w-3.5 mr-1.5' />
                  Upload
                </Button>
                <Button variant='ghost' size="sm" onClick={handleCameraCapture} className='h-8 text-xs text-muted-foreground'>
                  <Camera className='h-3.5 w-3.5 mr-1.5' />
                  Photo
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='relative flex items-end gap-2 bg-muted/50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all'>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={'Type your message here...'}
                disabled={isLoading || isProcessingFile}
                className='flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 py-2 h-auto min-h-[44px]'
              />
              <div className="flex items-center gap-1 pb-1">
                <Button type='button' variant='ghost' size='icon' onClick={handleVoiceInput} disabled={isLoading || isProcessingFile} className={`h-8 w-8 rounded-lg ${isListening ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground'}`}>
                  {isListening ? <MicOff className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
                </Button>
                <Button type='submit' disabled={!input.trim() || isLoading || isProcessingFile} className="h-8 w-8 rounded-lg">
                  <Send className='h-4 w-4' />
                </Button>
              </div>
            </form>

            {!isSupported && (
              <div className='text-[10px] text-center text-muted-foreground mt-2'>
                ⚠️ Voice input available on Chrome, Edge, Safari
              </div>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type='file' accept='.txt,.pdf,.docx,image/*' onChange={handleFileSelect} className='hidden' />

        {/* Camera Modal */}
        {isCameraActive && (
          <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm'>
            <div className='bg-background rounded-xl p-4 max-w-md w-full mx-4 shadow-2xl'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold'>Take Photo</h3>
                <Button variant='ghost' size="icon" onClick={closeCameraModal}><X className='h-4 w-4' /></Button>
              </div>
              <div className='relative mb-4 rounded-lg overflow-hidden bg-black aspect-video'>
                <video ref={videoRef} className='w-full h-full object-cover' autoPlay playsInline muted />
                <canvas ref={canvasRef} className='hidden' />
              </div>
              <div className='flex gap-2 justify-center'>
                <Button onClick={capturePhoto} className='flex-1'><Camera className='h-4 w-4 mr-2' />Capture</Button>
                <Button variant='outline' onClick={closeCameraModal}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
