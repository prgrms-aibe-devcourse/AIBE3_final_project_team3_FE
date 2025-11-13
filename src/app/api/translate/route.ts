import { createGeminiService } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

interface TranslateRequest {
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const geminiService = createGeminiService();

    if (!geminiService) {
      return NextResponse.json(
        {
          error:
            "Translation service not available. Please check your API key configuration.",
        },
        { status: 500 }
      );
    }

    const { text }: TranslateRequest = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "Text is required for translation" },
        { status: 400 }
      );
    }

    // Check if text contains Korean characters
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

    if (!hasKorean) {
      return NextResponse.json({
        translatedText: text,
        translatedWords: [],
      });
    }

    // Use Gemini API for translation
    const translationPrompt = `Please translate the following mixed Korean-English text into proper, natural English. Fix any grammar issues and make it sound like a native English speaker would say it. Return a JSON response with this exact format:
{
  "translatedText": "grammatically correct, natural English sentence",
  "translatedWords": ["한국어 → english", "another → translation"]
}

Text to translate: "${text}"

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

    const response = await geminiService.generateResponse(
      translationPrompt,
      []
    );

    // Parse the JSON response
    try {
      // Clean the response to extract JSON
      let cleanResponse = response;

      // Remove markdown code blocks if present
      cleanResponse = cleanResponse
        .replace(/```json\n?/g, "")
        .replace(/```/g, "");

      // Find JSON object in the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const parsedResponse = JSON.parse(cleanResponse);

      return NextResponse.json({
        translatedText: parsedResponse.translatedText || text,
        translatedWords: parsedResponse.translatedWords || [],
      });
    } catch (parseError) {
      console.error("Failed to parse translation response:", parseError);

      // Fallback: return original text
      return NextResponse.json({
        translatedText: text,
        translatedWords: [],
        warning: "Translation parsing failed, using original text",
      });
    }
  } catch (error) {
    console.error("Translation API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: "Failed to translate text",
        details: errorMessage,
        translatedText: (await request.json()).text, // Fallback to original
        translatedWords: [],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Translation API is running. Use POST to translate text." },
    { status: 200 }
  );
}
