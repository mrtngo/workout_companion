import { GoogleGenAI } from "@google/genai";
import { Meal, Workout } from "./storage";
import { getCurrentModel, cycleToNextModel, isRateLimitError, resetToFirstModel, AVAILABLE_MODELS } from "./model-cycler";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LLMResponse {
    text: string;
    action?: "LOG_WORKOUT" | "LOG_MEAL" | "SUGGESTION";
    data?: any;
}

/**
 * Helper function to call Gemini API with automatic model cycling on rate limits
 */
async function callGeminiWithRetry(
    contents: string,
    maxRetries: number = AVAILABLE_MODELS.length
): Promise<{ text: string }> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const currentModel = getCurrentModel();
        
        try {
            const response = await ai.models.generateContent({
                model: currentModel,
                contents,
            });
            
            // Extract text from response
            let responseText = "";
            if (typeof response.text === "string") {
                responseText = response.text;
            } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                responseText = response.candidates[0].content.parts[0].text;
            } else {
                console.warn("Unexpected response structure:", response);
                responseText = String(response) || "";
            }
            
            // If successful, reset to first model for next request (to start with fastest model)
            resetToFirstModel();
            
            return { text: responseText };
        } catch (error: any) {
            lastError = error;
            
            // Log the error for debugging
            console.error(`Error calling Gemini API with model ${currentModel}:`, {
                message: error?.message,
                code: error?.code,
                status: error?.status,
                error: error
            });
            
            // Check if it's a rate limit error
            if (isRateLimitError(error)) {
                console.warn(`Rate limit hit on model ${currentModel}, cycling to next model...`);
                
                // Cycle to next model for next attempt
                cycleToNextModel();
                
                // If we've tried all models, reset and throw
                if (attempt === maxRetries - 1) {
                    resetToFirstModel();
                    throw error;
                }
                
                // Continue to next iteration
                continue;
            } else {
                // Not a rate limit error, throw immediately
                throw error;
            }
        }
    }
    
    // Should never reach here, but just in case
    throw lastError || new Error("Failed to call Gemini API after all retries");
}

export const llmService = {
    processInput: async (userInput: string, context?: {
        recentWorkouts?: Workout[];
        recentMeals?: Meal[];
        ultrahumanData?: any;
    }): Promise<LLMResponse> => {
        try {
            // Optimized shorter prompt for faster processing
            const systemPrompt = `Fitness assistant. Detect and log workouts/meals. Extract date/time from user input if mentioned (e.g., "yesterday", "2 hours ago", "at 2pm"). If no date/time is mentioned, use current timestamp. Respond ONLY with valid JSON, no extra text.

Workout format: {"action":"LOG_WORKOUT","data":{"name":"Name","date":"ISO8601","exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":0}]}]},"text":"Logged!"}
Meal format: {"action":"LOG_MEAL","data":{"name":"Food","date":"ISO8601","calories":100,"protein":5,"carbs":20,"fats":3},"text":"Logged: Food (100 kcal)"}
Date format: ISO8601 string (e.g., "2024-01-15T14:30:00.000Z"). If user mentions "yesterday", "2 hours ago", "at 2pm", etc., calculate the date. If no date mentioned, use current exact timestamp.
Other: {"text":"Your response"}`;

            // Minimize context - only send essential data
            const userContext = context ? `\nContext: ${JSON.stringify({
                recentWorkouts: context.recentWorkouts?.slice(0, 2) || [],
                recentMeals: context.recentMeals?.slice(0, 2) || []
            })}` : "";

            // Use model cycler with automatic retry on rate limits
            const response = await callGeminiWithRetry(
                systemPrompt + "\nUser: " + userInput + userContext
            );

            const responseText = response.text;

            // Try to parse JSON response (handle markdown code fences)
            try {
                let jsonText = responseText.trim();
                // Remove markdown code fences if present
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
                } else if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
                }

                const jsonResponse = JSON.parse(jsonText);
                return jsonResponse;
            } catch {
                // If not JSON, return as text
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