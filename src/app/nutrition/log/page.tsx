"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { storage, Meal } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function LogMealPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [mealId, setMealId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [carbs, setCarbs] = useState("");
    const [fats, setFats] = useState("");
    // Default to today's date
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        // Check if we're in edit mode
        const isEdit = searchParams.get('edit') === 'true';
        if (isEdit) {
            const editMealStr = sessionStorage.getItem('editMeal');
            if (editMealStr) {
                try {
                    const editMeal: Meal = JSON.parse(editMealStr);
                    setMealId(editMeal.id);
                    setName(editMeal.name);
                    setCalories(editMeal.calories.toString());
                    setProtein(editMeal.protein.toString());
                    setCarbs(editMeal.carbs.toString());
                    setFats(editMeal.fats.toString());
                    // Extract date from ISO string
                    const mealDate = new Date(editMeal.date);
                    setDate(mealDate.toISOString().split('T')[0]);
                    // Clear sessionStorage after loading
                    sessionStorage.removeItem('editMeal');
                } catch (error) {
                    console.error('Error parsing meal data:', error);
                }
            }
        }
    }, [searchParams]);

    const handleSave = async () => {
        if (!name || !calories || !user) return;

        // Combine date and current time
        const selectedDate = new Date(date);
        const now = new Date();
        selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const meal: Meal = {
            id: mealId || generateId(),
            date: selectedDate.toISOString(),
            name,
            calories: Number(calories),
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fats: Number(fats) || 0,
        };

        await storage.saveMeal(user.uid, meal);
        router.push("/nutrition");
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold">Log Meal</h1>
            </header>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="meal-date">Date</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="meal-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="food-name">Food Name</Label>
                    <Input
                        id="food-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Chicken Salad"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                        id="calories"
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        placeholder="0"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="protein">Protein (g)</Label>
                        <Input
                            id="protein"
                            type="number"
                            value={protein}
                            onChange={(e) => setProtein(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="carbs">Carbs (g)</Label>
                        <Input
                            id="carbs"
                            type="number"
                            value={carbs}
                            onChange={(e) => setCarbs(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fats">Fats (g)</Label>
                        <Input
                            id="fats"
                            type="number"
                            value={fats}
                            onChange={(e) => setFats(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            <div className="fixed bottom-20 left-4 right-4">
                <Button className="w-full shadow-lg" size="lg" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" /> Save Meal
                </Button>
            </div>
        </div>
    );
}
