"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, ArrowLeft, Calendar } from "lucide-react";
import { storage, Workout, Exercise, WorkoutSet } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";


// Simple UUID generator if uuid package is not available or just use Math.random
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function LogWorkoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [workoutName, setWorkoutName] = useState("Evening Workout");
    const [exercises, setExercises] = useState<Exercise[]>([]);
    // Default to today's date
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const addExercise = (group?: string) => {
        setExercises([
            ...exercises,
            {
                id: generateId(),
                name: "",
                sets: [
                    { id: generateId(), reps: 10, weight: 0, completed: false },
                ],
                group: group || "",
            },
        ]);
    };

    const updateExerciseName = (id: string, name: string) => {
        setExercises(
            exercises.map((ex) => (ex.id === id ? { ...ex, name } : ex))
        );
    };

    const updateExerciseGroup = (id: string, group: string) => {
        setExercises(
            exercises.map((ex) => (ex.id === id ? { ...ex, group: group || undefined } : ex))
        );
    };

    const addSet = (exerciseId: string) => {
        setExercises(
            exercises.map((ex) => {
                if (ex.id === exerciseId) {
                    const lastSet = ex.sets[ex.sets.length - 1];
                    return {
                        ...ex,
                        sets: [
                            ...ex.sets,
                            {
                                id: generateId(),
                                reps: lastSet ? lastSet.reps : 10,
                                weight: lastSet ? lastSet.weight : 0,
                                completed: false,
                            },
                        ],
                    };
                }
                return ex;
            })
        );
    };

    const updateSet = (
        exerciseId: string,
        setId: string,
        field: keyof WorkoutSet,
        value: any
    ) => {
        setExercises(
            exercises.map((ex) => {
                if (ex.id === exerciseId) {
                    return {
                        ...ex,
                        sets: ex.sets.map((s) =>
                            s.id === setId ? { ...s, [field]: value } : s
                        ),
                    };
                }
                return ex;
            })
        );
    };

    const removeSet = (exerciseId: string, setId: string) => {
        setExercises(
            exercises.map((ex) => {
                if (ex.id === exerciseId) {
                    return {
                        ...ex,
                        sets: ex.sets.filter((s) => s.id !== setId),
                    };
                }
                return ex;
            })
        );
    };

    const removeExercise = (id: string) => {
        setExercises(exercises.filter((ex) => ex.id !== id));
    };

    const handleSave = async () => {
        if (exercises.length === 0 || !user) return;

        // Combine date and current time
        const selectedDate = new Date(date);
        const now = new Date();
        selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const workout: Workout = {
            id: generateId(),
            date: selectedDate.toISOString(),
            name: workoutName,
            exercises,
        };

        await storage.saveWorkout(user.uid, workout);
        router.push("/workout");
    };

    // Group exercises by their group field
    const groupedExercises = exercises.reduce((acc, exercise) => {
        const group = exercise.group || "Ungrouped";
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(exercise);
        return acc;
    }, {} as Record<string, Exercise[]>);

    const groups = Object.keys(groupedExercises);

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold">Log Workout</h1>
            </header>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="workout-date">Date</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="workout-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="workout-name">Workout Name</Label>
                    <Input
                        id="workout-name"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="e.g. Leg Day"
                    />
                </div>

                <div className="space-y-4">
                    {groups.length > 0 ? (
                        groups.map((groupName) => (
                            <div key={groupName} className="space-y-3">
                                {groupName !== "Ungrouped" && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-border"></div>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase px-2">
                                            {groupName}
                                        </span>
                                        <div className="h-px flex-1 bg-border"></div>
                                    </div>
                                )}
                                {groupedExercises[groupName].map((exercise) => {
                                    const globalIndex = exercises.findIndex(e => e.id === exercise.id);
                                    return (
                                        <Card key={exercise.id} className="mb-4">
                                            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Exercise {globalIndex + 1}
                                                        </Label>
                                                        <Input
                                                            value={exercise.group || ""}
                                                            onChange={(e) =>
                                                                updateExerciseGroup(exercise.id, e.target.value)
                                                            }
                                                            placeholder="Group (optional)"
                                                            className="h-6 text-xs w-24"
                                                        />
                                                    </div>
                                                    <Input
                                                        value={exercise.name}
                                                        onChange={(e) =>
                                                            updateExerciseName(exercise.id, e.target.value)
                                                        }
                                                        placeholder="Exercise Name (e.g. Bench Press)"
                                                        className="font-medium"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => removeExercise(exercise.id)}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground text-center mb-1">
                                                        <div className="col-span-1">Set</div>
                                                        <div className="col-span-2">kg/lbs</div>
                                                        <div className="col-span-2">Reps</div>
                                                        <div className="col-span-1"></div>
                                                    </div>
                                                    {exercise.sets.map((set, setIndex) => (
                                                        <div
                                                            key={set.id}
                                                            className="grid grid-cols-6 gap-2 items-center"
                                                        >
                                                            <div className="col-span-1 text-center font-medium text-sm">
                                                                {setIndex + 1}
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Input
                                                                    type="number"
                                                                    value={set.weight}
                                                                    onChange={(e) =>
                                                                        updateSet(
                                                                            exercise.id,
                                                                            set.id,
                                                                            "weight",
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="h-8 text-center"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Input
                                                                    type="number"
                                                                    value={set.reps}
                                                                    onChange={(e) =>
                                                                        updateSet(
                                                                            exercise.id,
                                                                            set.id,
                                                                            "reps",
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="h-8 text-center"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 flex justify-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => removeSet(exercise.id, set.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full mt-2"
                                                        onClick={() => addSet(exercise.id)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> Add Set
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No exercises yet. Add your first exercise below.
                        </div>
                    )}

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 border-dashed"
                        onClick={() => addExercise()}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Exercise
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 border-dashed"
                        onClick={() => addExercise("Upper Body")}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Upper Body
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 border-dashed"
                        onClick={() => addExercise("Lower Body")}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Lower Body
                    </Button>
                </div>
                </div>
            </div>

            <div className="fixed bottom-20 left-4 right-4">
                <Button className="w-full shadow-lg" size="lg" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" /> Finish Workout
                </Button>
            </div>
        </div>
    );
}
