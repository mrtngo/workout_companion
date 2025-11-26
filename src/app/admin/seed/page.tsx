"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { seedMockData } from "@/lib/seed-data";
import { Database, Loader2 } from "lucide-react";

export default function SeedDataPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [days, setDays] = useState("30");
    const [isSeeding, setIsSeeding] = useState(false);
    const [result, setResult] = useState<string>("");

    const handleSeed = async () => {
        if (!user) {
            alert("Please log in first");
            return;
        }

        const numDays = parseInt(days);
        if (isNaN(numDays) || numDays < 1 || numDays > 365) {
            alert("Please enter a number between 1 and 365");
            return;
        }

        setIsSeeding(true);
        setResult("");

        try {
            const data = await seedMockData(user.uid, numDays);
            setResult(
                `✅ Successfully generated mock data!\n\n` +
                `- ${data.workouts.length} workouts created\n` +
                `- ${data.meals.length} meals created\n` +
                `- Profile: ${data.profile?.age}yo, ${data.profile?.weight}kg, ${data.profile?.goals}\n\n` +
                `You can now test the LLM suggestions with historical data!`
            );
        } catch (error: any) {
            setResult(`❌ Error: ${error.message || "Failed to generate mock data"}`);
            console.error("Error seeding data:", error);
        } finally {
            setIsSeeding(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Please log in to seed mock data</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
            <header>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Database className="h-6 w-6 text-primary" />
                    Seed Mock Data
                </h1>
                <p className="text-muted-foreground mt-2">
                    Generate realistic workout and meal data to test LLM suggestions
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Generate Mock Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="days">Number of Days</Label>
                        <Input
                            id="days"
                            type="number"
                            min="1"
                            max="365"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            placeholder="30"
                            className="mt-1"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            Generate data for the last N days (1-365)
                        </p>
                    </div>

                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                        <p className="font-semibold">What will be generated:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Workouts based on your profile's workout frequency</li>
                            <li>2-3 meals per day with realistic nutrition data</li>
                            <li>Variety of exercises and foods</li>
                            <li>Data spread across the specified number of days</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="w-full"
                        size="lg"
                    >
                        {isSeeding ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Data...
                            </>
                        ) : (
                            <>
                                <Database className="h-4 w-4 mr-2" />
                                Generate Mock Data
                            </>
                        )}
                    </Button>

                    {result && (
                        <div className={`p-4 rounded-lg whitespace-pre-line ${
                            result.startsWith("✅") 
                                ? "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100" 
                                : "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
                        }`}>
                            {result}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>After Seeding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Once data is generated, you can:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>View your workout history on the Workout page</li>
                        <li>See meal history on the Nutrition page</li>
                        <li>Test workout suggestions on the Home page</li>
                        <li>Chat with the AI assistant to see how it uses your data</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

