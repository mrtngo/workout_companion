"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Target, Activity, Calendar } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        age: "",
        weight: "",
        gender: "" as "male" | "female" | "other" | "",
        goals: "" as "lose_weight" | "gain_weight" | "maintain" | "build_muscle" | "improve_fitness" | "",
        workoutsPerWeek: "",
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        
        // Validate all fields
        if (!formData.age || !formData.weight || !formData.gender || !formData.goals || !formData.workoutsPerWeek) {
            alert("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            await storage.saveUserProfile(user.uid, {
                age: parseInt(formData.age),
                weight: parseFloat(formData.weight),
                gender: formData.gender as "male" | "female" | "other",
                goals: formData.goals as any,
                workoutsPerWeek: parseInt(formData.workoutsPerWeek),
            });
            
            router.push("/");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.age && parseInt(formData.age) > 0 && parseInt(formData.age) < 120;
            case 2:
                return formData.weight && parseFloat(formData.weight) > 0 && parseFloat(formData.weight) < 500;
            case 3:
                return formData.gender !== "";
            case 4:
                return formData.goals !== "" && formData.workoutsPerWeek && parseInt(formData.workoutsPerWeek) >= 0 && parseInt(formData.workoutsPerWeek) <= 7;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Welcome! Let's Get Started</CardTitle>
                    <CardDescription>
                        Help us personalize your fitness journey
                    </CardDescription>
                    <div className="flex justify-center gap-2 mt-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`h-2 w-8 rounded-full transition-colors ${
                                    s <= step ? "bg-primary" : "bg-muted"
                                }`}
                            />
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Age */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">How old are you?</h2>
                                <p className="text-muted-foreground">This helps us calculate your calorie needs</p>
                            </div>
                            <div>
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="1"
                                    max="120"
                                    placeholder="Enter your age"
                                    value={formData.age}
                                    onChange={(e) => handleInputChange("age", e.target.value)}
                                    className="text-lg text-center py-6"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Weight */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Activity className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">What's your current weight?</h2>
                                <p className="text-muted-foreground">Enter your weight in kilograms (kg)</p>
                            </div>
                            <div>
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    min="1"
                                    max="500"
                                    step="0.1"
                                    placeholder="e.g., 70"
                                    value={formData.weight}
                                    onChange={(e) => handleInputChange("weight", e.target.value)}
                                    className="text-lg text-center py-6"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Gender */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Target className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">What's your gender?</h2>
                                <p className="text-muted-foreground">This helps us personalize your calorie calculations</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {(["male", "female", "other"] as const).map((gender) => (
                                    <button
                                        key={gender}
                                        onClick={() => handleInputChange("gender", gender)}
                                        className={`p-6 rounded-lg border-2 transition-all ${
                                            formData.gender === gender
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"
                                        }`}
                                    >
                                        <div className="text-lg font-semibold capitalize">
                                            {gender === "other" ? "Other" : gender === "male" ? "Male" : "Female"}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Goals & Workouts */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Target className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">What are your goals?</h2>
                                <p className="text-muted-foreground">Select your primary fitness goal</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { value: "lose_weight", label: "Lose Weight", desc: "Burn fat and reduce body weight" },
                                    { value: "gain_weight", label: "Gain Weight", desc: "Increase body weight and muscle mass" },
                                    { value: "build_muscle", label: "Build Muscle", desc: "Gain muscle and strength" },
                                    { value: "maintain", label: "Maintain Weight", desc: "Keep current weight and fitness level" },
                                    { value: "improve_fitness", label: "Improve Fitness", desc: "Enhance overall health and endurance" },
                                ].map((goal) => (
                                    <button
                                        key={goal.value}
                                        onClick={() => handleInputChange("goals", goal.value)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                                            formData.goals === goal.value
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"
                                        }`}
                                    >
                                        <div className="font-semibold">{goal.label}</div>
                                        <div className="text-sm text-muted-foreground">{goal.desc}</div>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="pt-4">
                                <Label htmlFor="workoutsPerWeek">How many workouts per week?</Label>
                                <Input
                                    id="workoutsPerWeek"
                                    type="number"
                                    min="0"
                                    max="7"
                                    placeholder="e.g., 3"
                                    value={formData.workoutsPerWeek}
                                    onChange={(e) => handleInputChange("workoutsPerWeek", e.target.value)}
                                    className="text-lg text-center py-6 mt-2"
                                />
                                <p className="text-sm text-muted-foreground mt-2 text-center">
                                    This helps us calculate your daily calorie needs
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={step === 1}
                        >
                            Back
                        </Button>
                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                            >
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={!canProceed() || isLoading}
                            >
                                {isLoading ? "Saving..." : "Complete Setup"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


