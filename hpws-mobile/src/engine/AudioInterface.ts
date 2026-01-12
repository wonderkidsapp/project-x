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
        const now = Date.now();

        // Debounce alerts
        if (now - this.lastAlertTime < this.MIN_ALERT_INTERVAL) {
            return;
        }

        switch (risk.urgency) {
            case 'low':
                // No audio, or subtle ambient sound
                break;

            case 'medium':
                // Spoken notification
                await this.speak(risk.reason, { rate: 1.0 });
                this.lastAlertTime = now;
                break;

            case 'high':
                // Haptic + urgent tone + spoken
                await this.vibrate('warning');
                await this.playTone('urgent');
                await this.speak(risk.reason, { rate: 1.2 }); // faster
                this.lastAlertTime = now;
                break;
        }
    }

    private async speak(text: string, options: { rate: number }) {
        try {
            await Tts.setDefaultRate(options.rate);
            await Tts.speak(text);
        } catch (e) {
            console.error("TTS Error", e);
        }
    }

    private async vibrate(pattern: 'warning' | 'info') {
        const options = {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        };

        if (pattern === 'warning') {
            ReactNativeHapticFeedback.trigger('notificationWarning', options);
        } else {
            ReactNativeHapticFeedback.trigger('impactLight', options);
        }
    }

    private async playTone(type: 'urgent' | 'info') {
        // Pre-recorded tones
        // Note: You need to ensure these files exist in the bundle
        try {
            const sound = new Sound(`${type}.mp3`, Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    console.log('failed to load the sound', error);
                    return;
                }
                sound.play();
            });
        } catch (e) {
            console.error("Sound play error", e);
        }
    }
}
