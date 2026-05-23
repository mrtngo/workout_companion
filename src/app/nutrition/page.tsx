"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Flame, 
  Calendar, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Square,
  Sparkles,
  Camera,
  ArrowRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { storage, Meal, UserProfile } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

type GroupByOption = "day" | "week" | "month" | "none";

export default function NutritionPage() {
    const router = useRouter();
    const { user } = useAuth();
    
    const [meals, setMeals] = useState<Meal[]>([]);
    const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set());
    const [groupBy, setGroupBy] = useState<GroupByOption>("day");
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [aiInputText, setAiInputText] = useState("");

    useEffect(() => {
        if (!user) return;
        
        const loadData = async () => {
            const [mealsData, profile] = await Promise.all([
                storage.getMeals(user.uid),
                storage.getUserProfile(user.uid)
            ]);
            setMeals(mealsData);
            setUserProfile(profile);
        };
        
        loadData();
    }, [user]);

    // Daily Macro targets
    const calorieTarget = userProfile?.maxDailyCalories || 2400;
    const proteinTarget = Math.round((calorieTarget * 0.3) / 4);
    const carbsTarget = Math.round((calorieTarget * 0.45) / 4);
    const fatTarget = Math.round((calorieTarget * 0.25) / 9);

    // Today's Date
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = useMemo(() => 
        meals.filter(m => m.date.startsWith(today)), 
        [meals, today]
    );

    // Today's Summaries
    const totalCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const totalProtein = todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    const totalCarbs = todayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
    const totalFats = todayMeals.reduce((acc, m) => acc + (m.fats || 0), 0);

    const caloriesRemaining = Math.max(0, calorieTarget - totalCalories);

    // SVG Macro Rings configuration
    const macrosConfig = useMemo(() => [
        { label: "Protein", val: totalProtein, target: proteinTarget, color: "oklch(0.90 0.22 128)", letter: "P" },
        { label: "Carbs", val: totalCarbs, target: carbsTarget, color: "oklch(0.78 0.16 60)", letter: "C" },
        { label: "Fat", val: totalFats, target: fatTarget, color: "#9b88ff", letter: "F" },
    ], [totalProtein, proteinTarget, totalCarbs, carbsTarget, totalFats, fatTarget]);

    const groupMeals = (list: Meal[], option: GroupByOption): Record<string, Meal[]> => {
        if (option === "none") {
            return { "All Meals": list };
        }

        const grouped: Record<string, Meal[]> = {};

        list.forEach(meal => {
            const date = new Date(meal.date);
            let key: string;

            if (option === "day") {
                key = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            } else if (option === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
                key = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            } else if (option === "month") {
                key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            } else {
                key = "All Meals";
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(meal);
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

    // Route query text to AI assistant
    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiInputText.trim()) return;
        router.push(`/assistant?message=${encodeURIComponent(aiInputText.trim())}`);
    };

    const dayName = useMemo(() => {
        return new Date().toLocaleDateString('en-US', { weekday: 'long' });
    }, []);

    // Format meal dates into clock time
    const formatMealTime = (isoString: string) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            return "00:00";
        }
    };

    // Estimate breakfast / lunch / dinner tag based on hour
    const getMealTimeTag = (isoString: string) => {
        try {
            const hour = new Date(isoString).getHours();
            if (hour < 11) return "BREAKFAST";
            if (hour < 15) return "LUNCH";
            if (hour < 18) return "SNACK";
            if (hour < 22) return "DINNER";
            return "LATE SNACK";
        } catch (e) {
            return "MEAL";
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white bg-glow-lime pb-32">
            <div className="max-w-md mx-auto px-6 pt-16">
                
                {/* Header */}
                <header className="flex justify-between items-end mb-6">
                    <div>
                        <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-500 mb-1">
                            Fuel · {dayName}
                        </div>
                        <h1 className="text-3xl font-medium tracking-tight">Intake</h1>
                    </div>
                    <Link href="/nutrition/log">
                        <Button className="w-10 h-10 rounded-none bg-[oklch(0.90_0.22_128)] hover:bg-[oklch(0.90_0.22_128)]/90 text-[oklch(0.20_0.06_128)] flex items-center justify-center border-none p-0 cursor-pointer">
                            <Plus className="h-5 w-5 stroke-[2.5]" />
                        </Button>
                    </Link>
                </header>

                {/* Calorie hero */}
                <section className="flex items-end justify-between gap-6 mb-6">
                    <div className="flex-1">
                        <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.12em] text-neutral-400 mb-2">
                            Calories Consumed
                        </div>
                        <div className="font-mono-jetbrains text-5xl font-medium tracking-tight text-white leading-none">
                            {totalCalories.toLocaleString()}
                        </div>
                        <div className="font-mono-jetbrains text-[10px] text-neutral-500 mt-3 leading-none">
                            {caloriesRemaining.toLocaleString()} remaining · target {calorieTarget}
                        </div>
                    </div>

                    {/* 3 Macro Rings side-by-side */}
                    <div className="flex gap-2">
                        {macrosConfig.map((m, i) => {
                            const pct = Math.min(m.val / m.target, 1);
                            const circumference = 2 * Math.PI * 18; // ~113.1
                            return (
                                <div key={i} className="relative w-11 h-11">
                                    <svg width="44" height="44" viewBox="0 0 44 44" className="rotate-[-90deg]">
                                        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                                        <circle 
                                            cx="22" 
                                            cy="22" 
                                            r="18" 
                                            fill="none" 
                                            stroke={m.color} 
                                            strokeWidth="2.5" 
                                            strokeDasharray={`${circumference} ${circumference}`}
                                            strokeDashoffset={circumference * (1 - pct)}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-mono-jetbrains text-[9px] font-bold text-neutral-300">
                                        {m.letter}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Macro breakdown columns grid */}
                <section className="grid grid-cols-3 gap-0 border border-white/8 bg-neutral-950/40 mb-6">
                    {macrosConfig.map((m, i) => {
                        const pctWidth = Math.min((m.val / m.target) * 100, 100);
                        return (
                            <div key={m.label} className={`p-3.5 ${i < 2 ? "border-r border-white/8" : ""}`}>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="w-1.5 h-1.5 block" style={{ backgroundColor: m.color }} />
                                    <span className="text-[9px] uppercase font-mono-jetbrains tracking-wider text-neutral-400">
                                        {m.label}
                                    </span>
                                </div>
                                <div className="font-mono-jetbrains text-lg font-medium leading-none text-white">
                                    {m.val}<span className="text-neutral-500 text-[10px] ml-0.5">g</span>
                                </div>
                                <div className="mt-3.5 h-0.5 bg-white/4 relative w-full">
                                    <div className="h-full absolute top-0 left-0" style={{ width: `${pctWidth}%`, backgroundColor: m.color }} />
                                </div>
                                <div className="font-mono-jetbrains text-[8px] text-neutral-500 mt-2 tracking-wide text-left">
                                    {m.val} / {m.target}g
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* AI Log Input Box */}
                <form onSubmit={handleAiSubmit} className="flex items-center gap-3 p-3 border border-white/14 bg-neutral-950/20 hover:border-white/30 focus-within:border-[oklch(0.90_0.22_128)] transition-colors mb-6">
                    <Sparkles className="h-4 w-4 text-[oklch(0.90_0.22_128)] flex-shrink-0" />
                    <input
                        type="text"
                        placeholder='"I had a chicken bowl..." — log via AI'
                        value={aiInputText}
                        onChange={(e) => setAiInputText(e.target.value)}
                        className="flex-1 bg-transparent border-none text-xs font-mono-jetbrains placeholder-neutral-500 focus:outline-none text-white"
                    />
                    <button type="submit" className="text-neutral-400 hover:text-white cursor-pointer">
                        <Camera className="h-4 w-4" />
                    </button>
                </form>

                {/* Meals Logs Container */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/8 pb-2">
                        <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-400">
                            Logged Intake ({meals.length})
                        </div>
                        {meals.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAllMeals}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-neutral-950/40 border border-white/8 hover:border-white/20 font-mono-jetbrains text-[8px] tracking-wider uppercase text-neutral-400 hover:text-white cursor-pointer rounded-none"
                                >
                                    {selectedMeals.size === meals.length ? (
                                        <CheckSquare className="h-3 w-3 text-[oklch(0.90_0.22_128)]" />
                                    ) : (
                                        <Square className="h-3 w-3" />
                                    )}
                                    Select All
                                </button>
                                {selectedMeals.size > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex items-center gap-1 px-2 py-1 bg-red-950/20 border border-red-500/30 hover:border-red-500/60 font-mono-jetbrains text-[8px] tracking-wider uppercase text-red-400 hover:text-red-300 cursor-pointer rounded-none"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete ({selectedMeals.size})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="divide-y divide-white/8">
                        {meals.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-white/8 bg-neutral-950/20">
                                <Clock className="h-8 w-8 mx-auto mb-3 text-neutral-600 animate-pulse" />
                                <div className="font-mono-jetbrains text-xs uppercase tracking-widest text-neutral-400">
                                    No food logs recorded.
                                </div>
                                <Link href="/nutrition/log" className="text-[oklch(0.90_0.22_128)] font-mono-jetbrains text-[10px] tracking-wider uppercase hover:underline mt-3 block">
                                    Record a meal manually →
                                </Link>
                            </div>
                        ) : (
                            Object.entries(groupedMeals).map(([groupKey, groupMeals]) => {
                                const groupCalories = groupMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
                                return (
                                    <div key={groupKey} className="space-y-0">
                                        {groupBy !== "none" && (
                                            <div className="flex items-center justify-between pt-4 pb-2">
                                                <span className="font-mono-jetbrains text-[9px] tracking-[0.16em] text-[oklch(0.90_0.22_128)] font-bold uppercase">
                                                    {groupKey}
                                                </span>
                                                <span className="font-mono-jetbrains text-[8px] text-neutral-500 tracking-wider">
                                                    {groupCalories} kcal
                                                </span>
                                            </div>
                                        )}
                                        {groupMeals.map((meal) => {
                                            const isSelected = selectedMeals.has(meal.id);
                                            const timeStr = formatMealTime(meal.date);
                                            const tagStr = getMealTimeTag(meal.date);

                                            return (
                                                <div 
                                                    key={meal.id} 
                                                    className={`py-3.5 flex gap-4 items-start transition-colors ${
                                                        isSelected ? "bg-[oklch(0.90_0.22_128)]/5" : ""
                                                    }`}
                                                >
                                                    {/* Select box */}
                                                    <button
                                                        onClick={() => toggleSelectMeal(meal.id)}
                                                        className="p-0.5 hover:bg-neutral-900 rounded-none cursor-pointer mt-0.5"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="h-3.5 w-3.5 text-[oklch(0.90_0.22_128)]" />
                                                        ) : (
                                                            <Square className="h-3.5 w-3.5 text-neutral-600" />
                                                        )}
                                                    </button>

                                                    {/* Time & tag */}
                                                    <div className="w-14 flex-shrink-0">
                                                        <div className="font-mono-jetbrains text-xs font-semibold text-white leading-none">
                                                            {timeStr}
                                                        </div>
                                                        <div className="font-mono-jetbrains text-[7px] text-neutral-500 tracking-widest mt-1.5 uppercase leading-none truncate">
                                                            {tagStr}
                                                        </div>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-white mb-1.5 leading-tight truncate">
                                                            {meal.name}
                                                        </div>
                                                        <div className="flex gap-2.5 font-mono-jetbrains text-[9px] text-neutral-500 leading-none">
                                                            <span>P {meal.protein}g</span>
                                                            <span>C {meal.carbs}g</span>
                                                            <span>F {meal.fats}g</span>
                                                        </div>
                                                    </div>

                                                    {/* Calories / Actions */}
                                                    <div className="text-right flex items-center gap-3">
                                                        <div>
                                                            <div className="font-mono-jetbrains text-sm font-semibold text-white leading-none">
                                                                {meal.calories}
                                                            </div>
                                                            <div className="font-mono-jetbrains text-[8px] text-neutral-500 tracking-wider mt-1 uppercase leading-none">
                                                                kcal
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleEdit(meal)}
                                                                className="p-1 text-neutral-500 hover:text-[oklch(0.90_0.22_128)] cursor-pointer"
                                                                title="Edit Meal"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(meal.id)}
                                                                className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                                                                title="Delete Meal"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
