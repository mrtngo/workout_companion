"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  X,
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react";
import { aiLogic } from "@/lib/ai-logic";
import { storage, Conversation, ConversationMessage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    videoUrl?: string;
    imageUrl?: string;
    timestamp?: string;
}

export default function AssistantPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { language, t } = useLanguage();
    
    const messageParam = searchParams.get("message");

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Collapsed by default on mobile console
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    
    const [pendingImage, setPendingImage] = useState<{
        base64: string; mimeType: string; previewUrl: string;
    } | null>(null);

    // Load conversations on mount
    useEffect(() => {
        if (!user) {
            setIsLoadingConversations(false);
            return;
        }

        const loadConversations = async () => {
            try {
                const convos = await storage.getConversations(user.uid);
                setConversations(convos);
                
                if (convos.length > 0 && !currentConversationId) {
                    setCurrentConversationId(convos[0].id);
                } else if (convos.length === 0) {
                    const newConvId = await storage.createConversation(user.uid);
                    const updatedConvos = await storage.getConversations(user.uid);
                    setConversations(updatedConvos);
                    setCurrentConversationId(newConvId);
                }
            } catch (error) {
                console.error("Error loading conversations:", error);
            } finally {
                setIsLoadingConversations(false);
            }
        };

        loadConversations();
    }, [user]);

    // Load messages when conversation changes
    useEffect(() => {
        if (!user || !currentConversationId) return;

        const loadMessages = async () => {
            try {
                const loadedMessages = await storage.getConversationMessages(user.uid, currentConversationId);
                setMessages(loadedMessages.map(msg => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    videoUrl: msg.videoUrl,
                    imageUrl: msg.imageUrl,
                    timestamp: msg.timestamp
                })));
            } catch (error) {
                console.error("Error loading messages:", error);
            }
        };

        loadMessages();
    }, [user, currentConversationId]);

    // Auto-fill query parameter message on load
    useEffect(() => {
        if (messageParam && currentConversationId) {
            setInput(messageParam);
        }
    }, [messageParam, currentConversationId]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleCreateConversation = async () => {
        if (!user) return;

        try {
            const newConvId = await storage.createConversation(user.uid);
            const updatedConvos = await storage.getConversations(user.uid);
            setConversations(updatedConvos);
            setCurrentConversationId(newConvId);
            setIsSidebarOpen(false); // auto-close on selection
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const handleSelectConversation = (conversationId: string) => {
        setCurrentConversationId(conversationId);
        setIsSidebarOpen(false);
    };

    const saveMessageToFirestore = async (message: Message) => {
        if (!user || !currentConversationId) return;

        try {
            await storage.saveMessage(user.uid, currentConversationId, {
                id: message.id,
                role: message.role,
                content: message.content,
                videoUrl: message.videoUrl,
                imageUrl: message.imageUrl,
                timestamp: message.timestamp || new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error saving message:", error);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const maxSize = 1024;
                let { width, height } = img;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
                setPendingImage({ base64, mimeType: "image/jpeg", previewUrl: dataUrl });
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const callGeminiClientSide = async (
        userInput: string, 
        capturedImage: any, 
        recentWorkouts: any, 
        recentMeals: any
    ) => {
        const directApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!directApiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined in env");

        const nowStr = new Date().toISOString();
        const targetLang = language === "es" ? "Spanish (ES)" : "English (EN)";
        
        const clientSystemPrompt = `You are a fitness, nutrition, and general assistant. Detect and log workouts/meals from user input, or answer questions naturally on any topic including training, meals, recovery, health, or general subjects. Respond ONLY with valid JSON, no extra text.

Current date/time: ${nowStr}

Respond in the user's preferred language: ${targetLang}.

For MEALS: Use your nutrition knowledge to estimate realistic calories, protein, carbs, and fats based on the food and quantity mentioned. For example, 300g of beef ≈ 750 kcal, 69g protein, 0g carbs, 54g fats. Never return 0 for calories if the user mentioned a real food.

For DATES: Extract date/time if mentioned (e.g. "yesterday", "2 hours ago", "at 2pm"). If no date mentioned, use exactly: "${nowStr}".

Meal format: {"action":"LOG_MEAL","data":{"name":"Food description","date":"ISO8601","calories":750,"protein":69,"carbs":0,"fats":54},"text":"Logged: Food (750 kcal)"}
Workout format: {"action":"LOG_WORKOUT","data":{"name":"Workout name","date":"ISO8601","exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":60}]}]},"text":"Logged workout!"}
Other responses (general conversation or QA): {"text":"Your response"}

Always estimate nutrition realistically -- never return 0 calories for real food. Keep responses helpful, natural, and friendly.`;

        const parts: Array<{ text: string } | { inlineData: any }> = [{ text: `${clientSystemPrompt}\nUser: ${userInput}` }];
        if (capturedImage) {
            parts.push({
                inlineData: {
                    mimeType: capturedImage.mimeType,
                    data: capturedImage.base64
                }
            });
        }

        const geminiModel = "gemini-1.5-flash";
        const directResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${directApiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts }],
                    safetySettings: [
                      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            }
        );

        if (!directResponse.ok) {
            throw new Error(`Direct Gemini API HTTP error: ${directResponse.status}`);
        }

        const data = await directResponse.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        let jsonText = responseText.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        try {
            return JSON.parse(jsonText);
        } catch {
            return { text: responseText };
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !pendingImage) return;
        if (!user || !currentConversationId) return;

        const capturedImage = pendingImage;
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            imageUrl: capturedImage?.previewUrl,
            timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, userMessage]);
        await saveMessageToFirestore(userMessage);
        setInput("");
        setPendingImage(null);
        setIsLoading(true);

        let videoUrl: string | undefined = undefined;
        const lowerInput = userMessage.content.toLowerCase();
        if (lowerInput.includes("bench press") && lowerInput.includes("how to")) {
            videoUrl = "https://www.youtube.com/embed/rT7DgCr-3pg";
        } else if (lowerInput.includes("squat") && lowerInput.includes("how to")) {
            videoUrl = "https://www.youtube.com/embed/YaXPRqUwItQ";
        } else if (lowerInput.includes("deadlift") && lowerInput.includes("how to")) {
            videoUrl = "https://www.youtube.com/embed/op9kVnSso6Q";
        }

        try {
            const [recentWorkouts, recentMeals] = await Promise.all([
                storage.getWorkouts(user.uid).catch(() => []),
                storage.getMeals(user.uid).catch(() => [])
            ]);

            const directApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const isDev = process.env.NODE_ENV === "development";

            let data;
            if (directApiKey && isDev) {
                // Call Gemini directly in dev mode to guarantee model responses
                data = await callGeminiClientSide(userMessage.content, capturedImage, recentWorkouts, recentMeals);
            } else {
                // Production Cloud Function call
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                const response = await fetch(apiUrl("/api/chat"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        input: userMessage.content,
                        language: language,
                        context: {
                            recentWorkouts: recentWorkouts.slice(0, 2),
                            recentMeals: recentMeals.slice(0, 2),
                        },
                        ...(capturedImage && { imageData: { base64: capturedImage.base64, mimeType: capturedImage.mimeType } }),
                    }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                data = await response.json();
            }

            if (data.text?.includes("trouble processing")) {
                throw new Error("API error processing text");
            }

            // Save triggers returned from Gemini API
            if (data.action === "LOG_MEAL" && data.data) {
                const mealDate = data.data.date || new Date().toISOString();
                await storage.saveMeal(user.uid, {
                    id: "",
                    date: mealDate,
                    ...data.data,
                });
            } else if (data.action === "LOG_WORKOUT" && data.data) {
                const workoutDate = data.data.date || new Date().toISOString();
                await storage.saveWorkout(user.uid, {
                    id: "",
                    date: workoutDate,
                    ...data.data,
                });
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.text || "I processed your request.",
                videoUrl,
                timestamp: new Date().toISOString()
            };

            setMessages((prev) => [...prev, aiMessage]);
            await saveMessageToFirestore(aiMessage);
        } catch (error: any) {
            console.error("Assistant chat error:", error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Error: Unable to get response from Gemini. Please check your connection and try again. (Details: ${error.message || error})`,
                videoUrl,
                timestamp: new Date().toISOString()
            };
            setMessages((prev) => [...prev, errorMessage]);
            await saveMessageToFirestore(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Format timestamps inside bubbles
    const formatBubbleTime = (isoString?: string) => {
        if (!isoString) return "";
        try {
            const d = new Date(isoString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            return "";
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white bg-glow-lime flex flex-col relative overflow-hidden">
            
            {/* Header */}
            <header className="pt-16 pb-4 px-6 border-b border-white/8 bg-[#0d0d0d]/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-end max-w-md mx-auto w-full">
                <div>
                    <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-500 mb-1">
                        {t("coach.title")}
                    </div>
                    <h1 className="text-2xl font-medium tracking-tight">{t("coach.conversation")}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[oklch(0.90_0.22_128)] rounded-full animate-pulse-live" />
                        <span className="font-mono-jetbrains text-[8px] text-neutral-400 tracking-wider uppercase">
                            {t("coach.context")}
                        </span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="px-2.5 py-1 border border-white/14 hover:border-white/30 bg-neutral-950/20 text-neutral-400 hover:text-white font-mono-jetbrains text-[9px] tracking-wider uppercase cursor-pointer rounded-none"
                    >
                        {isSidebarOpen ? t("coach.chat") : t("coach.history")}
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 flex relative max-w-md mx-auto w-full overflow-hidden">
                
                {/* Conversation History Drawer */}
                <div className={cn(
                    "absolute inset-y-0 left-0 z-10 w-full bg-[#0d0d0d]/95 border-r border-white/8 flex flex-col transition-transform duration-300 ease-in-out",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="p-4 border-b border-white/8 flex justify-between items-center bg-neutral-950/40">
                        <div className="font-mono-jetbrains text-[10px] tracking-[0.16em] uppercase text-neutral-400">
                            {t("coach.savedSessions")}
                        </div>
                        <button
                            onClick={handleCreateConversation}
                            className="px-2.5 py-1 border border-[oklch(0.90_0.22_128)] text-[oklch(0.90_0.22_128)] font-mono-jetbrains text-[9px] tracking-wider uppercase cursor-pointer rounded-none flex items-center gap-1 hover:bg-[oklch(0.90_0.22_128)]/5"
                        >
                            <Plus className="h-3 w-3" /> {t("coach.new")}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoadingConversations ? (
                            <div className="text-center py-6 font-mono-jetbrains text-xs text-neutral-600">
                                {language === "es" ? "CARGANDO REGISTROS..." : "LOADING LOGS..."}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-6 font-mono-jetbrains text-xs text-neutral-600">
                                {language === "es" ? "SIN CONVERSACIONES" : "NO CONVERSATIONS"}
                            </div>
                        ) : (
                            conversations.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelectConversation(c.id)}
                                    className={cn(
                                        "w-full text-left p-3.5 border rounded-none transition-colors flex items-center justify-between",
                                        currentConversationId === c.id 
                                        ? "border-[oklch(0.90_0.22_128)] bg-[oklch(0.90_0.22_128)]/5" 
                                        : "border-white/8 bg-neutral-950/20 hover:bg-neutral-900/30"
                                    )}
                                >
                                    <div className="min-w-0 flex-1 pr-3">
                                        <div className="text-xs font-medium text-white truncate">{c.title}</div>
                                        <div className="font-mono-jetbrains text-[8px] text-neutral-500 mt-1 uppercase">
                                            {new Date(c.updatedAt).toLocaleDateString(language === "es" ? "es-ES" : "en-US")}
                                        </div>
                                    </div>
                                    <MessageSquare className={cn(
                                        "h-3.5 w-3.5 flex-shrink-0",
                                        currentConversationId === c.id ? "text-[oklch(0.90_0.22_128)]" : "text-neutral-600"
                                    )} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Messages Container */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto px-6 pt-4 pb-36 space-y-6 scrollbar-hide"
                >
                    {messages.map((message) => {
                        const isUser = message.role === "user";
                        const showSwapCard = !isUser && message.content.toLowerCase().includes("swap");
                        return (
                            <div key={message.id} className="space-y-2.5">
                                
                                {/* Message Sender header info */}
                                <div className={cn(
                                    "flex items-center gap-2",
                                    isUser ? "justify-end" : "justify-start"
                                )}>
                                    <span className={cn(
                                        "font-mono-jetbrains text-[9px] tracking-wider uppercase font-bold",
                                        isUser ? "text-neutral-400" : "text-[oklch(0.90_0.22_128)]"
                                    )}>
                                        {isUser ? t("coach.you") : t("coach.coach")}
                                    </span>
                                    <span className="font-mono-jetbrains text-[8px] text-neutral-600">
                                        {formatBubbleTime(message.timestamp)}
                                    </span>
                                </div>

                                {/* Content block */}
                                <div className={cn(
                                    "text-sm leading-relaxed max-w-[90%]",
                                    isUser 
                                    ? "ml-auto text-right text-white" 
                                    : "mr-auto text-left text-neutral-200 pl-3.5 border-l-2 border-[oklch(0.90_0.22_128)]"
                                )}>
                                    {/* Uploaded image inside bubble */}
                                    {message.imageUrl && (
                                        <div className={cn(
                                            "mb-2.5 overflow-hidden border border-white/8 max-w-xs",
                                            isUser ? "ml-auto" : "mr-auto"
                                        )}>
                                            <img
                                                src={message.imageUrl}
                                                alt={language === "es" ? "Adjunto de comida" : "Meal log attachment"}
                                                className="w-full h-auto object-cover max-h-48"
                                            />
                                        </div>
                                    )}

                                    {/* Text content with markdown bold formatting */}
                                    {message.content && (
                                        <p 
                                            dangerouslySetInnerHTML={{ 
                                                __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[oklch(0.90_0.22_128)] font-semibold">$1</strong>') 
                                            }} 
                                        />
                                    )}

                                    {/* Embedded instruction video fallback */}
                                    {message.videoUrl && (
                                        <div className="mt-3.5 aspect-video w-full max-w-sm border border-white/8 overflow-hidden bg-black relative">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={message.videoUrl}
                                                title="Exercise instruction guide"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    )}

                                    {/* Swap Card recommendation inside AI response */}
                                    {showSwapCard && (
                                        <div className="mt-3.5 p-3.5 border border-white/8 bg-neutral-950/40 relative flex justify-between items-center max-w-xs">
                                            <div className="absolute top-0 left-0 w-[2px] h-full bg-[oklch(0.90_0.22_128)]" />
                                            <div>
                                                <div className="font-mono-jetbrains text-[8px] tracking-[0.14em] text-neutral-500 uppercase leading-none">
                                                    {t("coach.proposedSwap")}
                                                </div>
                                                <div className="text-[11px] font-medium text-white mt-1.5 leading-tight">
                                                    {language === "es" ? "Piernas · Pesado → Recuperación · Z2 40′" : "Legs · Heavy → Recovery · Z2 40′"}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => alert(language === "es" ? "¡El cambio propuesto se aplicó a tu agenda de hoy!" : "Proposed swap applied to today's schedule!")}
                                                className="px-2.5 py-1 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] border-none font-mono-jetbrains text-[8px] font-bold tracking-wider uppercase cursor-pointer rounded-none"
                                            >
                                                {t("coach.apply")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Loader typing dot animation */}
                    {isLoading && (
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <span className="font-mono-jetbrains text-[9px] tracking-wider uppercase font-bold text-[oklch(0.90_0.22_128)]">
                                    {t("coach.coach")}
                                </span>
                                <span className="font-mono-jetbrains text-[8px] text-neutral-600">{t("coach.typing")}</span>
                            </div>
                            <div className="pl-3.5 border-l-2 border-[oklch(0.90_0.22_128)]">
                                <div className="flex gap-1.5 py-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.90_0.22_128)] opacity-40 animate-pulse-live" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.90_0.22_128)] opacity-40 animate-pulse-live" style={{ animationDelay: "200ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.90_0.22_128)] opacity-40 animate-pulse-live" style={{ animationDelay: "400ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating pill Input Dock (positioned above home bar nav) */}
                <div className="absolute left-6 right-6 bottom-24 z-20">
                    
                    {/* Image Preview container */}
                    {pendingImage && (
                        <div className="relative inline-block mb-3.5 bg-neutral-950 p-1.5 border border-white/8">
                            <img
                                src={pendingImage.previewUrl}
                                alt="Pre-log upload preview"
                                className="h-14 w-14 object-cover"
                            />
                            <button
                                onClick={() => setPendingImage(null)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 border border-white/14 cursor-pointer"
                                type="button"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex items-center gap-3 bg-neutral-950/85 backdrop-blur-xl border border-white/14 rounded-full p-1.5 pl-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus-within:border-[oklch(0.90_0.22_128)] transition-colors"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={imageInputRef}
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            disabled={isLoading || !currentConversationId}
                            onClick={() => imageInputRef.current?.click()}
                            className="text-neutral-500 hover:text-white cursor-pointer disabled:opacity-40 p-1 flex-shrink-0"
                            title={language === "es" ? "Tomar foto de comida" : "Log meal photo"}
                        >
                            <Camera className="h-4.5 w-4.5" />
                        </button>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t("coach.askPlaceholder")}
                            disabled={isLoading || !currentConversationId}
                            className="flex-1 bg-transparent border-none text-xs font-mono-jetbrains placeholder-neutral-500 focus:outline-none text-white px-1"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || (!input.trim() && !pendingImage) || !currentConversationId}
                            className="w-8 h-8 rounded-full bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] flex items-center justify-center cursor-pointer disabled:opacity-40 flex-shrink-0 border-none hover:scale-105 transition-transform"
                        >
                            <Send className="h-3.5 w-3.5 fill-current" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
