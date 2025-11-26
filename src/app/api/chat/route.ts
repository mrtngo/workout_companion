import { NextRequest, NextResponse } from "next/server";
import { llmService } from "@/lib/llm";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { input, context } = body;

        if (!input) {
            return NextResponse.json(
                { error: "Input is required" },
                { status: 400 }
            );
        }

        const response = await llmService.processInput(input, context);
        return NextResponse.json(response);
    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
