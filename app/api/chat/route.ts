import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText } from "ai"
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Increase timeout to 60 seconds
export const maxDuration = 60;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (identifier: string, limit: number = 20, windowMs: number = 60000) => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return false; // not limited
  }

  if (record.count >= limit) return true; // limited

  record.count++;
  return false;
};

export async function POST(request: NextRequest) {
  try {
    console.log("--- Chat API Request Started ---");

    const requiredEnvVars = [
      'GOOGLE_GENERATIVE_AI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }
    }

    // 1. Validate API Key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // 2. Initialize Google Provider
    const google = createGoogleGenerativeAI({ apiKey: apiKey! });

    // 3. Parse Body
    const body = await request.json();
    const { messages, aiMode, selectedLanguage } = body;

    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    if (rateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    // Validate messages exist and is array
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages must be an array" },
        { status: 400 }
      );
    }

    // Limit message count to prevent token abuse
    if (messages.length > 50) {
      return NextResponse.json(
        { error: "Too many messages in context" },
        { status: 400 }
      );
    }

    // Validate each message content length
    const MAX_MESSAGE_LENGTH = 10000;
    for (const msg of messages) {
      if (typeof msg.content === 'string' && msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: "Message too long. Maximum 10,000 characters." },
          { status: 400 }
        );
      }
    }

    // Validate aiMode is one of allowed values
    const allowedModes = ['normal', 'code', 'translate', 'summarize'];
    if (aiMode && !allowedModes.includes(aiMode)) {
      return NextResponse.json(
        { error: "Invalid AI mode" },
        { status: 400 }
      );
    }

    // 4. Initialize Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (err) { /* ignore */ }
          },
        },
      }
    )

    // 5. Check Session
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        // 1. Calculate Today (UTC)
        const today = new Date().toISOString().split('T')[0];

        // 2. Check for Reset
        if (!profile.daily_prompts_reset_date || profile.daily_prompts_reset_date !== today) {
          console.log(`[RESET] Old Date: ${profile.daily_prompts_reset_date}, New Date: ${today}`);

          // Update DB
          await supabase.from('profiles').update({
            daily_prompts_used: 0,
            daily_prompts_reset_date: today
          }).eq('id', user.id);

          // CRITICAL: Update local variable so the limit check passes!
          profile.daily_prompts_used = 0;
        }

        // 3. Check Limit
        if ((profile.subscription_tier === 'free' || !profile.subscription_tier) && profile.daily_prompts_used >= 5) {
          return NextResponse.json(
            { error: "Daily limit reached" },
            { status: 403 }
          );
        }
      }
    }

    // 6. Define System Instructions
    let systemInstruction = "You are a helpful AI assistant.";
    if (aiMode === "translate") {
      systemInstruction = `Translate the input to ${selectedLanguage}. Respond ONLY with the translation.`;
    } else if (aiMode === "code") {
      systemInstruction = "You are an expert coding assistant.";
    }

    // LOGGING: Confirming the model version in logs
    console.log(`Calling Model: gemini-2.5-flash with ${messages?.length} messages`);

    // Preprocess messages for image attachments
    const processedMessages = messages.map((msg: any) => {
      if (msg.experimental_attachments && msg.experimental_attachments.length > 0) {
        const imageParts = msg.experimental_attachments
          .filter((att: any) => att.contentType?.startsWith('image/'))
          .map((att: any) => ({
            type: 'image' as const,
            image: att.url, // base64 data URL
          }));

        return {
          ...msg,
          content: [
            { type: 'text', text: msg.content || 'Describe this image in detail.' },
            ...imageParts,
          ],
        };
      }
      return msg;
    });

    // 7. Start Stream with gemini-2.5-flash
    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: processedMessages,
      system: systemInstruction,
      async onFinish() {
        console.log("Stream finished successfully.");
        if (user) {
          try {
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('daily_prompts_used')
              .eq('id', user.id)
              .single()
            if (currentProfile) {
              await supabase.from('profiles').update({ daily_prompts_used: (currentProfile.daily_prompts_used || 0) + 1 }).eq('id', user.id)
            }
          } catch (e) { console.error("Usage update failed", e) }
        }
      },
      onError({ error }) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (/quota|rate limit|429/i.test(errorMessage.toLowerCase())) {
          console.error("AI service is temporarily at capacity. Please try again in a few minutes.");
        } else {
          console.error("STREAM ERROR:", error);
        }
      }
    })

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("CRITICAL ERROR in /api/chat:", error)
    
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "AI service is temporarily at capacity. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    )
  }
}