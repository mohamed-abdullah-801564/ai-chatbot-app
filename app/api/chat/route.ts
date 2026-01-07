import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query, messages, aiMode, selectedLanguage } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not found. Please add GEMINI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    if (apiKey === "your_api_key_here" || apiKey.startsWith("your_api_k")) {
      return NextResponse.json(
        {
          error:
            "Please replace the placeholder API key with your actual Google Gemini API key. Get one from https://makersuite.google.com/app/apikey",
        },
        { status: 500 },
      )
    }

    if (apiKey.length < 30) {
      return NextResponse.json(
        { error: "Gemini API key appears to be invalid (too short). Please check your API key." },
        { status: 500 },
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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

    if (aiMode === "translate" && selectedLanguage !== "english") {
      systemInstruction =
        "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions in English."
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
    let text = response.text()

    if (aiMode === "translate" && selectedLanguage !== "english") {
      const translateModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const translatePrompt = `Translate the following English text to ${languageConfig[selectedLanguage as keyof typeof languageConfig]?.label}. Respond only with the translation, no explanations or additional text:\n\n${text}`

      const translateResult = await translateModel.generateContent(translatePrompt)
      const translateResponse = await translateResult.response
      text = translateResponse.text()
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
