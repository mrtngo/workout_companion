import { NextRequest, NextResponse } from "next/server";
import { ultrahumanApi } from "@/lib/ultrahuman";

export async function GET(req: NextRequest) {
    try {
        const token = process.env.ULTRAHUMAN_TOKEN;
        const accessCode = process.env.ULTRAHUMAN_ACCESS_CODE;

        if (!token || !accessCode) {
            return NextResponse.json(
                { error: "Ultrahuman credentials not configured" },
                { status: 500 }
            );
        }

        const data = await ultrahumanApi.fetchData(token, accessCode);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in Ultrahuman API:", error);
        return NextResponse.json(
            { error: "Failed to fetch Ultrahuman data" },
            { status: 500 }
        );
    }
}
