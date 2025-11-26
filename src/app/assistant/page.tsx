"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plus, MessageSquare, ChevronLeft, ChevronRight, PanelLeftClose } from "lucide-react";
import { aiLogic, AIResponse } from "@/lib/ai-logic";
import { storage, Conversation, ConversationMessage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    videoUrl?: string;
}

export default function AssistantPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
                
                // If there are conversations, load the first one
                if (convos.length > 0 && !currentConversationId) {
                    setCurrentConversationId(convos[0].id);
                } else if (convos.length === 0) {
                    // Create first conversation if none exist
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
                console.log("Loading messages for conversation:", currentConversationId);
                const loadedMessages = await storage.getConversationMessages(user.uid, currentConversationId);
                console.log("Loaded messages:", loadedMessages.length, loadedMessages);
                setMessages(loadedMessages.map(msg => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    videoUrl: msg.videoUrl,
                })));
            } catch (error) {
                console.error("Error loading messages:", error);
            }
        };

        loadMessages();
    }, [user, currentConversationId]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleCreateConversation = async () => {
        if (!user) return;

        try {
            const newConvId = await storage.createConversation(user.uid);
            const updatedConvos = await storage.getConversations(user.uid);
            setConversations(updatedConvos);
            setCurrentConversationId(newConvId);
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const handleSelectConversation = (conversationId: string) => {
        setCurrentConversationId(conversationId);
    };

    const saveMessageToFirestore = async (message: Message) => {
        if (!user || !currentConversationId) {
            console.warn("Cannot save message: missing user or conversationId", { user: !!user, conversationId: currentConversationId });
            return;
        }

        try {
            await storage.saveMessage(user.uid, currentConversationId, {
                id: message.id,
                role: message.role,
                content: message.content,
                videoUrl: message.videoUrl,
                timestamp: new Date().toISOString(),
            });
            console.log("Message saved successfully:", message.id);
        } catch (error) {
            console.error("Error saving message:", error);
            // Don't throw - we want the UI to continue even if save fails
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !user || !currentConversationId) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        await saveMessageToFirestore(userMessage);
        setInput("");
        setIsLoading(true);

        let videoUrl: string | undefined = undefined;
        // Handle Video Fallback (legacy logic) - applies to both real and mock AI
        const lowerInput = userMessage.content.toLowerCase();
        if (lowerInput.includes("bench press") && lowerInput.includes("how to")) {
            videoUrl = "https://www.youtube.com/embed/rT7DgCr-3pg";
        } else if (lowerInput.includes("squat") && lowerInput.includes("how to")) {
            videoUrl = "https://www.youtube.com/embed/YaXPRqUwItQ";
        } else if (lowerInput.includes("deadlift") && lowerInput.includes("how to")) {
            videoUrl = "https://www.youtube.com/embed/op9kVnSso6Q";
        }

        try {
            // Load context in parallel (non-blocking) - start API call immediately
            const contextPromise = user ? Promise.all([
                storage.getWorkouts(user.uid).catch(() => []),
                storage.getMeals(user.uid).catch(() => [])
            ]) : Promise.resolve([[], []]);
            
            // Start API call immediately with minimal context, or wait max 1s for context
            const contextTimeout = Promise.race([
                contextPromise,
                new Promise(resolve => setTimeout(() => resolve([[], []]), 1000))
            ]) as Promise<[any[], any[]]>;
            
            const [recentWorkouts, recentMeals] = await contextTimeout;
            
            // Try to call real Gemini API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            let response: Response;
            try {
                response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        input: userMessage.content,
                        context: {
                            recentWorkouts: recentWorkouts.slice(0, 2),
                            recentMeals: recentMeals.slice(0, 2),
                        }
                    }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                // If request was aborted or failed, fall back to mock AI
                if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
                    console.log("Request timeout, using mock AI");
                    throw new Error("timeout"); // Will be caught by outer catch
                }
                throw fetchError;
            }

            const data = await response.json();

            // If API returns error, fall back to mock AI
            if (data.text?.includes("trouble processing")) {
                console.log("Gemini API unavailable, using mock AI");
                const mockResponse = aiLogic.processInput(userMessage.content);

                // Handle Actions from mock
                if (mockResponse.action === "LOG_MEAL" && mockResponse.data && user) {
                    await storage.saveMeal(user.uid, mockResponse.data);
                } else if (mockResponse.action === "LOG_WORKOUT" && mockResponse.data && user) {
                    await storage.saveWorkout(user.uid, mockResponse.data);
                }

                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: mockResponse.text + " _(using mock AI)_",
                    videoUrl,
                };
                setMessages((prev) => [...prev, aiMessage]);
                await saveMessageToFirestore(aiMessage);
                setIsLoading(false);
                return;
            }

            // Handle Actions from real API
            if (data.action === "LOG_MEAL" && data.data && user) {
                await storage.saveMeal(user.uid, {
                    id: Math.random().toString(36).substring(2, 9),
                    date: new Date().toISOString(),
                    ...data.data,
                });
            } else if (data.action === "LOG_WORKOUT" && data.data && user) {
                await storage.saveWorkout(user.uid, {
                    id: Math.random().toString(36).substring(2, 9),
                    date: new Date().toISOString(),
                    ...data.data,
                });
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.text || "I processed your request.",
                videoUrl,
            };

            setMessages((prev) => [...prev, aiMessage]);
            await saveMessageToFirestore(aiMessage);
        } catch (error: any) {
            // Don't log abort errors as errors - they're expected timeouts
            if (error?.name !== 'AbortError' && error?.message !== 'timeout') {
                console.error("Error calling AI, using mock fallback:", error);
            }

            // Fall back to mock AI logic
            const mockResponse = aiLogic.processInput(userMessage.content);

            if (mockResponse.action === "LOG_MEAL" && mockResponse.data && user) {
                await storage.saveMeal(user.uid, mockResponse.data);
            } else if (mockResponse.action === "LOG_WORKOUT" && mockResponse.data && user) {
                await storage.saveWorkout(user.uid, mockResponse.data);
            }

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: mockResponse.text + " _(using local AI)_",
                videoUrl,
            };
            setMessages((prev) => [...prev, errorMessage]);
            await saveMessageToFirestore(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingConversations) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
                <div className="text-muted-foreground">Loading conversations...</div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-5rem)] relative">
            {/* Sidebar */}
            <div className={cn(
                "border-r bg-background flex flex-col transition-all duration-300 ease-in-out",
                isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
            )}>
                <div className="p-4 border-b">
                    <Button
                        onClick={handleCreateConversation}
                        className="w-full"
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Conversation
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() => handleSelectConversation(conversation.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg transition-colors hover:bg-accent",
                                    currentConversationId === conversation.id && "bg-accent"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {conversation.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(conversation.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Sidebar Toggle Button */}
            <Button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                variant="outline"
                size="icon"
                className={cn(
                    "absolute top-4 z-10 transition-all duration-300",
                    isSidebarOpen ? "left-[256px]" : "left-0",
                    "border border-border bg-background shadow-sm"
                )}
            >
                {isSidebarOpen ? (
                    <ChevronLeft className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
            </Button>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                <header className="p-4 border-b">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bot className="h-6 w-6 text-primary" />
                        AI Assistant
                    </h1>
                </header>

                <ScrollArea className="flex-1 p-4 pb-20" ref={scrollAreaRef}>
                    <div className="space-y-4 pb-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="h-5 w-5" />
                                    ) : (
                                        <Bot className="h-5 w-5" />
                                    )}
                                </div>
                                <div
                                    className={`rounded-lg p-3 max-w-[80%] ${message.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                        }`}
                                >
                                    <div className="text-sm prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                    {message.videoUrl && (
                                        <div className="mt-3 rounded-md overflow-hidden bg-black aspect-video relative">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={message.videoUrl}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="bg-muted rounded-lg p-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Fixed Input Area - Pinned above bottom nav */}
                <div 
                    className={cn(
                        "fixed p-4 border-t bg-background z-10 transition-all duration-300",
                        "bottom-20 right-0"
                    )}
                    style={{
                        left: isSidebarOpen ? '256px' : '0'
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type 'I ate an apple' or 'I did 10 pushups'..."
                            disabled={isLoading || !currentConversationId}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !currentConversationId}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
