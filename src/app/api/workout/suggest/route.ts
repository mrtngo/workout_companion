import { NextRequest, NextResponse } from "next/server";
import { llmService } from "@/lib/llm";

export async function POST(req: NextRequest) {
    try {
        const { profile, recentWorkouts } = await req.json();
        const workout = await llmService.generateWorkout(profile ?? null, recentWorkouts ?? []);
        if (!workout) {
            return NextResponse.json({ workout: null }, { status: 200 });
        }
        return NextResponse.json({ workout });
    } catch (error) {
        console.error("Error in workout suggest API:", error);
        return NextResponse.json({ workout: null, error: "Internal server error" }, { status: 500 });
    }
}
