interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ChatMessage {
  role: "user" | "model";
  parts: Array<{
    text: string;
  }>;
}

export class GeminiService {
  private apiKey: string;
  private apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Prepare conversation context
      const contents = [
        {
          role: "user",
          parts: [
            {
              text: `You are an English conversation tutor for Korean speakers. Your role is to:
1. Engage in natural, friendly conversation in English
2. Provide gentle corrections when needed
3. Ask follow-up questions to keep the conversation flowing
4. Use simple to intermediate English appropriate for learners
5. Be encouraging and supportive

Current conversation context:
${conversationHistory
  .map((msg) => `${msg.role}: ${msg.parts[0].text}`)
  .join("\n")}

User's new message: ${userMessage}

Please respond naturally as an English tutor would.`,
            },
          ],
        },
      ];

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API Error: ${response.status} ${
            response.statusText
          } - ${JSON.stringify(errorData)}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response generated from Gemini API");
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      return generatedText.trim();
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate response"
      );
    }
  }

  async analyzeTranslation(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Very low for consistent analysis
            topK: 5,
            topP: 0.9,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE",
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API Error: ${response.status} ${
            response.statusText
          } - ${JSON.stringify(errorData)}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response generated from Gemini API");
      }

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }

  async generateFeedback(message: string): Promise<{
    grammar: string;
    vocabulary: string;
    general: string;
  }> {
    try {
      const prompt = `Analyze this English message from a Korean learner and provide feedback:
"${message}"

Please provide feedback in this exact JSON format:
{
  "grammar": "Brief grammar feedback or 'Good grammar!' if correct",
  "vocabulary": "Vocabulary suggestions or 'Great word choice!' if appropriate", 
  "general": "General communication feedback and encouragement"
}

Keep each feedback point to 1-2 sentences and be encouraging.`;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 10,
            topP: 0.8,
            maxOutputTokens: 512,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const feedbackText = data.candidates[0].content.parts[0].text;

      // Parse JSON response
      try {
        const feedback = JSON.parse(feedbackText);
        return {
          grammar: feedback.grammar || "Good grammar!",
          vocabulary: feedback.vocabulary || "Great word choice!",
          general: feedback.general || "Keep up the great work!",
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          grammar: "Good effort! Keep practicing your grammar.",
          vocabulary: "Try using varied vocabulary to express your ideas.",
          general:
            "You're doing well! Keep practicing your English conversation.",
        };
      }
    } catch (error) {
      console.error("Gemini Feedback Error:", error);
      // Return default feedback on error
      return {
        grammar: "Keep practicing your grammar!",
        vocabulary: "Great vocabulary usage!",
        general: "You're making good progress in English!",
      };
    }
  }
}

export function createGeminiService(): GeminiService | null {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in environment variables");
    return null;
  }

  return new GeminiService(apiKey);
}
