import Tts from 'react-native-tts';
import Sound from 'react-native-sound';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Re-defining interfaces here or importing them from a types file would be better clean code practice.
// For now, adhering to the guideline structure locally.
// In a real refactor, types should be in src/types or similar.

interface AttentionRisk {
    riskScore: number;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
}

enum AudioFeedbackType {
    SILENCE = 'silence',           // Risk < 0.3
    AMBIENT = 'ambient',           // 0.3 < Risk < 0.5 (subtle beep)
    NOTIFICATION = 'notification', // 0.5 < Risk < 0.75 (spoken)
    ALERT = 'alert'               // Risk > 0.75 (urgent spoken)
}

export class AudioInterface {
    private lastAlertTime = 0;
    private MIN_ALERT_INTERVAL = 3000; // ms, prevent spam

    constructor() {
        Tts.setDefaultLanguage('vi-VN');
    }

    async playFeedback(risk: AttentionRisk) {
        console.log('Feedback logic (Stubbed):', risk.reason);
        /*
        const now = Date.now();
        if (now - this.lastAlertTime < this.MIN_ALERT_INTERVAL) {
            return;
        }
        // ... logic ...
        */
    }

    private async speak(text: string, options: { rate: number }) {
        console.log('TTS:', text);
    }

    private async vibrate(pattern: 'warning' | 'info') {
        console.log('Haptic Triggered');
    }

    private async playTone(type: 'urgent' | 'info') {
        console.log('Tone Triggered');
    }
}
