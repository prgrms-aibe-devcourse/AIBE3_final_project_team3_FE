import { createGeminiService } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  needsTranslation?: boolean;
}

interface FeedbackRequest {
  message: string;
  type: "feedback";
}

export async function POST(request: NextRequest) {
  try {
    const geminiService = createGeminiService();

    if (!geminiService) {
      return NextResponse.json(
        {
          error:
            "Gemini API service not available. Please check your API key configuration.",
        },
        { status: 500 }
      );
    }

    const body: ChatRequest | FeedbackRequest = await request.json();

    // Handle feedback request
    if ("type" in body && body.type === "feedback") {
      const feedback = await geminiService.generateFeedback(body.message);
      return NextResponse.json({ feedback });
    }

    // Handle chat request
    const {
      message,
      conversationHistory = [],
      needsTranslation = false,
    } = body as ChatRequest;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let finalMessage = message;
    let translatedWords: string[] = [];

    // Handle translation if needed
    if (needsTranslation) {
      const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(message);

      if (hasKorean) {
        const translationPrompt = `Please translate the following mixed Korean-English text into proper, natural English. Fix any grammar issues and make it sound like a native English speaker would say it. Return a JSON response with this exact format:
{
  "translatedText": "grammatically correct, natural English sentence",
  "translatedWords": ["한국어 → english", "another → translation"]
}

Text to translate: "${message}"

Important: 
- Translate Korean words/phrases to English
- Keep existing English words but fix grammar and word order
- Make the final sentence grammatically correct and natural
- Return valid JSON format
- List Korean words that were translated in translatedWords array
- The final sentence should sound like natural English, not word-for-word translation

Examples:
"오늘 날씨가 good outside" → "The weather is good outside today"
"I want to eat 김치 at 집" → "I want to eat kimchi at home"`;

        try {
          const translationResponse = await geminiService.generateResponse(
            translationPrompt,
            []
          );

          // Parse translation response
          let cleanResponse = translationResponse;
          cleanResponse = cleanResponse
            .replace(/```json\n?/g, "")
            .replace(/```/g, "");
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanResponse = jsonMatch[0];
          }

          const parsedTranslation = JSON.parse(cleanResponse);
          finalMessage = parsedTranslation.translatedText || message;
          translatedWords = parsedTranslation.translatedWords || [];
        } catch (translationError) {
          console.error(
            "Translation failed, using original message:",
            translationError
          );
          // Continue with original message if translation fails
        }
      }
    }

    // Generate AI response using final (possibly translated) message
    const aiResponse = await geminiService.generateResponse(
      finalMessage,
      conversationHistory
    );

    // Return the response
    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
      translatedMessage: needsTranslation ? finalMessage : undefined,
      translatedWords: needsTranslation ? translatedWords : undefined,
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Chat API is running. Use POST to send messages." },
    { status: 200 }
  );
}
