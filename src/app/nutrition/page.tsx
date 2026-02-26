"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Utensils, Flame, Calendar, Edit, Trash2, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { storage, Meal } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

type GroupByOption = "day" | "week" | "month" | "none";

export default function NutritionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set());
    const [groupBy, setGroupBy] = useState<GroupByOption>("day");

    useEffect(() => {
        if (!user) return;
        
        const loadMeals = async () => {
            const data = await storage.getMeals(user.uid);
            setMeals(data);
        };
        
        loadMeals();
    }, [user]);

    // Calculate today's totals
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = useMemo(() => 
        meals.filter(m => m.date.startsWith(today)), 
        [meals, today]
    );

    const totalCalories = todayMeals.reduce((acc, meal) => acc + meal.calories, 0);
    const totalProtein = todayMeals.reduce((acc, meal) => acc + meal.protein, 0);
    const totalCarbs = todayMeals.reduce((acc, meal) => acc + meal.carbs, 0);
    const totalFats = todayMeals.reduce((acc, meal) => acc + meal.fats, 0);

    const groupMeals = (meals: Meal[], groupBy: GroupByOption): Record<string, Meal[]> => {
        if (groupBy === "none") {
            return { "All Meals": meals };
        }

        const grouped: Record<string, Meal[]> = {};

        meals.forEach(meal => {
            const date = new Date(meal.date);
            let key: string;

            if (groupBy === "day") {
                key = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            } else if (groupBy === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            } else if (groupBy === "month") {
                key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            } else {
                key = "All Meals";
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(meal);
        });

        // Sort meals within each group by date (newest first)
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        return grouped;
    };

    const groupedMeals = useMemo(() => groupMeals(meals, groupBy), [meals, groupBy]);

    const toggleSelectMeal = (mealId: string) => {
        setSelectedMeals(prev => {
            const next = new Set(prev);
            if (next.has(mealId)) {
                next.delete(mealId);
            } else {
                next.add(mealId);
            }
            return next;
        });
    };

    const selectAllMeals = () => {
        if (selectedMeals.size === meals.length) {
            setSelectedMeals(new Set());
        } else {
            setSelectedMeals(new Set(meals.map(m => m.id)));
        }
    };

    const handleEdit = (meal: Meal) => {
        // Store meal in sessionStorage and navigate to edit page
        sessionStorage.setItem('editMeal', JSON.stringify(meal));
        router.push('/nutrition/log?edit=true');
    };

    const handleDelete = async (mealId: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this meal?')) return;
        
        try {
            await storage.deleteMeal(user.uid, mealId);
            setMeals(prev => prev.filter(m => m.id !== mealId));
            setSelectedMeals(prev => {
                const next = new Set(prev);
                next.delete(mealId);
                return next;
            });
        } catch (error) {
            console.error('Error deleting meal:', error);
            alert('Failed to delete meal');
        }
    };

    const handleBulkDelete = async () => {
        if (!user || selectedMeals.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedMeals.size} meal(s)?`)) return;
        
        try {
            await storage.deleteMeals(user.uid, Array.from(selectedMeals));
            setMeals(prev => prev.filter(m => !selectedMeals.has(m.id)));
            setSelectedMeals(new Set());
        } catch (error) {
            console.error('Error deleting meals:', error);
            alert('Failed to delete meals');
        }
    };

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

            {/* Group By Filter and Bulk Actions */}
            {meals.length > 0 && (
                <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={groupBy === "none" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGroupBy("none")}
                        >
                            All
                        </Button>
                        <Button
                            variant={groupBy === "day" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGroupBy("day")}
                        >
                            By Day
                        </Button>
                        <Button
                            variant={groupBy === "week" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGroupBy("week")}
                        >
                            By Week
                        </Button>
                        <Button
                            variant={groupBy === "month" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGroupBy("month")}
                        >
                            By Month
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllMeals}
                            className="flex items-center gap-2"
                        >
                            {selectedMeals.size === meals.length ? (
                                <CheckSquare className="h-4 w-4" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                            Select All
                        </Button>
                        {selectedMeals.size > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Selected ({selectedMeals.size})
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {meals.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No meals logged yet.</p>
                        <Link href="/nutrition/log" className="text-primary hover:underline mt-2 block">
                            Log your first meal
                        </Link>
                    </div>
                ) : (
                    Object.entries(groupedMeals).map(([groupKey, groupMeals]) => {
                        // Calculate totals for this group
                        const groupCalories = groupMeals.reduce((acc, m) => acc + m.calories, 0);
                        const groupProtein = groupMeals.reduce((acc, m) => acc + m.protein, 0);
                        const groupCarbs = groupMeals.reduce((acc, m) => acc + m.carbs, 0);
                        const groupFats = groupMeals.reduce((acc, m) => acc + m.fats, 0);

                        return (
                            <div key={groupKey} className="space-y-4">
                                {groupBy !== "none" && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="h-px flex-1 bg-border"></div>
                                        <div className="flex items-center gap-2 px-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <h2 className="text-lg font-semibold text-muted-foreground">
                                                {groupKey}
                                            </h2>
                                            <span className="text-sm text-muted-foreground">
                                                ({groupMeals.length} meals • {groupCalories} kcal)
                                            </span>
                                        </div>
                                        <div className="h-px flex-1 bg-border"></div>
                                    </div>
                                )}
                                {groupMeals.map((meal) => {
                                    const isSelected = selectedMeals.has(meal.id);
                                    
                                    return (
                                    <Card key={meal.id} className={isSelected ? "ring-2 ring-primary" : ""}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-2 mb-2">
                                                <button
                                                    onClick={() => toggleSelectMeal(meal.id)}
                                                    className="p-1 hover:bg-muted rounded mt-1"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="h-4 w-4 text-primary" />
                                                    ) : (
                                                        <Square className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </button>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-base">{meal.name}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(meal.date).toLocaleDateString()} at{" "}
                                                                {new Date(meal.date).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <div className="text-right mr-2">
                                                                <div className="font-bold text-lg">{meal.calories} kcal</div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => handleEdit(meal)}
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive"
                                                                onClick={() => handleDelete(meal.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
                                                <div className="text-center">
                                                    <div className="text-sm font-semibold text-blue-600">{meal.protein}g</div>
                                                    <div className="text-xs text-muted-foreground">Protein</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm font-semibold text-orange-600">{meal.carbs}g</div>
                                                    <div className="text-xs text-muted-foreground">Carbs</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm font-semibold text-green-600">{meal.fats}g</div>
                                                    <div className="text-xs text-muted-foreground">Fats</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
