import { createGeminiService } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

interface AnalyzeRequest {
  originalText: string;
  translatedText: string;
}

interface GrammarError {
  id: string;
  error: string;
  correction: string;
  explanation: string;
  category: string;
}

interface VocabularyIssue {
  id: string;
  word: string;
  suggestion: string;
  meaning: string;
  example: string;
}

interface AnalysisResult {
  hasErrors: boolean;
  grammarErrors: GrammarError[];
  vocabularyIssues: VocabularyIssue[];
  suggestions: string[];
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

    const { originalText, translatedText }: AnalyzeRequest =
      await request.json();

    if (!originalText || !translatedText) {
      return NextResponse.json(
        { error: "Both originalText and translatedText are required" },
        { status: 400 }
      );
    }

    const analysisPrompt = `You are a strict English grammar teacher. Your job is to find errors in the ORIGINAL text that a Korean speaker wrote, NOT to evaluate the final corrected translation.

**TASK**: Analyze the ORIGINAL mixed Korean-English text for grammatical errors before it was corrected.

**ORIGINAL TEXT TO ANALYZE**: "${originalText}"
**CORRECTED VERSION (for reference)**: "${translatedText}"

**YOUR JOB**: Find what was wrong in "${originalText}" that needed to be fixed to become "${translatedText}".

**CRITICAL INSTRUCTION**: 
- Focus ONLY on errors present in "${originalText}"
- Compare "${originalText}" vs "${translatedText}" to see what was corrected
- If the translation fixed something, that means there was an error in the original

**EXAMPLE ANALYSIS**:
Original: "hello, my name Zeri"
Corrected: "Hello, my name is Zeri"
ERROR FOUND: Missing "is" verb in "my name Zeri"

Original: "weather is outside very good"  
Corrected: "weather is very good outside"
ERROR FOUND: Wrong word order in "outside very good"

**RETURN THIS EXACT JSON FORMAT**:
{
  "hasErrors": boolean,
  "grammarErrors": [
    {
      "id": "unique_id",
      "error": "exact error from original text",
      "correction": "how it should be written", 
      "explanation": "why this is wrong and how to fix it",
      "category": "error type"
    }
  ],
  "vocabularyIssues": [
    {
      "id": "unique_id", 
      "word": "problematic word from original",
      "suggestion": "better word choice",
      "meaning": "meaning of suggested word",
      "example": "example sentence"
    }
  ],
  "suggestions": ["learning tips based on errors found"]
}

**BE VERY STRICT**: If ANYTHING was changed from original to corrected version, it means there was an error. Find it and report it.

**COMMON KOREAN SPEAKER ERRORS TO LOOK FOR**:
1. Missing be verbs: "my name John" (missing "is")
2. Wrong word order: "very good outside" instead of "very good outside" 
3. Missing articles: "go school" (missing "to")
4. Wrong tense with time expressions: "have lunch ago" (should be "had")
5. Literal Korean translations that don't work in English

**ANALYZE NOW**: Find ALL errors in "${originalText}" that were fixed in "${translatedText}".`;

    let analysisResponse = "";

    try {
      analysisResponse = await geminiService.analyzeTranslation(analysisPrompt);

      // Debug logging
      console.log("=== AI Analysis Debug ===");
      console.log("Original:", originalText);
      console.log("Translated:", translatedText);
      console.log("AI Response:", analysisResponse);

      // Parse AI response - more robust JSON extraction
      let cleanResponse = analysisResponse;

      // Remove markdown formatting
      cleanResponse = cleanResponse
        .replace(/```json\n?/g, "")
        .replace(/```/g, "");

      // Remove everything before first {
      const firstBrace = cleanResponse.indexOf("{");
      if (firstBrace > 0) {
        cleanResponse = cleanResponse.substring(firstBrace);
      }

      // Find JSON object more accurately
      let jsonStart = cleanResponse.indexOf("{");
      let jsonEnd = -1;
      let braceCount = 0;

      for (let i = jsonStart; i < cleanResponse.length; i++) {
        if (cleanResponse[i] === "{") braceCount++;
        if (cleanResponse[i] === "}") braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
      }

      console.log("Extracted JSON:", cleanResponse);

      // Try to parse, with fallback for incomplete JSON
      let analysisResult: AnalysisResult;
      try {
        analysisResult = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.log("JSON parse failed, attempting to fix incomplete JSON...");

        // Try to fix common JSON issues
        let fixedJson = cleanResponse;

        // Fix unclosed strings
        if (
          fixedJson.includes('"explanation": "') &&
          !fixedJson.includes('"}')
        ) {
          fixedJson = fixedJson.replace(/("explanation": "[^"]*?)$/, '$1"}');
        }

        // Add missing closing brackets
        const openBraces = (fixedJson.match(/\{/g) || []).length;
        const closeBraces = (fixedJson.match(/\}/g) || []).length;
        const openBrackets = (fixedJson.match(/\[/g) || []).length;
        const closeBrackets = (fixedJson.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedJson += "]";
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += "}";
        }

        try {
          analysisResult = JSON.parse(fixedJson);
          console.log("✅ Fixed JSON successfully parsed");
        } catch (fixError) {
          console.log("❌ Could not fix JSON, returning empty result");
          throw parseError; // Re-throw original error
        }
      }

      // Add unique IDs if not present
      analysisResult.grammarErrors =
        analysisResult.grammarErrors?.map((error, index) => ({
          ...error,
          id: error.id || `grammar_${Date.now()}_${index}`,
        })) || [];

      analysisResult.vocabularyIssues =
        analysisResult.vocabularyIssues?.map((issue, index) => ({
          ...issue,
          id: issue.id || `vocab_${Date.now()}_${index}`,
        })) || [];

      // If AI still finds no errors, log it but trust AI analysis
      if (!analysisResult.hasErrors) {
        console.log("⚠️ AI found no errors in original text:", originalText);
        console.log("📝 Corrected text:", translatedText);
      } else {
        console.log(
          "✅ AI successfully found",
          analysisResult.grammarErrors.length,
          "grammar errors"
        );
      }

      return NextResponse.json(analysisResult);
    } catch (parseError) {
      console.error("Failed to parse analysis response:", parseError);
      console.error("Raw response was:", analysisResponse);

      // If AI parsing fails, return empty result - no manual fallback
      return NextResponse.json({
        hasErrors: false,
        grammarErrors: [],
        vocabularyIssues: [],
        suggestions: ["AI analysis failed - please try again"],
      });
    }
  } catch (error) {
    console.error("Analysis API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: "Failed to analyze message",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
