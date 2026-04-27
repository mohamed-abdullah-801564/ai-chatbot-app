"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { LandingPage } from "@/components/landing-page"
import { SignIn } from "@/components/auth/sign-in"
import { SignUp } from "@/components/auth/sign-up"
import { GuestChat } from "@/components/guest-chat"
import { Chatbot } from "@/components/chatbot"
import { MainInput } from "@/components/main-input"

type AppState = "landing" | "sign-in" | "sign-up" | "guest-chat" | "chat" | "guest-dashboard"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing")
  const { session, loading, signOut } = useAuth()
  const [initialMessage, setInitialMessage] = useState("")

  useEffect(() => {
    // This new logic is simpler and more stable.
    // It only runs when the loading or session state changes.
    // If a session exists, it ensures the app state is 'chat'.
    if (!loading && session && appState !== 'chat') {
      setAppState("chat")
    }
  }, [session, loading, appState])

  const handleGetStarted = useCallback(() => {
    setAppState("sign-in")
  }, [])

  const handleBackToLanding = useCallback(() => {
    setAppState("landing")
  }, [])

  const handleSwitchToSignUp = useCallback(() => {
    setAppState("sign-up")
  }, [])

  const handleSwitchToSignIn = useCallback(() => {
    setAppState("sign-in")
  }, [])

  const handleStartGuestChat = useCallback((message: string) => {
    setInitialMessage(message)
    setAppState("guest-chat")
  }, [])

  const handleGuestDashboard = useCallback(() => {
    setAppState("guest-dashboard")
  }, [])

  const handleGuestInputRedirect = useCallback((message: string) => {
    setInitialMessage(message)
    setAppState("guest-chat")
  }, [])

  const handleStartChat = useCallback((message: string) => {
    setInitialMessage(message)
    setAppState("chat")
  }, [])

  const handleBackToLandingFromGuest = useCallback(() => {
    setInitialMessage("")
    setAppState("landing")
  }, [])

  const handleLogout = useCallback(async () => {
    await signOut()
    setInitialMessage("")
    setAppState("landing")
  }, [signOut])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (session) {
    return <Chatbot key={session.user.id} initialMessage={initialMessage} onLogout={handleLogout} isGuest={false} />
  }

  if (appState === "landing") {
    return (
      <LandingPage
        onGetStarted={handleGetStarted}
        onStartGuestChat={handleStartGuestChat}
        onGuestDashboard={handleGuestDashboard}
      />
    )
  }

  if (appState === "sign-in") {
    return <SignIn onSwitchToSignUp={handleSwitchToSignUp} onBack={handleBackToLanding} />
  }

  if (appState === "sign-up") {
    return <SignUp onSwitchToSignIn={handleSwitchToSignIn} onBack={handleBackToLanding} />
  }

  if (appState === "guest-dashboard") {
    return <MainInput onStartChat={handleGuestInputRedirect} onLogout={handleBackToLanding} isGuest={true} />
  }

  if (appState === "guest-chat") {
    return (
      <GuestChat initialMessage={initialMessage} onBack={handleBackToLandingFromGuest} onSignUp={handleGetStarted} />
    )
  }

  return <LandingPage onGetStarted={handleGetStarted} onStartGuestChat={handleStartGuestChat} onGuestDashboard={handleGuestDashboard} />
}