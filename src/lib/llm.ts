import { GoogleGenAI } from "@google/genai";
import { Meal, Workout } from "./storage";

const ai = new GoogleGenAI({});

export interface LLMResponse {
    text: string;
    action?: "LOG_WORKOUT" | "LOG_MEAL" | "SUGGESTION";
    data?: any;
}

export const llmService = {
    processInput: async (userInput: string, context?: {
        recentWorkouts?: Workout[];
        recentMeals?: Meal[];
        ultrahumanData?: any;
    }): Promise<LLMResponse> => {
        try {
            // Optimized shorter prompt for faster processing
            const systemPrompt = `Fitness assistant. Detect and log workouts/meals. Respond ONLY with valid JSON, no extra text.

Workout format: {"action":"LOG_WORKOUT","data":{"name":"Name","exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":0}]}]},"text":"Logged!"}
Meal format: {"action":"LOG_MEAL","data":{"name":"Food","calories":100,"protein":5,"carbs":20,"fats":3},"text":"Logged: Food (100 kcal)"}
Other: {"text":"Your response"}`;

            // Minimize context - only send essential data
            const userContext = context ? `\nContext: ${JSON.stringify({
                recentWorkouts: context.recentWorkouts?.slice(0, 2) || [],
                recentMeals: context.recentMeals?.slice(0, 2) || []
            })}` : "";

            // Use fastest model with optimized settings
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-lite", // Fast lite model
                contents: systemPrompt + "\nUser: " + userInput + userContext,
            });

            const responseText = response.text || "";

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

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-lite", // Fast lite model
                contents: systemPrompt + "\n\nGenerate a workout suggestion based on this context:\n" + userContext,
            });

            return response.text || "Time for a workout!";
        } catch (error) {
            console.error("Error generating suggestion:", error);
            return "Time for a great workout today!";
        }
    },
};