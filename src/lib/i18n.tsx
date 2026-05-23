"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "es";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.today": "TODAY",
    "nav.train": "TRAIN",
    "nav.coach": "COACH",
    "nav.fuel": "FUEL",
    "nav.stats": "STATS",
    // Quick Actions
    "actions.title": "Quick Actions",
    "actions.subtitle": "What would you like to track?",
    "actions.start": "Start Session",
    "actions.startDesc": "Live active workout",
    "actions.logWorkout": "Log Workout",
    "actions.logWorkoutDesc": "Add completed sets",
    "actions.logMeal": "Log Meal",
    "actions.logMealDesc": "Record food macros",
    "actions.askCoach": "Ask Coach",
    "actions.askCoachDesc": "Chat with Gemini",
    // General
    "protein": "Protein",
    "carbs": "Carbs",
    "fat": "Fat",
    "calories": "Calories",
    "remaining": "remaining",
    "target": "target",
    "est": "est.",
    "cancel": "Cancel",
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete",
    "done": "Done",
    "set": "Set",
    "weight": "Weight",
    "reps": "Reps",
    "status": "Status",
    // Home/Today
    "home.trainingLog": "Training log",
    "home.sessions": "Sessions",
    "home.primed": "PRIMED",
    "home.readiness": "Readiness",
    "home.liveWhoop": "Live · Whoop",
    "home.programmedToday": "Programmed today",
    "home.startSession": "Start session",
    "home.intake": "Intake",
    "home.loading": "LOADING CONSOLE...",
    "home.morning": "Morning",
    "home.afternoon": "Afternoon",
    "home.evening": "Evening",
    "home.night": "Good night",
    "home.greeting": "Athlete",
    // Train/Workout log
    "train.trainingLog": "Training log",
    "train.sessions": "Sessions",
    "train.thisWeek": "This week",
    "train.volume": "Volume",
    "train.prs": "PRs",
    "train.selectAll": "Select All",
    "train.noSessions": "No sessions logged.",
    "train.createFirst": "Create your first session →",
    "train.editWorkout": "Edit Workout",
    "train.deleteWorkout": "Delete Workout",
    "train.flat": "Flat",
    "train.byDay": "By Day",
    "train.byWeek": "By Week",
    "train.byMonth": "By Month",
    // Live session
    "session.recording": "Recording",
    "session.exercise": "Exercise",
    "session.of": "of",
    "session.logSet": "Log set",
    "session.addSet": "Add Set",
    "session.rest": "Rest",
    "session.target": "Target",
    "session.addEx": "Add Exercise to Session",
    "session.newEx": "New Exercise",
    "session.exName": "Exercise Name (e.g. Squat)",
    "session.exCat": "Target Category (e.g. LEGS, PULL, CORE)",
    "session.finish": "Finish Workout & Save",
    "session.alertEx": "Please add at least one exercise before logging.",
    "session.alertSets": "No valid exercises with weights and reps logged!",
    "session.discard": "Are you sure you want to discard this live session? All progress will be lost.",
    // Fuel/Nutrition
    "fuel.title": "Fuel",
    "fuel.intake": "Intake",
    "fuel.caloriesConsumed": "Calories Consumed",
    "fuel.loggedIntake": "Logged Intake",
    "fuel.noLogs": "No food logs recorded.",
    "fuel.recordManual": "Record a meal manually →",
    "fuel.quickLogPlaceholder": '"I had a chicken bowl..." — log via AI',
    // Stats/Progress
    "stats.performance": "Performance",
    "stats.trends": "Trends",
    "stats.maxLift": "Est. Max Lift progression",
    "stats.gridSessions": "Sessions",
    "stats.gridAvg": "Avg / wk",
    "stats.gridStreak": "Streak",
    "stats.gridVolume": "Volume",
    "stats.period": "this period",
    "stats.frequency": "frequency",
    "stats.streakDays": "days consecutive",
    "stats.volumeLifted": "tonnes lifted",
    "stats.prs": "Personal Records",
    "stats.noRecords": "No records logged yet.",
    "stats.newPr": "NEW",
    "stats.noDataChart": "Log at least 2 sessions with this exercise to render progression.",
    // Coach/Assistant
    "coach.title": "Coach",
    "coach.conversation": "Conversation",
    "coach.context": "Context Loaded",
    "coach.chat": "Chat",
    "coach.history": "History",
    "coach.savedSessions": "Saved Sessions",
    "coach.new": "New",
    "coach.you": "You",
    "coach.coach": "Coach",
    "coach.typing": "typing",
    "coach.askPlaceholder": "Ask anything or log details...",
    "coach.proposedSwap": "Proposed Swap",
    "coach.apply": "Apply",
    // Profile
    "profile.title": "Profile",
    "profile.edit": "Edit",
    "profile.personalInfo": "Personal Information",
    "profile.age": "Age",
    "profile.weight": "Weight",
    "profile.gender": "Gender",
    "profile.goal": "Goal",
    "profile.workoutsPerWeek": "Workouts per Week",
    "profile.workoutsVal": "workouts",
    "profile.years": "years",
    "profile.saving": "Saving...",
    "profile.dailyCal": "Daily Calorie Target",
    "profile.dailyCalDesc": "Calories per day based on your goals and activity level",
    "profile.devTools": "Developer Tools",
    "profile.seedData": "Seed Mock Data",
    "profile.seedDesc": "Generate 30 days of workout and meal data to test LLM suggestions",
    "profile.logout": "Logout",
    "profile.male": "Male",
    "profile.female": "Female",
    "profile.other": "Other",
  },
  es: {
    // Nav
    "nav.today": "HOY",
    "nav.train": "ENTRENAR",
    "nav.coach": "COACH",
    "nav.fuel": "NUTRICIÓN",
    "nav.stats": "PROGRESO",
    // Quick Actions
    "actions.title": "Acciones Rápidas",
    "actions.subtitle": "¿Qué te gustaría registrar?",
    "actions.start": "Iniciar Sesión",
    "actions.startDesc": "Entrenamiento en vivo",
    "actions.logWorkout": "Registrar Entreno",
    "actions.logWorkoutDesc": "Agregar series completadas",
    "actions.logMeal": "Registrar Comida",
    "actions.logMealDesc": "Guardar macros y calorías",
    "actions.askCoach": "Preguntar al Coach",
    "actions.askCoachDesc": "Chatear con Gemini",
    // General
    "protein": "Proteína",
    "carbs": "Carbos",
    "fat": "Grasas",
    "calories": "Calorías",
    "remaining": "restantes",
    "target": "objetivo",
    "est": "est.",
    "cancel": "Cancelar",
    "save": "Guardar",
    "edit": "Editar",
    "delete": "Eliminar",
    "done": "Listo",
    "set": "Serie",
    "weight": "Peso",
    "reps": "Reps",
    "status": "Estado",
    // Home/Today
    "home.trainingLog": "Registro de entrenamientos",
    "home.sessions": "Sesiones",
    "home.primed": "LISTO",
    "home.readiness": "Recuperación",
    "home.liveWhoop": "En vivo · Whoop",
    "home.programmedToday": "Programado hoy",
    "home.startSession": "Iniciar sesión",
    "home.intake": "Ingesta",
    "home.loading": "CARGANDO CONSOLA...",
    "home.morning": "Buenos días",
    "home.afternoon": "Buenas tardes",
    "home.evening": "Buenas noches",
    "home.night": "Buenas noches",
    "home.greeting": "Atleta",
    // Train/Workout log
    "train.trainingLog": "Registro de entrenos",
    "train.sessions": "Sesiones",
    "train.thisWeek": "Esta semana",
    "train.volume": "Volumen",
    "train.prs": "Récords",
    "train.selectAll": "Sel. Todo",
    "train.noSessions": "No hay sesiones registradas.",
    "train.createFirst": "Registra tu primer entrenamiento →",
    "train.editWorkout": "Editar Entrenamiento",
    "train.deleteWorkout": "Eliminar Entrenamiento",
    "train.flat": "Plano",
    "train.byDay": "Por Día",
    "train.byWeek": "Por Sem.",
    "train.byMonth": "Por Mes",
    // Live session
    "session.recording": "Registrando",
    "session.exercise": "Ejercicio",
    "session.of": "de",
    "session.logSet": "Registrar serie",
    "session.addSet": "Agregar serie",
    "session.rest": "Descanso",
    "session.target": "Objetivo",
    "session.addEx": "Agregar ejercicio a la sesión",
    "session.newEx": "Nuevo Ejercicio",
    "session.exName": "Nombre del Ejercicio (ej. Sentadillas)",
    "session.exCat": "Categoría Objetivo (ej. PIERNA, CORE)",
    "session.finish": "Finalizar entreno y guardar",
    "session.alertEx": "Agrega al menos un ejercicio antes de guardar.",
    "session.alertSets": "¡No se han registrado series con peso y repeticiones válidas!",
    "session.discard": "¿Seguro que quieres descartar esta sesión en vivo? Se perderá todo el progreso.",
    // Fuel/Nutrition
    "fuel.title": "Nutrición",
    "fuel.intake": "Ingesta",
    "fuel.caloriesConsumed": "Calorías Consumidas",
    "fuel.loggedIntake": "Comidas registradas",
    "fuel.noLogs": "No hay comidas registradas.",
    "fuel.recordManual": "Registrar comida manualmente →",
    "fuel.quickLogPlaceholder": '"Comí un tazón de pollo..." — registrar por IA',
    // Stats/Progress
    "stats.performance": "Rendimiento",
    "stats.trends": "Tendencias",
    "stats.maxLift": "Progresión est. de carga máxima",
    "stats.gridSessions": "Sesiones",
    "stats.gridAvg": "Promedio/sem",
    "stats.gridStreak": "Racha",
    "stats.gridVolume": "Volumen",
    "stats.period": "este período",
    "stats.frequency": "frecuencia",
    "stats.streakDays": "días seguidos",
    "stats.volumeLifted": "toneladas levantadas",
    "stats.prs": "Récords Personales",
    "stats.noRecords": "Aún no hay récords registrados.",
    "stats.newPr": "NUEVO",
    "stats.noDataChart": "Registra al menos 2 sesiones con este ejercicio para ver la progresión.",
    // Coach/Assistant
    "coach.title": "Coach",
    "coach.conversation": "Conversación",
    "coach.context": "Contexto cargado",
    "coach.chat": "Chat",
    "coach.history": "Historial",
    "coach.savedSessions": "Sesiones guardadas",
    "coach.new": "Nuevo",
    "coach.you": "Tú",
    "coach.coach": "Coach",
    "coach.typing": "escribiendo",
    "coach.askPlaceholder": "Pregunta lo que sea o registra datos...",
    "coach.proposedSwap": "Cambio Propuesto",
    "coach.apply": "Aplicar",
    // Profile
    "profile.title": "Perfil",
    "profile.edit": "Editar",
    "profile.personalInfo": "Información Personal",
    "profile.age": "Edad",
    "profile.weight": "Peso",
    "profile.gender": "Género",
    "profile.goal": "Objetivo",
    "profile.workoutsPerWeek": "Entrenamientos/sem",
    "profile.workoutsVal": "entrenos",
    "profile.years": "años",
    "profile.saving": "Guardando...",
    "profile.dailyCal": "Objetivo Diario de Calorías",
    "profile.dailyCalDesc": "Calorías por día según tus objetivos y nivel de actividad",
    "profile.devTools": "Herramientas de Desarrollador",
    "profile.seedData": "Cargar Datos Ficticios",
    "profile.seedDesc": "Genera 30 días de datos de entrenamiento y comidas para probar sugerencias",
    "profile.logout": "Cerrar sesión",
    "profile.male": "Hombre",
    "profile.female": "Mujer",
    "profile.other": "Otro",
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_language") as Language;
    if (saved === "en" || saved === "es") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferred_language", lang);
  };

  const t = (key: string): string => {
    return DICTIONARY[language][key] || DICTIONARY["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
