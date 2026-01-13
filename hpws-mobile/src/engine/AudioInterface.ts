import Tts from 'react-native-tts';
import { Audio } from 'expo-av';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface AttentionRisk {
    riskScore: number;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
}

export class AudioInterface {
    private lastAlertTime = 0;
    private MIN_ALERT_INTERVAL = 3000;
    private isReady = false;

    constructor() { }

    public async load(): Promise<void> {
        try {
            console.log('AudioInterface: Initializing...');

            // 1. Setup Audio Session for iOS 18
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            // 2. Setup TTS
            await Tts.getInitStatus();
            await Tts.setDefaultLanguage('vi-VN');

            this.isReady = true;
            console.log('AudioInterface: Ready');
        } catch (e) {
            console.error('AudioInterface: Init Failed', e);
            // We don't throw here to allow app to run even if audio fails
        }
    }

    async playFeedback(risk: AttentionRisk) {
        if (!this.isReady) return;

        const now = Date.now();
        if (now - this.lastAlertTime < this.MIN_ALERT_INTERVAL) {
            return;
        }

        switch (risk.urgency) {
            case 'low':
                break;
            case 'medium':
                await this.speak(risk.reason, { rate: 1.0 });
                await this.playTone('info');
                this.lastAlertTime = now;
                break;
            case 'high':
                await this.vibrate('warning');
                await this.playTone('urgent');
                await this.speak(risk.reason, { rate: 1.2 });
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
        try {
            const soundAsset = type === 'urgent'
                ? require('../../assets/sounds/urgent.mp3')
                : require('../../assets/sounds/info.mp3');

            const { sound } = await Audio.Sound.createAsync(soundAsset);
            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (e) {
            console.error("AudioInterface: Sound play error", e);
        }
    }
}
