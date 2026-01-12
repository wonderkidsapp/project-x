interface ObjectDetection {
    class: string;
    bbox: [number, number, number, number];
    confidence: number;
    distance: number;
}

interface EnvironmentState {
    detections: ObjectDetection[];
    userVelocity: number;  // from IMU
    ambientNoise: number;  // from mic
    timeOfDay: 'day' | 'night';
}

interface AttentionRisk {
    riskScore: number;  // 0-1
    urgency: 'low' | 'medium' | 'high';
    reason: string;
    targetObject?: ObjectDetection;
}

export class AttentionRiskEngine {

    // Tunable parameters
    private CONFIDENCE_THRESHOLD = 0.7;
    private DISTANCE_CRITICAL = 1.5;  // meters
    private DISTANCE_WARNING = 3.0;   // meters

    // Severity weights for different object classes
    private SEVERITY_WEIGHTS = {
        'person': 1.0,      // highest priority
        'car': 0.95,
        'motorcycle': 0.95,
        'bicycle': 0.85,
        'dog': 0.80,
        'truck': 0.90,
        'bus': 0.90,
        'traffic light': 0.70,
        'stop sign': 0.70,
        'chair': 0.50,
        'table': 0.50,
        'default': 0.60
    } as Record<string, number>;

    computeAttentionRisk(state: EnvironmentState): AttentionRisk {
        if (state.detections.length === 0) {
            return {
                riskScore: 0,
                urgency: 'low',
                reason: 'No obstacles detected'
            };
        }

        // Find highest risk object
        let maxRisk = 0;
        let maxRiskObject: ObjectDetection | null = null;

        for (const detection of state.detections) {
            const risk = this.computeObjectRisk(detection, state);
            if (risk > maxRisk) {
                maxRisk = risk;
                maxRiskObject = detection;
            }
        }

        // Determine urgency
        let urgency: 'low' | 'medium' | 'high' = 'low';
        if (maxRisk > 0.75) urgency = 'high';
        else if (maxRisk > 0.5) urgency = 'medium';

        return {
            riskScore: maxRisk,
            urgency,
            reason: maxRiskObject ? this.generateReason(maxRiskObject, maxRisk) : 'Low risk',
            targetObject: maxRiskObject || undefined
        };
    }

    private computeObjectRisk(
        detection: ObjectDetection,
        state: EnvironmentState
    ): number {
        // Component 1: Machine uncertainty (inverse of confidence)
        const uncertaintyScore = 1 - detection.confidence;

        // Component 2: Proximity risk (closer = higher risk)
        let proximityScore = 0;
        if (detection.distance < this.DISTANCE_CRITICAL) {
            proximityScore = 1.0;
        } else if (detection.distance < this.DISTANCE_WARNING) {
            proximityScore = 0.7;
        } else {
            proximityScore = Math.max(0, 1 - detection.distance / 10);
        }

        // Component 3: Object severity
        const severity = this.SEVERITY_WEIGHTS[detection.class]
            || this.SEVERITY_WEIGHTS['default'];

        // Component 4: Motion factor (if user moving fast, higher risk)
        const motionFactor = Math.min(1.0, state.userVelocity / 2.0); // 2 m/s = fast walk

        // Weighted combination
        const risk = (
            uncertaintyScore * 0.25 +
            proximityScore * 0.40 +
            severity * 0.25 +
            motionFactor * 0.10
        );

        return Math.min(1.0, risk);
    }

    private generateReason(obj: ObjectDetection, risk: number): string {
        const distStr = obj.distance.toFixed(1);
        const confStr = Math.round(obj.confidence * 100);

        // Vietnamese language output
        if (risk > 0.75) {
            return `Cảnh báo: ${this.translateClass(obj.class)} ở ${distStr} mét phía trước. Độ tin cậy ${confStr}%.`;
        } else if (risk > 0.5) {
            return `Chú ý: Có ${this.translateClass(obj.class)} ở ${distStr} mét. Độ tin cậy ${confStr}%.`;
        } else {
            return `Phát hiện ${this.translateClass(obj.class)} ở ${distStr} mét.`;
        }
    }

    private translateClass(cls: string): string {
        const translations: Record<string, string> = {
            'person': 'người',
            'car': 'xe hơi',
            'motorcycle': 'xe máy',
            'bicycle': 'xe đạp',
            'dog': 'chó',
            'cat': 'mèo',
            'chair': 'ghế',
            'table': 'bàn',
            // ... add more
        };
        return translations[cls] || cls;
    }
}
