# HPWS HPDE - MVP GUIDELINE

## II. SYSTEM ARCHITECTURE
### 2.1 High-Level Architecture
```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│  (Audio I/O, Haptic Feedback)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Application Logic Layer            │
│  (Attention Risk Engine, State Mgmt)    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Perception Layer                   │
│  (Object Detection, Depth, Tracking)    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Sensor Layer                    │
│  (Camera, LiDAR/Depth, IMU, Audio)      │
└─────────────────────────────────────────┘
```

## III. TECHNICAL STACK
### 3.1 Frontend (React Native)
**Why React Native:**
*   Cross-platform (iOS + Android from 1 codebase)
*   Fast iteration
*   Good accessibility support
*   Large ecosystem

**Dependencies:**
```json
{
  "react-native": "^0.73.0",
  "react-native-vision-camera": "^3.6.0",
  "react-native-tflite": "^0.3.0",
  "react-native-sensors": "^7.3.0",
  "react-native-sound": "^0.11.2",
  "react-native-tts": "^4.1.0",
  "react-native-haptic-feedback": "^2.2.0",
  "react-native-keep-awake": "^4.0.0"
}
```

### 3.2 Backend
**Language:** Python (Mandatory)
**Purpose:** Data processing, Analytics, and API services.

### 3.3 ML Models (On-Device)
**Model 1: Object Detection - MobileNet SSD v2**
*   **Specs:**
    *   Input: 300×300 RGB image
    *   Output: Bounding boxes, classes, confidence scores
    *   Classes: COCO dataset (80 classes) → filter relevant ones
    *   Inference time: <100ms on modern phones
    *   Model size: ~10MB

*   **Relevant classes for HPDE:**
```python
RELEVANT_CLASSES = {
    0: 'person',
    1: 'bicycle', 
    2: 'car',
    3: 'motorcycle',
    5: 'bus',
    7: 'truck',
    9: 'traffic light',
    11: 'stop sign',
    13: 'bench',
    15: 'bird',  # low priority
    16: 'cat',
    17: 'dog',
    24: 'backpack',
    26: 'handbag',
    39: 'bottle',
    41: 'cup',
    56: 'chair',
    57: 'couch',
    58: 'potted plant',
    59: 'bed',
    60: 'dining table',
    62: 'tv',
    # ... 15-20 most relevant
}
```

*   **Download model:**
    `wget https://storage.googleapis.com/download.tensorflow.org/models/tflite/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip`

**Model 2: Depth Estimation - MiDaS Small**
*   **Specs:**
    *   Input: 256×256 RGB image
    *   Output: Depth map (relative depth)
    *   Inference time: ~150ms
    *   Model size: ~13MB

*   **Alternative (if phone has LiDAR):**
    *   iOS: ARKit Depth API (iPhone 12 Pro+, iPad Pro 2020+)
    *   Android: ARCore Depth API (Pixel 4+, Galaxy S20+)

*   **Depth estimation logic:**
```python
# Pseudo-code
def estimate_distance(bbox, depth_map):
    """
    Estimate distance from bounding box and depth map
    """
    # Get region of interest from bbox
    x1, y1, x2, y2 = bbox
    roi = depth_map[y1:y2, x1:x2]
    
    # Use percentile instead of mean (robust to noise)
    distance_relative = np.percentile(roi, 50)
    
    # Convert relative depth → absolute distance
    # Calibration curve learned from data
    distance_meters = depth_to_meters(distance_relative)
    
    return distance_meters

def depth_to_meters(relative_depth):
    """
    Calibration function: relative depth → meters
    Learned from real data
    """
    # Simplified linear for MVP
    # Better: polynomial or learned mapping
    return 0.5 + (1 - relative_depth) * 10  # 0.5m to 10.5m range
```

### 3.3 Attention Risk Engine (Core IP)
**File: `AttentionRiskEngine.ts`**
```typescript
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

class AttentionRiskEngine {
  
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
  };
  
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
      reason: this.generateReason(maxRiskObject!, maxRisk),
      targetObject: maxRiskObject!
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
```

### 3.4 Audio Interface
**Design principles:**
*   Non-intrusive (no spam)
*   Contextual (only speak when needed)
*   Clear Vietnamese pronunciation
*   Respectful tone

**Audio feedback types:**
```typescript
enum AudioFeedbackType {
  SILENCE = 'silence',           // Risk < 0.3
  AMBIENT = 'ambient',           // 0.3 < Risk < 0.5 (subtle beep)
  NOTIFICATION = 'notification', // 0.5 < Risk < 0.75 (spoken)
  ALERT = 'alert'               // Risk > 0.75 (urgent spoken)
}

class AudioInterface {
  private lastAlertTime = 0;
  private MIN_ALERT_INTERVAL = 3000; // ms, prevent spam
  
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
    // Using react-native-tts
    Tts.setDefaultLanguage('vi-VN');
    Tts.setDefaultRate(options.rate);
    await Tts.speak(text);
  }
  
  private async vibrate(pattern: 'warning' | 'info') {
    // Using react-native-haptic-feedback
    if (pattern === 'warning') {
      HapticFeedback.trigger('notificationWarning');
    } else {
      HapticFeedback.trigger('impactLight');
    }
  }
  
  private async playTone(type: 'urgent' | 'info') {
    // Pre-recorded tones
    const sound = new Sound(`${type}.mp3`, Sound.MAIN_BUNDLE);
    sound.play();
  }
}
```

## IV. DATA FLOW
### 4.1 Main Processing Loop
```typescript
class HPWSApp {
  private camera: Camera;
  private objectDetector: ObjectDetector;
  private depthEstimator: DepthEstimator;
  private attentionEngine: AttentionRiskEngine;
  private audioInterface: AudioInterface;
  private imu: IMU;
  
  private FPS = 3; // Process 3 frames per second (balance battery/latency)
  
  async start() {
    // Initialize components
    await this.camera.start();
    await this.objectDetector.load();
    await this.depthEstimator.load();
    
    // Main loop
    setInterval(async () => {
      await this.processFrame();
    }, 1000 / this.FPS);
  }
  
  private async processFrame() {
    // 1. Capture frame
    const frame = await this.camera.captureFrame();
    
    // 2. Run object detection (parallel with depth)
    const [detections, depthMap] = await Promise.all([
      this.objectDetector.detect(frame),
      this.depthEstimator.estimate(frame)
    ]);
    
    // 3. Fuse detections with depth
    const detectionsWithDepth = detections.map(det => ({
      ...det,
      distance: this.estimateDistance(det.bbox, depthMap)
    }));
    
    // 4. Get environment state
    const envState: EnvironmentState = {
      detections: detectionsWithDepth,
      userVelocity: this.imu.getVelocity(),
      ambientNoise: await this.getAmbientNoise(),
      timeOfDay: this.getTimeOfDay()
    };
    
    // 5. Compute attention risk
    const risk = this.attentionEngine.computeAttentionRisk(envState);
    
    // 6. Provide feedback
    await this.audioInterface.playFeedback(risk);
    
    // 7. Log for analytics (optional)
    this.logData(envState, risk);
  }
  
  private estimateDistance(
    bbox: [number, number, number, number],
    depthMap: number[][]
  ): number {
    // Implementation from earlier
    // ...
  }
}
```

### 4.2 Performance Optimization
**Battery optimization:**
```typescript
class BatteryManager {
  private batteryLevel: number;
  
  adjustProcessingRate(): number {
    if (this.batteryLevel < 0.15) {
      return 1; // 1 FPS when low battery
    } else if (this.batteryLevel < 0.30) {
      return 2; // 2 FPS
    } else {
      return 3; // 3 FPS normal
    }
  }
  
  async enablePowerSaveMode() {
    // Reduce camera resolution
    this.camera.setResolution(640, 480); // instead of 1280x720
    
    // Use lighter models
    this.objectDetector.useLightModel();
    
    // Increase alert interval
    this.audioInterface.MIN_ALERT_INTERVAL = 5000; // 5s instead of 3s
  }
}
```

## V. USER INTERFACE
### 5.1 Accessibility-First Design
**Principles:**
*   100% voice-controlled (no need to see)
*   Large touch targets
*   High contrast (for low vision users)
*   Haptic feedback for all actions

### 5.2 Screen Layout (Minimal)
```
┌─────────────────────────────────┐
│                                 │
│     [Camera Viewfinder]         │  ← Not important for blind users
│     (Optional, for sighted      │     but useful for testing
│      helpers)                   │
│                                 │
├─────────────────────────────────┤
│  STATUS:                        │
│  ● Active                       │  ← Haptic pulse every 5s
│  🔋 Battery: 78%                │     to confirm activity
│  📡 Processing: 3 FPS           │
├─────────────────────────────────┤
│                                 │
│    [LARGE START/STOP BUTTON]    │  ← Full screen
│                                 │     at the bottom
│    Double-tap to toggle         │
│                                 │
└─────────────────────────────────┘
```

**Voice commands:**
*   "Bắt đầu" → Start detection
*   "Dừng lại" → Stop detection
*   "Trạng thái" → Read status
*   "Pin" → Read battery level
*   "Cài đặt" → Open settings

### 5.3 Settings Screen
**Configurable parameters:**
```typescript
interface UserSettings {
  // Audio
  speechRate: number;        // 0.5 - 2.0x
  volume: number;            // 0 - 100%
  useVietnameseTTS: boolean; // vs English
  
  // Sensitivity
  alertSensitivity: 'low' | 'medium' | 'high';
  minAlertDistance: number;  // 1-5 meters
  
  // Privacy
  saveData: boolean;         // Log for improvement
  shareAnonymous: boolean;   // Anonymous analytics
  
  // Battery
  powerSaveMode: boolean;
  autoStopOnLowBattery: boolean;
}
```

## VI. DATA LOGGING & ANALYTICS
### 6.1 Local Data Storage
**Purpose:** Learn & improve algorithm
**Schema:**
```typescript
interface LogEntry {
  timestamp: number;
  sessionId: string;
  
  // Input
  detections: ObjectDetection[];
  environmentState: EnvironmentState;
  
  // Output
  attentionRisk: AttentionRisk;
  feedbackGiven: AudioFeedbackType;
  
  // User interaction (optional)
  userFeedback?: 'helpful' | 'not_helpful' | 'false_alarm';
  
  // Metadata
  deviceModel: string;
  appVersion: string;
  batteryLevel: number;
}
```
**Storage:**
*   Supabase database
*   Export feature (JSON) for analysis
*   **Privacy:** No PII, no images stored

### 6.2 User Feedback Collection
**Simple feedback mechanism:**
After each alert, optionally ask: "Cảnh báo này có hữu ích không?"

```
[Thumbs up button]   [Thumbs down button]

← Large, tactile buttons
← Or voice: "Có" / "Không"
```

**Data collected:**
*   **True positive:** Alert was helpful
*   **False positive:** Alert was unnecessary
*   **Missed event:** User encountered obstacle without alert (harder to detect)

## VII. TESTING & VALIDATION
### 7.1 Unit Tests
**Critical components to test:**
```typescript
describe('AttentionRiskEngine', () => {
  test('should return high risk for close person', () => {
    const detection: ObjectDetection = {
      class: 'person',
      confidence: 0.85,
      distance: 1.0, // 1 meter
      bbox: [100, 100, 200, 300]
    };
    
    const state: EnvironmentState = {
      detections: [detection],
      userVelocity: 1.5, // walking
      ambientNoise: 0.3,
      timeOfDay: 'day'
    };
    
    const risk = engine.computeAttentionRisk(state);
    
    expect(risk.urgency).toBe('high');
    expect(risk.riskScore).toBeGreaterThan(0.75);
  });
  
  test('should return low risk for distant chair with low confidence', () => {
    const detection: ObjectDetection = {
      class: 'chair',
      confidence: 0.55,
      distance: 8.0, // 8 meters
      bbox: [100, 100, 200, 300]
    };
    
    const state: EnvironmentState = {
      detections: [detection],
      userVelocity: 0.5, // slow walk
      ambientNoise: 0.2,
      timeOfDay: 'day'
    };
    
    const risk = engine.computeAttentionRisk(state);
    
    expect(risk.urgency).toBe('low');
    expect(risk.riskScore).toBeLessThan(0.3);
  });
});
```

### 7.2 Field Testing Protocol
**Phase 1: Controlled Environment (Week 1-2)**
*   Location: Indoor corridor, controlled
*   Test scenarios: Static obstacles, Moving obstacles, Multiple obstacles, Low light
*   Measure: Accuracy, Distance error, Latency, False positive rate
*   **Goal:** <10% false positive, >90% true positive

**Phase 2: Semi-Controlled (Week 3-4)**
*   Location: Park, sidewalk (low traffic)
*   Test scenarios: Trees/benches, Pedestrians, Cyclists, Uneven terrain
*   Measure: Same as Phase 1 + User feedback (5 beta testers), Battery life
*   **Goal:** User satisfaction >4/5

**Phase 3: Real World (Week 5-8)**
*   Location: City streets, markets, public transport
*   Test scenarios: High traffic, Complex environments, Varied lighting, Rain
*   Measure: Usability, Edge cases, Testimonials
*   **Goal:** 10 users × 2 weeks each = 140 user-days
