import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Increase timeout to 60 seconds
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    console.log("--- Chat API Request Started ---");

    // 1. Validate API Key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY is missing");
      return NextResponse.json(
        { error: "Server configuration error: Missing Google API Key" },
        { status: 500 }
      );
    }

    // 2. Initialize Google Provider
    const google = createGoogleGenerativeAI({ apiKey });

    // 3. Parse Body
    const body = await request.json();
    const { messages, aiMode, selectedLanguage } = body;

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
        if (profile.tier === 'free' && profile.daily_prompts_used >= 5) {
          return NextResponse.json(
            { error: "Limit Reached. You have used your 5 free daily prompts." },
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

    // 7. Start Stream with gemini-2.5-flash
    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages,
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
        console.error("STREAM ERROR:", error);
      }
    })

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("CRITICAL ERROR in /api/chat:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    )
  }
}