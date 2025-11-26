"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage, UserProfile } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { generateAvatarUrl } from "@/lib/avatar";
import { ArrowLeft, Save, Edit2, User, Calendar, Weight, Target, Activity } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    const [formData, setFormData] = useState({
        age: "",
        weight: "",
        gender: "" as "male" | "female" | "other" | "",
        goals: "" as "lose_weight" | "gain_weight" | "maintain" | "build_muscle" | "improve_fitness" | "",
        workoutsPerWeek: "",
    });

    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            try {
                const userProfile = await storage.getUserProfile(user.uid);
                if (userProfile) {
                    setProfile(userProfile);
                    setFormData({
                        age: userProfile.age.toString(),
                        weight: userProfile.weight.toString(),
                        gender: userProfile.gender,
                        goals: userProfile.goals,
                        workoutsPerWeek: userProfile.workoutsPerWeek.toString(),
                    });
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    useEffect(() => {
        if (user) {
            const seed = user.email || user.uid;
            setAvatarUrl(generateAvatarUrl(seed));
        }
    }, [user]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!user) return;

        if (!formData.age || !formData.weight || !formData.gender || !formData.goals || !formData.workoutsPerWeek) {
            alert("Please fill in all fields");
            return;
        }

        setIsSaving(true);
        try {
            await storage.saveUserProfile(user.uid, {
                age: parseInt(formData.age),
                weight: parseFloat(formData.weight),
                gender: formData.gender as "male" | "female" | "other",
                goals: formData.goals as any,
                workoutsPerWeek: parseInt(formData.workoutsPerWeek),
            });

            // Reload profile
            const updatedProfile = await storage.getUserProfile(user.uid);
            setProfile(updatedProfile);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground mb-4">Profile not found</p>
                        <Button onClick={() => router.push("/onboarding")}>
                            Complete Onboarding
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const goalLabels: Record<string, string> = {
        lose_weight: "Lose Weight",
        gain_weight: "Gain Weight",
        build_muscle: "Build Muscle",
        maintain: "Maintain Weight",
        improve_fitness: "Improve Fitness",
    };

    const genderLabels: Record<string, string> = {
        male: "Male",
        female: "Female",
        other: "Other",
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold flex-1">Profile</h1>
                {!isEditing && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                )}
            </header>

            {/* Avatar and Basic Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full border-4 border-primary/20"
                            />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-semibold">
                                {user?.displayName || user?.email?.split('@')[0] || 'User'}
                            </h2>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditing ? (
                        <>
                            <div>
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={formData.age}
                                    onChange={(e) => handleInputChange("age", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    min="1"
                                    max="500"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => handleInputChange("weight", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Gender</Label>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {(["male", "female", "other"] as const).map((gender) => (
                                        <button
                                            key={gender}
                                            onClick={() => handleInputChange("gender", gender)}
                                            className={`p-3 rounded-lg border-2 transition-all ${
                                                formData.gender === gender
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <div className="text-sm font-medium capitalize">
                                                {genderLabels[gender]}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Goals</Label>
                                <div className="grid grid-cols-1 gap-2 mt-2">
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
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                formData.goals === goal.value
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <div className="font-medium text-sm">{goal.label}</div>
                                            <div className="text-xs text-muted-foreground">{goal.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="workoutsPerWeek">Workouts per Week</Label>
                                <Input
                                    id="workoutsPerWeek"
                                    type="number"
                                    min="0"
                                    max="7"
                                    value={formData.workoutsPerWeek}
                                    onChange={(e) => handleInputChange("workoutsPerWeek", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset form data
                                        setFormData({
                                            age: profile.age.toString(),
                                            weight: profile.weight.toString(),
                                            gender: profile.gender,
                                            goals: profile.goals,
                                            workoutsPerWeek: profile.workoutsPerWeek.toString(),
                                        });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground">Age</div>
                                    <div className="font-semibold">{profile.age} years</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Weight className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground">Weight</div>
                                    <div className="font-semibold">{profile.weight} kg</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground">Gender</div>
                                    <div className="font-semibold">{genderLabels[profile.gender]}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Target className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground">Goal</div>
                                    <div className="font-semibold">{goalLabels[profile.goals]}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Activity className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground">Workouts per Week</div>
                                    <div className="font-semibold">{profile.workoutsPerWeek} workouts</div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Calorie Information */}
            {profile.maxDailyCalories && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Calorie Target</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary">
                                {profile.maxDailyCalories}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Calories per day based on your goals and activity level
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Logout Button */}
            <Card>
                <CardContent className="pt-6">
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

