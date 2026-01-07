import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { query, messages, aiMode, selectedLanguage } = await request.json()

    // Initialize Supabase Client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any) {
            // We don't need to set cookies in this route
          }
        }
      }
    )

    // Check User Session
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, daily_prompts_used')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.tier === 'free' && profile.daily_prompts_used >= 5) {
          return NextResponse.json(
            { error: "Limit Reached. You have used your 5 free daily prompts." },
            { status: 403 }
          )
        }

        // Increment usage if not over limit (we do this AFTER success usually, but for simplicity we can do it here or better, after success)
        // Ideally we increment after ensuring Gemini call works, so let's defer the increment.
      }
    }

    const apiKey = process.env.GEMINI_API_KEY!

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const modeConfig = {
      chat: {
        systemInstruction:
          "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions.",
      },
      translate: {
        systemInstruction:
          "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions in English.",
      },
    }

    const languageConfig = {
      spanish: { label: "Spanish" },
      french: { label: "French" },
      german: { label: "German" },
      italian: { label: "Italian" },
      portuguese: { label: "Portuguese" },
      russian: { label: "Russian" },
      japanese: { label: "Japanese" },
      korean: { label: "Korean" },
      chinese: { label: "Chinese" },
      arabic: { label: "Arabic" },
      hindi: { label: "Hindi" },
      english: { label: "English" },
    }

    let systemInstruction =
      modeConfig[aiMode as keyof typeof modeConfig]?.systemInstruction || modeConfig.chat.systemInstruction

    // Combine translation logic into system instruction for single-shot response
    if (aiMode === "translate" && selectedLanguage !== "english") {
      const targetLanguage = languageConfig[selectedLanguage as keyof typeof languageConfig]?.label || selectedLanguage
      systemInstruction = `You are a helpful AI assistant. Translate the user's input to ${targetLanguage}. Respond ONLY with the translation, no explanations or additional text.`
    }

    const conversationHistory = [
      {
        role: "user",
        parts: [{ text: systemInstruction }],
      },
    ]

    const recentMessages = messages.slice(-10)
    recentMessages.forEach((msg: any) => {
      conversationHistory.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })
    })

    conversationHistory.push({
      role: "user",
      parts: [{ text: query }],
    })

    const chat = model.startChat({
      history: conversationHistory.slice(0, -1),
    })

    const result = await chat.sendMessage(query)
    const response = await result.response
    const text = response.text()

    // Increment usage count for logged-in users ONLY after successful API response
    if (user) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('daily_prompts_used')
        .eq('id', user.id)
        .single()

      if (currentProfile) {
        await supabase.from('profiles').update({ daily_prompts_used: (currentProfile.daily_prompts_used || 0) + 1 }).eq('id', user.id)
      }
    }

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error calling Gemini API:", error)

    if (error instanceof Error) {
      if (error.message.includes("API_KEY_INVALID")) {
        return NextResponse.json(
          {
            error: "Invalid API key. Please check that your GEMINI_API_KEY is correct and has the proper permissions.",
          },
          { status: 401 },
        )
      }
      if (error.message.includes("PERMISSION_DENIED")) {
        return NextResponse.json(
          { error: "Permission denied. Please ensure your API key has access to the Gemini API." },
          { status: 403 },
        )
      }
      if (error.message.includes("placeholder API key") || error.message.includes("makersuite.google.com")) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Failed to get response from AI. Please try again." }, { status: 500 })
  }
}
