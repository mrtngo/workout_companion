import { Meal, Workout } from "./storage";
import { getCurrentModel, cycleToNextModel, isRateLimitError, resetToFirstModel, AVAILABLE_MODELS } from "./model-cycler";

export interface LLMResponse {
    text: string;
    action?: "LOG_WORKOUT" | "LOG_MEAL" | "SUGGESTION";
    data?: any;
}

async function callGeminiWithRetry(
    prompt: string,
    imageData?: { base64: string; mimeType: string },
    maxRetries: number = AVAILABLE_MODELS.length
): Promise<{ text: string }> {
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const currentModel = getCurrentModel();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        try {
            const parts: any[] = [{ text: prompt }];
            if (imageData) {
                parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } });
            }

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts }],
                    }),
                }
            );

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                const err: any = new Error(errBody?.error?.message || `HTTP ${res.status}`);
                err.code = res.status;
                err.status = res.status;
                throw err;
            }

            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            resetToFirstModel();
            return { text };
        } catch (error: any) {
            lastError = error;
            console.error(`Gemini error (model: ${currentModel}):`, error?.message);

            if (isRateLimitError(error)) {
                cycleToNextModel();
                if (attempt === maxRetries - 1) {
                    resetToFirstModel();
                    throw error;
                }
                continue;
            }

            throw error;
        }
    }

    throw lastError || new Error("Failed after all retries");
}

export const llmService = {
    processInput: async (userInput: string, context?: {
        recentWorkouts?: Workout[];
        recentMeals?: Meal[];
        ultrahumanData?: any;
    }, imageData?: { base64: string; mimeType: string }): Promise<LLMResponse> => {
        try {
            let prompt: string;

            if (imageData) {
                const now = new Date().toISOString();
                prompt = `You are a nutrition expert. Look at the food in this image. Identify all dishes/items visible and estimate the total calories, protein, carbs, and fats for the whole meal. Respond ONLY with JSON:
{"action":"LOG_MEAL","data":{"name":"<description>","date":"${now}","calories":N,"protein":N,"carbs":N,"fats":N},"text":"Logged: <description> (N kcal)"}`;
            } else {
                const now = new Date().toISOString();
                const systemPrompt = `You are a fitness and nutrition assistant. Detect and log workouts/meals from user input. Respond ONLY with valid JSON, no extra text.

Current date/time: ${now}

For MEALS: Use your nutrition knowledge to estimate realistic calories, protein, carbs, and fats based on the food and quantity mentioned. For example, 300g of beef ≈ 750 kcal, 69g protein, 0g carbs, 54g fats. Never return 0 for calories if the user mentioned a real food.

For DATES: Extract date/time if mentioned (e.g. "yesterday", "2 hours ago", "at 2pm"). If no date mentioned, use exactly: "${now}".

Meal format: {"action":"LOG_MEAL","data":{"name":"Food description","date":"ISO8601","calories":750,"protein":69,"carbs":0,"fats":54},"text":"Logged: Food (750 kcal)"}
Workout format: {"action":"LOG_WORKOUT","data":{"name":"Workout name","date":"ISO8601","exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":60}]}]},"text":"Logged workout!"}
Other responses: {"text":"Your response"}

Always estimate nutrition realistically — never return 0 calories for real food.`;

                const userContext = context ? `\nContext: ${JSON.stringify({
                    recentWorkouts: context.recentWorkouts?.slice(0, 2) || [],
                    recentMeals: context.recentMeals?.slice(0, 2) || []
                })}` : "";

                prompt = systemPrompt + "\nUser: " + userInput + userContext;
            }

            const response = await callGeminiWithRetry(prompt, imageData);

            const responseText = response.text;

            try {
                let jsonText = responseText.trim();
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
                } else if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
                }
                return JSON.parse(jsonText);
            } catch {
                return { text: responseText };
            }
        } catch (error) {
            console.error("Error calling Gemini:", error);
            return {
                text: "Sorry, I'm having trouble processing your request right now. Please try again.",
            };
        }
    },

    generateSuggestion: async (context?: {
        recentWorkouts?: Workout[];
        recentMeals?: Meal[];
        ultrahumanData?: any;
    }): Promise<string> => {
        try {
            const systemPrompt = `You are a fitness coach. Generate a short, personalized workout suggestion based on the user's context. Keep it to 1-2 sentences. Use markdown bold (**text**) for emphasis.`;
            const userContext = context ? JSON.stringify(context, null, 2) : "No context available";
            const response = await callGeminiWithRetry(
                systemPrompt + "\n\nGenerate a workout suggestion based on this context:\n" + userContext
            );
            return response.text || "Time for a workout!";
        } catch (error) {
            console.error("Error generating suggestion:", error);
            return "Time for a great workout today!";
        }
    },
};
