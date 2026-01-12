import { createClient } from '@supabase/supabase-js';

// TODO: Replace with actual environment variables
const SUPABASE_URL = 'https://xyzcompany.supabase.co';
const SUPABASE_KEY = 'public-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface LogEntry {
    timestamp: number;
    session_id: string; // Adjusted to match snake_case likely in DB
    detections: any; // JSONB
    environment_state: any; // JSONB
    attention_risk: any; // JSONB
    feedback_given: string;
    user_feedback?: string;
    device_model: string;
    app_version: string;
    battery_level: number;
}

export const storage = {
    saveLog: async (log: LogEntry) => {
        try {
            const { error } = await supabase
                .from('logs')
                .insert(log);

            if (error) {
                console.error('Error saving log to Supabase:', error);
            }
        } catch (e) {
            console.error('Exception saving log:', e);
        }
    },

    // Keep local storage for preferences/offline caching if needed
    saveLocal: async (key: string, value: any) => {
        console.log('Saving local preference', key, value);
        // impl using AsyncStorage later
    }
};
