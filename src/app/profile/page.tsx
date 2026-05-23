"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage, UserProfile } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { ArrowLeft, Save, Edit2, User, Calendar, Weight, Target, Activity, Database, Globe } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!user) return;

        if (!formData.age || !formData.weight || !formData.gender || !formData.goals || !formData.workoutsPerWeek) {
            alert(language === "en" ? "Please fill in all fields" : "Por favor, completa todos los campos");
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
            alert(language === "en" ? "Failed to save profile. Please try again." : "No se pudo guardar el perfil. Intenta de nuevo.");
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
            <div className="flex items-center justify-center h-screen bg-[#0d0d0d] text-neutral-400">
                <div className="font-mono-jetbrains text-sm">
                    {language === "en" ? "LOADING PROFILE CONSOLE..." : "CARGANDO CONSOLA DE PERFIL..."}
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0d0d]">
                <Card className="w-full max-w-md bg-neutral-950/40 border border-white/8 rounded-none">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground mb-4">
                            {language === "en" ? "Profile not found" : "Perfil no encontrado"}
                        </p>
                        <Button 
                            className="bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] rounded-none cursor-pointer"
                            onClick={() => router.push("/onboarding")}
                        >
                            {language === "en" ? "Complete Onboarding" : "Completar Registro"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const goalLabels: Record<string, string> = {
        lose_weight: language === "en" ? "Lose Weight" : "Perder Peso",
        gain_weight: language === "en" ? "Gain Weight" : "Ganar Peso",
        build_muscle: language === "en" ? "Build Muscle" : "Ganar Músculo",
        maintain: language === "en" ? "Maintain Weight" : "Mantener Peso",
        improve_fitness: language === "en" ? "Improve Fitness" : "Mejorar Estado Físico",
    };

    const genderLabels: Record<string, string> = {
        male: t("profile.male"),
        female: t("profile.female"),
        other: t("profile.other"),
    };

    const goalDescs: Record<string, { en: string; es: string }> = {
        lose_weight: { en: "Burn fat and reduce body weight", es: "Quemar grasa y reducir peso corporal" },
        gain_weight: { en: "Increase body weight and muscle mass", es: "Aumentar peso y masa muscular" },
        build_muscle: { en: "Gain muscle and strength", es: "Ganar músculo y fuerza" },
        maintain: { en: "Keep current weight and fitness level", es: "Mantener peso y nivel físico actual" },
        improve_fitness: { en: "Enhance overall health and endurance", es: "Mejorar salud general y resistencia" },
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white bg-glow-lime pb-32">
            <div className="max-w-md mx-auto px-6 pt-16">
                
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-1 hover:bg-neutral-900 rounded-none cursor-pointer border border-white/8 text-neutral-400 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <h1 className="text-2xl font-medium tracking-tight">{t("profile.title")}</h1>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 font-mono-jetbrains text-[10px] tracking-wider uppercase border border-[oklch(0.90_0.22_128)] text-[oklch(0.90_0.22_128)] hover:bg-[oklch(0.90_0.22_128)]/5 cursor-pointer rounded-none flex items-center gap-1.5"
                        >
                            <Edit2 className="h-3 w-3" />
                            {t("edit")}
                        </button>
                    )}
                </header>

                {/* Avatar and Basic Info */}
                <section className="border border-white/8 bg-neutral-950/40 p-4 mb-6 relative">
                    <div className="absolute top-0 right-0 w-1 h-full bg-neutral-500/20" />
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-none border border-white/14 bg-neutral-900 flex items-center justify-center font-mono-jetbrains text-lg font-bold text-[oklch(0.90_0.22_128)]">
                            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "AT"}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-medium text-white truncate leading-tight">
                                {user?.displayName || user?.email?.split('@')[0] || 'User'}
                            </h2>
                            <p className="font-mono-jetbrains text-[10px] text-neutral-500 truncate mt-1">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Language Selector Card */}
                <section className="border border-white/8 bg-neutral-950/40 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3.5">
                        <Globe className="h-4 w-4 text-[oklch(0.90_0.22_128)]" />
                        <span className="font-mono-jetbrains text-[9px] uppercase tracking-[0.16em] text-neutral-400 font-bold">
                            {language === "en" ? "App Language" : "Idioma de la Aplicación"}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setLanguage("en")}
                            className={`p-3 font-mono-jetbrains text-[10px] tracking-wider uppercase cursor-pointer border rounded-none transition-colors ${
                                language === "en"
                                    ? "border-[oklch(0.90_0.22_128)] bg-[oklch(0.90_0.22_128)]/10 text-white font-semibold"
                                    : "border-white/8 bg-neutral-950/20 text-neutral-400 hover:text-white"
                            }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setLanguage("es")}
                            className={`p-3 font-mono-jetbrains text-[10px] tracking-wider uppercase cursor-pointer border rounded-none transition-colors ${
                                language === "es"
                                    ? "border-[oklch(0.90_0.22_128)] bg-[oklch(0.90_0.22_128)]/10 text-white font-semibold"
                                    : "border-white/8 bg-neutral-950/20 text-neutral-400 hover:text-white"
                            }`}
                        >
                            Español
                        </button>
                    </div>
                </section>

                {/* Profile Information */}
                <section className="border border-white/8 bg-neutral-950/40 p-4 mb-6">
                    <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-400 mb-4 border-b border-white/8 pb-2">
                        {t("profile.personalInfo")}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="age" className="font-mono-jetbrains text-[9px] text-neutral-400 uppercase tracking-wider">{t("profile.age")}</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={formData.age}
                                    onChange={(e) => handleInputChange("age", e.target.value)}
                                    className="mt-1 bg-neutral-900 border-white/8 text-sm text-white rounded-none font-mono-jetbrains"
                                />
                            </div>

                            <div>
                                <Label htmlFor="weight" className="font-mono-jetbrains text-[9px] text-neutral-400 uppercase tracking-wider">{t("profile.weight")} (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    min="1"
                                    max="500"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => handleInputChange("weight", e.target.value)}
                                    className="mt-1 bg-neutral-900 border-white/8 text-sm text-white rounded-none font-mono-jetbrains"
                                />
                            </div>

                            <div>
                                <Label className="font-mono-jetbrains text-[9px] text-neutral-400 uppercase tracking-wider mb-2 block">{t("profile.gender")}</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["male", "female", "other"] as const).map((gender) => (
                                        <button
                                            key={gender}
                                            type="button"
                                            onClick={() => handleInputChange("gender", gender)}
                                            className={`p-2.5 font-mono-jetbrains text-[9px] tracking-wider uppercase border rounded-none transition-colors cursor-pointer ${
                                                formData.gender === gender
                                                    ? "border-[oklch(0.90_0.22_128)] bg-[oklch(0.90_0.22_128)]/10 text-white font-semibold"
                                                    : "border-white/8 bg-neutral-900 text-neutral-400 hover:text-white"
                                            }`}
                                        >
                                            {genderLabels[gender]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="font-mono-jetbrains text-[9px] text-neutral-400 uppercase tracking-wider mb-2 block">{t("profile.goal")}</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.keys(goalLabels).map((gValue) => (
                                        <button
                                            key={gValue}
                                            type="button"
                                            onClick={() => handleInputChange("goals", gValue)}
                                            className={`p-3 text-left border rounded-none transition-colors cursor-pointer ${
                                                formData.goals === gValue
                                                    ? "border-[oklch(0.90_0.22_128)] bg-[oklch(0.90_0.22_128)]/10"
                                                    : "border-white/8 bg-neutral-900 hover:border-white/20"
                                            }`}
                                        >
                                            <div className="font-medium text-xs text-white">{goalLabels[gValue]}</div>
                                            <div className="text-[10px] text-neutral-500 mt-1">{goalDescs[gValue]?.[language] || ""}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="workoutsPerWeek" className="font-mono-jetbrains text-[9px] text-neutral-400 uppercase tracking-wider">{t("profile.workoutsPerWeek")}</Label>
                                <Input
                                    id="workoutsPerWeek"
                                    type="number"
                                    min="0"
                                    max="7"
                                    value={formData.workoutsPerWeek}
                                    onChange={(e) => handleInputChange("workoutsPerWeek", e.target.value)}
                                    className="mt-1 bg-neutral-900 border-white/8 text-sm text-white rounded-none font-mono-jetbrains"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    className="flex-1 py-2.5 font-mono-jetbrains text-[10px] tracking-wider uppercase border border-white/8 text-neutral-400 hover:text-white cursor-pointer rounded-none"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            age: profile.age.toString(),
                                            weight: profile.weight.toString(),
                                            gender: profile.gender,
                                            goals: profile.goals,
                                            workoutsPerWeek: profile.workoutsPerWeek.toString(),
                                        });
                                    }}
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 py-2.5 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] font-mono-jetbrains text-[10px] tracking-wider uppercase font-semibold cursor-pointer border-none rounded-none"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? t("profile.saving") : t("save")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-1.5 border-b border-white/4">
                                <span className="font-mono-jetbrains text-[9px] uppercase text-neutral-500 tracking-wider">{t("profile.age")}</span>
                                <span className="font-mono-jetbrains text-sm font-semibold">{profile.age} {t("profile.years")}</span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-white/4">
                                <span className="font-mono-jetbrains text-[9px] uppercase text-neutral-500 tracking-wider">{t("profile.weight")}</span>
                                <span className="font-mono-jetbrains text-sm font-semibold">{profile.weight} kg</span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-white/4">
                                <span className="font-mono-jetbrains text-[9px] uppercase text-neutral-500 tracking-wider">{t("profile.gender")}</span>
                                <span className="font-mono-jetbrains text-sm font-semibold">{genderLabels[profile.gender]}</span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-white/4">
                                <span className="font-mono-jetbrains text-[9px] uppercase text-neutral-500 tracking-wider">{t("profile.goal")}</span>
                                <span className="text-sm font-medium text-white">{goalLabels[profile.goals]}</span>
                            </div>

                            <div className="flex items-center justify-between py-1.5">
                                <span className="font-mono-jetbrains text-[9px] uppercase text-neutral-500 tracking-wider">{t("profile.workoutsPerWeek")}</span>
                                <span className="font-mono-jetbrains text-sm font-semibold">{profile.workoutsPerWeek} {t("profile.workoutsVal")}</span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Calorie Information */}
                {profile.maxDailyCalories && (
                    <section className="border border-white/8 bg-neutral-950/40 p-4 mb-6 text-center">
                        <div className="font-mono-jetbrains text-[9px] uppercase tracking-[0.16em] text-neutral-400 mb-3 block">
                            {t("profile.dailyCal")}
                        </div>
                        <div className="font-mono-jetbrains text-3xl font-bold text-[oklch(0.90_0.22_128)]">
                            {profile.maxDailyCalories}
                        </div>
                        <p className="font-mono-jetbrains text-[9px] text-neutral-500 mt-2.5 max-w-[280px] mx-auto leading-relaxed">
                            {t("profile.dailyCalDesc")}
                        </p>
                    </section>
                )}

                {/* Developer Tools */}
                <section className="border border-white/8 bg-neutral-950/40 p-4 mb-6">
                    <div className="font-mono-jetbrains text-[9px] uppercase tracking-[0.16em] text-neutral-400 mb-3 border-b border-white/8 pb-2 block">
                        {t("profile.devTools")}
                    </div>
                    <Link href="/admin/seed">
                        <button className="w-full py-2.5 font-mono-jetbrains text-[9px] tracking-wider uppercase border border-white/8 text-neutral-400 hover:text-white cursor-pointer rounded-none bg-neutral-900 hover:bg-neutral-900/50 flex items-center justify-center gap-1.5">
                            <Database className="h-3.5 w-3.5" />
                            {t("profile.seedData")}
                        </button>
                    </Link>
                    <p className="font-mono-jetbrains text-[8px] text-neutral-500 mt-2.5 leading-relaxed">
                        {t("profile.seedDesc")}
                    </p>
                </section>

                {/* Logout Button */}
                <section className="border border-white/8 bg-neutral-950/40 p-4">
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-red-950/20 border border-red-500/30 hover:border-red-500/60 font-mono-jetbrains text-[10px] tracking-wider uppercase text-red-400 hover:text-red-300 cursor-pointer rounded-none"
                    >
                        {t("profile.logout")}
                    </button>
                </section>

            </div>
        </div>
    );
}
