/**
 * Model cycler for handling rate limits by rotating through available Gemini models
 */

export const AVAILABLE_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash-tts",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
] as const;

let currentModelIndex = 0;

/**
 * Checks if an error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = String(error?.message || error?.toString() || "").toLowerCase();
    const errorCode = error?.code || error?.status || error?.statusCode;
    
    // Check nested error properties (GoogleGenAI SDK might nest errors)
    const nestedError = error?.error || error?.cause || error?.details;
    const nestedMessage = nestedError ? String(nestedError?.message || nestedError?.toString() || "").toLowerCase() : "";
    const nestedCode = nestedError?.code || nestedError?.status || nestedError?.statusCode;
    
    // Check for common rate limit indicators
    const isRateLimit = (
        errorCode === 429 ||
        errorCode === "RESOURCE_EXHAUSTED" ||
        nestedCode === 429 ||
        nestedCode === "RESOURCE_EXHAUSTED" ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("resource_exhausted") ||
        errorMessage.includes("429") ||
        errorMessage.includes("too many requests") ||
        nestedMessage.includes("rate limit") ||
        nestedMessage.includes("quota") ||
        nestedMessage.includes("resource_exhausted") ||
        nestedMessage.includes("429") ||
        nestedMessage.includes("too many requests")
    );
    
    if (isRateLimit) {
        console.log("Rate limit detected:", { errorCode, nestedCode, errorMessage: errorMessage.substring(0, 100), nestedMessage: nestedMessage.substring(0, 100) });
    }
    
    return isRateLimit;
}

/**
 * Gets the current model
 */
export function getCurrentModel(): string {
    return AVAILABLE_MODELS[currentModelIndex];
}

/**
 * Cycles to the next model and returns it
 */
export function cycleToNextModel(): string {
    currentModelIndex = (currentModelIndex + 1) % AVAILABLE_MODELS.length;
    const newModel = AVAILABLE_MODELS[currentModelIndex];
    console.log(`Cycling to next model: ${newModel}`);
    return newModel;
}

/**
 * Resets to the first model
 */
export function resetToFirstModel(): void {
    currentModelIndex = 0;
    console.log(`Reset to first model: ${AVAILABLE_MODELS[0]}`);
}

