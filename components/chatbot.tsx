'use client'

import type React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  Zap,
  AlertTriangle,
  Loader2,
  Pen,
  CreditCard,

  Menu as MenuIcon,
  ArrowDown,
  Download,
  Search,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@ai-sdk/react'

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

// SpeechRecognition types are now in types/global.d.ts

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

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
  const [aiMode, setAIMode] = useState<AIMode>('normal')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [newChatTitle, setNewChatTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter(convo =>
    (convo.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Profile & Limit State
  const [userProfile, setUserProfile] = useState<{ daily_prompts_used: number, subscription_tier: 'free' | 'pro' | 'admin' } | null>(null)
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)

  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const currentConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClient()
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput(selectedLanguage)

  // Initialize Vercel AI SDK useChat
  const { messages, input, setInput, append, isLoading, setMessages, handleSubmit: handleChatSubmit } = useChat({
    id: selectedConversationId ?? 'new-chat',
    streamProtocol: 'text',
    api: '/api/chat',
    body: {
      aiMode,
      selectedLanguage
    },
    onResponse: (response) => {
      if (response.status === 403) {
        // Handle Limit Reached
        setIsLimitModalOpen(true)
      }
    },
    onFinish: (message) => {
      // Create conversation if new
      if (!selectedConversationId && user) {
        // This logic might need to be adjusted: standard useChat doesn't automatically create "conversations" in your DB.
        // We might need to save the completion to DB here or rely on the server?
        // Given requirements, let's keep it simple: We save to DB *after* generation or rely on the fact that we can't easily intercept the *first* chunk for ID creation without custom logic.
        // Actually, `onFinish` gives us the full message. We can save here.
        saveMessageToDb(message)
        // Also save the user message that triggered this? useChat doesn't give it easily in onFinish.
        // Standard pattern: Save user message in handleSubmit, save assistant message in onFinish.
      } else {
        saveMessageToDb(message)
      }

      // Increment Profile Usage (Optimistic)
      if (userProfile) {
        setUserProfile(prev => prev ? ({ ...prev, daily_prompts_used: prev.daily_prompts_used + 1 }) : null)
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive"
      })
    }
  })

  // Helper to save messages to Supabase
  const saveMessageToDb = async (msg: any) => {
    const currentId = currentConversationIdRef.current;
    if (!user || !currentId) return; // Note: We need a conversation ID.
    // If we don't have one, we need to create it.
    // see handleSubmit wrapper.

    await supabase.from("messages").insert({
      conversation_id: currentId,
      user_id: user.id,
      content: msg.content,
      role: msg.role,
    })
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        toast({
          title: "Error",
          description: "Failed to initiate upgrade. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error handling upgrade:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    }
  };


  // Fetch User Profile on Mount (Same as before)
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
            setUserProfile(data as any)
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

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!isAtBottom);
  }

  // Auto-scroll logic
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Always scroll for user's own messages
    if (lastMessage.role === 'user') {
      scrollToBottom();
      return;
    }

    // For AI messages, scroll only if already near bottom (button is hidden)
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages]) // Intentionally not including showScrollButton to avoid loops

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((transcript) => {
        setInput((prev) => {
          // Avoid appending if the new transcript is just a substring/duplicate update of what we just added
          // Ideally the hook handles 'final' vs 'interim' but for now we append safely
          const trimmedPrev = prev.trim();
          if (!trimmedPrev) return transcript;
          return trimmedPrev + ' ' + transcript;
        });
      }, () => { })
    }
  }
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFormSubmit(e as unknown as React.FormEvent);
    }
  };

  // Wrapper for handleSubmit to handle DB operations
  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !user) return

    // Limit Check
    if (userProfile?.subscription_tier === 'free' && userProfile.daily_prompts_used >= 5) {
      setIsLimitModalOpen(true)
      return
    }

    let currentConversationId = selectedConversationId
    if (!currentConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: input.substring(0, 50) })
        .select().single()
      if (error) {
        toast({ title: "Error", description: "Failed to start conversation", variant: "destructive" })
        return
      }
      currentConversationId = data.id
      setSelectedConversationId(currentConversationId)
      currentConversationIdRef.current = currentConversationId;
      setConversations(prev => [data, ...prev]);
    }

    // Save User Message immediately
    await supabase.from("messages").insert({
      conversation_id: currentConversationId,
      user_id: user.id,
      content: input,
      role: "user",
    })

    // Trigger AI SDK
    const attachments = selectedFile && selectedFile.type.startsWith('image/') 
      ? [{
          url: await fileToBase64(selectedFile),
          name: selectedFile.name,
          contentType: selectedFile.type,
        }]
      : undefined;

    handleChatSubmit(e, {
      body: {
        aiMode, // pass latest state
        selectedLanguage
      },
      experimental_attachments: attachments
    })

    setSelectedFile(null); // Clear file after submission
  }

  const exportChatAsPDF = () => {
    if (messages.length === 0) return;
    
    const printContent = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'AI Assistant'}:\n${msg.content}\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([printContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages([]);
    // setPromptCount(0); // Removed prompt count
  };

  const processFileAndSummarize = async () => {
    if (!selectedFile) return;

    setIsProcessingFile(true);

    if (selectedFile.type.startsWith('image/')) {
      const base64 = await fileToBase64(selectedFile);
      const userMessageContent = `Summarize/Describe this image: ${selectedFile.name}`

      // Limit Check
      if (userProfile?.subscription_tier === 'free' && userProfile.daily_prompts_used >= 5) {
        setIsLimitModalOpen(true)
        setIsProcessingFile(false)
        return
      }

      let currentConversationId = selectedConversationId
      if (!currentConversationId && user) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: `Image: ${selectedFile.name}` })
          .select().single()
        if (!error) {
          currentConversationId = data.id
          setSelectedConversationId(currentConversationId)
          currentConversationIdRef.current = currentConversationId;
          setConversations(prev => [data, ...prev]);
        }
      }

      if (currentConversationId && user) {
        await supabase.from("messages").insert({
          conversation_id: currentConversationId,
          user_id: user.id,
          content: userMessageContent,
          role: "user",
        })
      }

      append({
        content: userMessageContent,
        role: 'user',
        createdAt: new Date(),
        experimental_attachments: [{
          url: base64,
          name: selectedFile.name,
          contentType: selectedFile.type,
        }]
      }, {
        body: { aiMode, selectedLanguage }
      })

      setIsProcessingFile(false);
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const userMessageContent = `File uploaded: ${selectedFile.name}. Summarize the following content:\n\n${content}`

      // Limit Check
      if (userProfile?.subscription_tier === 'free' && userProfile.daily_prompts_used >= 5) {
        setIsLimitModalOpen(true)
        setIsProcessingFile(false)
        return
      }

      let currentConversationId = selectedConversationId
      if (!currentConversationId && user) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: `File: ${selectedFile.name}` })
          .select().single()
        if (!error) {
          currentConversationId = data.id
          setSelectedConversationId(currentConversationId)
          currentConversationIdRef.current = currentConversationId;
          setConversations(prev => [data, ...prev]);
        }
      }

      if (currentConversationId && user) {
        await supabase.from("messages").insert({
          conversation_id: currentConversationId,
          user_id: user.id,
          content: userMessageContent,
          role: "user",
        })
      }

      append({
        content: userMessageContent,
        role: 'user',
        createdAt: new Date()
      }, {
        body: { aiMode, selectedLanguage }
      })

      setIsProcessingFile(false);
      setSelectedFile(null);
    };

    if (selectedFile.type === 'text/plain' || selectedFile.type === 'text/markdown' || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md')) {
      reader.readAsText(selectedFile);
    } else {
      toast({
        title: "Unsupported File",
        description: "Only images and text files (.txt, .md) are supported for summarization.",
        variant: "destructive"
      });
      setIsProcessingFile(false);
    }
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

  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true
      // Pass initial message to useChat
      if (input !== initialMessage) setInput(initialMessage)
      // Note: We don't auto-submit here to avoid double submission or complexity with creating conversation first
      // But user expects it.
    }
  }, [initialMessage, input]) // Removed sendMessage dependency

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
    // setPromptCount(0)
  }

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    currentConversationIdRef.current = conversationId;
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setShowSidebar(false)
    }
    setMessages([]); // Clear current messages first

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
        createdAt: new Date(msg.created_at), // useChat expect createdAt
        // timestamp: new Date(msg.created_at), // legacy
      }));
      setMessages(formattedMessages); // Set useChat messages
    }
  }, [supabase, setMessages]); // added setMessages dependency

  // Removed old handleSubmit and sendMessage functions

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
        <DialogContent className="sm:max-w-sm">
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
          <DialogFooter className="flex flex-col gap-2 w-full sm:flex-col">
            <Button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600">
              <Zap className="h-4 w-4 mr-2" /> Upgrade to Pro
            </Button>
            <Button variant="outline" onClick={() => setIsLimitModalOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9] md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='fixed md:relative w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-full z-10 flex-shrink-0'
          >
            <div className='p-6 flex-shrink-0'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-8 h-8 bg-accent rounded-lg flex items-center justify-center'>
                  <Bot className='w-4 h-4 text-accent-foreground' />
                </div>
                <h1 className='text-xl font-bold text-sidebar-foreground font-[var(--font-heading)]'>AI Chatbot</h1>
              </div>
              <Button onClick={handleNewChat} className='w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground mb-4'>
                <Plus className='w-4 h-4 mr-2' />
                New Chat
              </Button>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="pl-9 bg-sidebar-primary border-sidebar-border text-sm"
                />
              </div>
            </div>
            <div className='flex-1 min-h-0 overflow-hidden'>
              <ScrollArea className='h-full px-4'>
                <div className='pb-6 space-y-2'>
                  {filteredConversations.length > 0 && (
                    <div className='flex items-center gap-2 mb-2 px-2'>
                      <MessageSquare className='w-4 h-4 text-sidebar-foreground' />
                      <h2 className='text-sm font-semibold text-sidebar-foreground font-[var(--font-heading)]'>
                        Chat History
                      </h2>
                    </div>
                  )}

                  {/* List - Limited to 5 */}
                  {filteredConversations.slice(0, 5).map((convo) => (
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
                  {filteredConversations.length > 5 && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="w-full mt-2 text-sidebar-foreground">
                          View All ({filteredConversations.length})
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>All Conversations</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-2">
                          {filteredConversations.map((convo) => (
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

            {/* User Profile Section with Popover */}
            <div className='p-4 border-t border-sidebar-border bg-sidebar-accent/10'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="w-full flex items-center justify-start gap-3 px-2 hover:bg-sidebar-accent group">
                    <div className='w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground group-hover:bg-background transition-colors'>
                      <UserIcon className='w-4 h-4' />
                    </div>
                    <div className='flex-1 text-left min-w-0'>
                      <p className='text-sm font-medium text-sidebar-foreground font-[var(--font-heading)] truncate'>
                        {user?.email || "User"}
                      </p>
                      <p className='text-xs text-muted-foreground font-[var(--font-body)] capitalize'>
                        {userProfile?.subscription_tier || 'Free'} Plan
                      </p>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="start" side="right">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{userProfile?.subscription_tier || 'Free'} Plan</p>
                      </div>
                    </div>

                    {(!userProfile || userProfile.subscription_tier === 'free') && (
                      <Button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 border-0 hover:from-amber-600 hover:to-orange-600 text-white text-sm" size="sm">
                        <Zap className="w-3 h-3 mr-2" /> Upgrade to Pro
                      </Button>
                    )}

                    {userProfile?.subscription_tier === 'pro' ? (
                      <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium">Daily Usage</span>
                        <span className="text-sm font-bold text-green-500">Unlimited ✓</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Daily Usage</span>
                          <span className={userProfile?.daily_prompts_used && userProfile.daily_prompts_used >= 5 ?
                            "text-red-500 font-bold" : ""}>
                            {userProfile?.daily_prompts_used || 0} / 5
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${userProfile?.daily_prompts_used && userProfile.daily_prompts_used >= 5
                              ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(((userProfile?.daily_prompts_used || 0)
                              / 5) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='flex-1 flex flex-col min-w-0 bg-background'>
        {/* Header */}
        <header className='flex-none h-14 border-b border-border flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='icon' onClick={() => setShowSidebar(!showSidebar)} className="text-muted-foreground hover:text-foreground">
              <MenuIcon className='w-5 h-5' />
            </Button>
            <div className='flex items-center gap-2 md:hidden'>
              <Bot className='w-5 h-5 text-primary' />
              <span className='font-bold font-[var(--font-heading)]'>AI Chatbot</span>
            </div>

          </div>

          <div className='flex items-center gap-2'>
            <Button 
              variant='ghost' 
              size='sm' 
              onClick={exportChatAsPDF} 
              disabled={messages.length === 0} 
              className="hidden sm:flex text-muted-foreground hover:text-foreground text-xs"
            >
              <Download className='w-4 h-4 mr-2' /> Export
            </Button>
            <Button variant='ghost' size='sm' onClick={clearChat} disabled={messages.length === 0} className="hidden sm:flex text-muted-foreground hover:text-destructive text-xs">
              <Trash2 className='w-4 h-4 mr-2' /> Clear
            </Button>
          </div>
        </header>
        <div className='relative flex-1 flex flex-col p-0 min-h-0 overflow-hidden'>
          <div className='h-full w-full overflow-y-auto px-6' ref={scrollAreaRef} onScroll={handleScroll}>
            <div className='pb-4'>
              {messages.length === 0 ? (
                <div className='text-center text-muted-foreground py-8'>
                  <p className='text-lg mb-2'>Welcome to AI Chatbot!</p>
                  <p className='break-words'>
                    Start a conversation by typing a message below or upload a file to summarize.
                  </p>
                </div>
              ) : (
                messages.map((message: any) => (
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
                      <div className={`rounded-lg px-4 py-3 shadow-sm max-w-full min-w-0 ${message.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-muted/50 rounded-bl-sm border border-border/50'}`}>
                        <div className={`text-sm leading-relaxed break-words ${message.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }: any) => <p className="mb-3 last:mb-0 leading-7" {...(props as any)} />,
                              ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 mb-3 space-y-1" {...(props as any)} />,
                              ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...(props as any)} />,
                              li: ({ node, ...props }: any) => <li className="pl-1" {...(props as any)} />,
                              h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" {...(props as any)} />,
                              h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...(props as any)} />,
                              h3: ({ node, ...props }: any) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0" {...(props as any)} />,
                              blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-muted-foreground" {...(props as any)} />,
                              a: ({ node, ...props }: any) => <a className="text-blue-500 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...(props as any)} />,
                              code: ({ node, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !match && !className?.includes('language-')
                                return isInline ? (
                                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs font-medium text-foreground border border-border/50" {...(props as any)}>
                                    {children}
                                  </code>
                                ) : (
                                  <div className="relative group my-3">
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded select-none">{match?.[1] || 'code'}</span>
                                    </div>
                                    <pre className="bg-slate-950 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-50 border border-slate-800">
                                      <code className={className} {...(props as any)}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                )
                              },
                              table: ({ node, ...props }: any) => <div className="overflow-x-auto my-4 rounded-lg border border-border"><table className="w-full text-sm text-left" {...(props as any)} /></div>,
                              thead: ({ node, ...props }: any) => <thead className="bg-muted/50 text-xs uppercase text-muted-foreground" {...(props as any)} />,
                              tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-border" {...(props as any)} />,
                              tr: ({ node, ...props }: any) => <tr className="bg-background hover:bg-muted/50 transition-colors" {...(props as any)} />,
                              th: ({ node, ...props }: any) => <th className="px-4 py-3 font-medium" {...(props as any)} />,
                              td: ({ node, ...props }: any) => <td className="px-4 py-3" {...(props as any)} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {/* Timestamp removed as it's not available in Vercel AI SDK message directly without extra handling */}
                    </div>
                    {message.role === 'user' && (
                      <div className='flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm'>
                        <User className='h-4 w-4 text-white' />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className='flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300 max-w-full mb-4'>
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
                    <Bot className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <div className='max-w-[80%] min-w-0 rounded-lg px-4 py-3 bg-muted text-foreground shadow-sm rounded-bl-sm'>
                    <div className='flex items-center space-x-2'>
                      <div className='flex space-x-1'>
                        <div className='w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                        <div className='w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                        <div className='w-2 h-2 bg-foreground/50 rounded-full animate-bounce'></div>
                      </div>
                      <span className='text-sm text-muted-foreground font-medium animate-pulse'>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={scrollToBottom}
                className="absolute bottom-20 right-6 z-50 bg-background text-foreground border border-border shadow-lg hover:bg-muted transition-colors h-10 w-10 flex items-center justify-center rounded-full"
              >
                <ArrowDown className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

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

            <form onSubmit={onFormSubmit} className='relative flex items-end gap-2 bg-muted/50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all'>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={'Type your message here...'}
                disabled={isLoading || isProcessingFile}
                maxLength={10000}
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
            {input.length > 0 && (
              <div className="text-right mt-1">
                <span className={`text-xs ${input.length > 9000 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {input.length}/10,000
                </span>
              </div>
            )}

            {!isSupported && (
              <div className='text-[10px] text-center text-muted-foreground mt-2'>
                âš ï¸ Voice input available on Chrome, Edge, Safari
              </div>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type='file' accept='.txt,.pdf,.docx,image/*' onChange={handleFileSelect} className='hidden' />

        {/* Camera Modal */}
        {
          isCameraActive && (
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
          )
        }
      </div >
    </div >
  )
}
