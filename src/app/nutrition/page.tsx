"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Utensils, Flame } from "lucide-react";
import Link from "next/link";
import { storage, Meal } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

export default function NutritionPage() {
    const { user } = useAuth();
    const [meals, setMeals] = useState<Meal[]>([]);

    useEffect(() => {
        if (!user) return;
        
        const loadMeals = async () => {
            const data = await storage.getMeals(user.uid);
            setMeals(data);
        };
        
        loadMeals();
    }, [user]);

    const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
    const totalProtein = meals.reduce((acc, meal) => acc + meal.protein, 0);
    const totalCarbs = meals.reduce((acc, meal) => acc + meal.carbs, 0);
    const totalFats = meals.reduce((acc, meal) => acc + meal.fats, 0);

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Nutrition</h1>
                <Link href="/nutrition/log">
                    <Button size="icon" className="rounded-full h-10 w-10">
                        <Plus className="h-6 w-6" />
                    </Button>
                </Link>
            </header>

            <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Flame className="h-5 w-5" />
                            <span className="font-semibold">Calories Today</span>
                        </div>
                        <span className="text-2xl font-bold">{totalCalories}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-white/20 rounded p-2">
                            <div className="font-bold">{totalProtein}g</div>
                            <div className="text-xs opacity-80">Protein</div>
                        </div>
                        <div className="bg-white/20 rounded p-2">
                            <div className="font-bold">{totalCarbs}g</div>
                            <div className="text-xs opacity-80">Carbs</div>
                        </div>
                        <div className="bg-white/20 rounded p-2">
                            <div className="font-bold">{totalFats}g</div>
                            <div className="text-xs opacity-80">Fats</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Today's Meals</h2>
                {meals.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No meals logged yet.</p>
                        <Link href="/nutrition/log" className="text-primary hover:underline mt-2 block">
                            Log your first meal
                        </Link>
                    </div>
                ) : (
                    meals.map((meal) => (
                        <Card key={meal.id}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{meal.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(meal.date).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{meal.calories} kcal</div>
                                    <div className="text-xs text-muted-foreground">
                                        P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
