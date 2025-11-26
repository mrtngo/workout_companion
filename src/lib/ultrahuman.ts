export interface UltrahumanData {
    sleep?: {
        score: number;
        duration: number; // hours
        deepSleep: number; // minutes
        remSleep: number; // minutes
    };
    recovery?: {
        score: number;
        hrv: number;
        restingHr: number;
    };
    activity?: {
        steps: number;
        calories: number;
        activeMinutes: number;
    };
}

const ULTRAHUMAN_API_BASE = "https://api.ultrahuman.com/v1";

export const ultrahumanApi = {
    fetchData: async (token: string, accessCode: string): Promise<UltrahumanData | null> => {
        try {
            // Fetch sleep data
            const sleepResponse = await fetch(`${ULTRAHUMAN_API_BASE}/sleep/latest`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-access-code": accessCode,
                },
            });

            // Fetch recovery data
            const recoveryResponse = await fetch(`${ULTRAHUMAN_API_BASE}/recovery/latest`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-access-code": accessCode,
                },
            });

            // Fetch activity data
            const activityResponse = await fetch(`${ULTRAHUMAN_API_BASE}/activity/latest`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-access-code": accessCode,
                },
            });

            const data: UltrahumanData = {};

            if (sleepResponse.ok) {
                const sleepData = await sleepResponse.json();
                data.sleep = {
                    score: sleepData.score || 0,
                    duration: sleepData.duration_hours || 0,
                    deepSleep: sleepData.deep_sleep_minutes || 0,
                    remSleep: sleepData.rem_sleep_minutes || 0,
                };
            }

            if (recoveryResponse.ok) {
                const recoveryData = await recoveryResponse.json();
                data.recovery = {
                    score: recoveryData.score || 0,
                    hrv: recoveryData.hrv || 0,
                    restingHr: recoveryData.resting_heart_rate || 0,
                };
            }

            if (activityResponse.ok) {
                const activityData = await activityResponse.json();
                data.activity = {
                    steps: activityData.steps || 0,
                    calories: activityData.calories_burned || 0,
                    activeMinutes: activityData.active_minutes || 0,
                };
            }

            return data;
        } catch (error) {
            console.error("Error fetching Ultrahuman data:", error);
            return null;
        }
    },
};
