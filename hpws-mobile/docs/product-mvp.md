# HPWS HPDE - MVP SUMMARY

## PRODUCT CONTEXT (30 seconds pitch)
**HPWS HPDE** is a smartphone application supporting mobility for visually impaired people in Vietnam, using AI to detect obstacles and provide audio warnings in real-time.

*   **Core Differentiator**: Not "navigation" but "enhanced perception" - the app tells users what it sees along with confidence levels, allowing humans to decide for themselves.
*   **Target Users**: 1.4 million visually impaired/low vision people in Vietnam.
*   **Business Model**: B2B (Enterprises, NGOs) + B2C (Direct to consumer).
*   **Timing**: Start with HPDE (visually impaired) in VN to build a data moat, then expand to warehouse/industrial (General HPWS).

---

## MVP FEATURES LIST (MUST-HAVE)

### ✅ CORE ENGINE (P0 - Blockers)
| ID | Feature | Description | Why Essential |
| :--- | :--- | :--- | :--- |
| **C1** | **Object Detection** | Detect people, vehicles, objects (YOLO) | Core functionality |
| **C2** | **Distance Estimation** | Measure distance using LiDAR/monocular | Safety critical |
| **C3** | **Attention Risk Engine** | Logic to decide when to alert | Brain of the system |
| **C4** | **Audio Alerts** | TTS with object + distance + confidence info (Vietnamese) | Primary output |
| **C5** | **Haptic Feedback** | Vibration to emphasize urgency | Accessibility |

**Deliverable**: App runs, detects obstacles, and alerts in Vietnamese.

### ✅ USER INTERFACE (P0 - Blockers)
| ID | Feature | Description | Why Essential |
| :--- | :--- | :--- | :--- |
| **U1** | **Voice Control** | Voice commands (Vietnamese) | Hands-free, accessibility |
| **U2** | **Accessibility UI** | Large buttons, high contrast, screen reader support | Target users are blind/low vision |

**Deliverable**: Visually impaired users can use the app completely independently.

### ✅ DATA & RELIABILITY (P0 - Blockers)
| ID | Feature | Description | Why Essential |
| :--- | :--- | :--- | :--- |
| **D1** | **Local Logging** | SQLite database storing detections, feedback | Learning & improvement |
| **R1** | **Offline Mode** | 100% functionality without internet | Vietnam internet reliability |
| **R2** | **Battery Optimization** | Adaptive FPS, power save mode | Must last >3 hours |

**Deliverable**: App works anywhere, anytime, and collects data for improvement.

---

## MVP SCOPE SUMMARY

### ✅ IN SCOPE (MVP - Must Build)
**WHAT USER CAN DO:**
1.  Open app via voice command "Bắt đầu" (Start).
2.  App detects obstacles ahead (person, car, objects).
3.  Hear warning: "Cảnh báo: Người ở 2 mét phía trước, độ tin cậy 85%" (Warning: Person 2 meters ahead, 85% confidence).
4.  Feel vibration when dangerous.
5.  Stop app via "Dừng lại" (Stop).
6.  Feedback "hữu ích" (helpful) or "không hữu ích" (not helpful) after alert.
7.  App operates 100% offline.
8.  Use >3 hours continuously.

**TECHNICAL:**
*   **Object detection**: 15-20 classes (person, car, chair, etc.).
*   **Distance**: 0.5m - 5m range.
*   **Accuracy**: >70% precision, >60% recall.
*   **Latency**: <500ms from detection → alert.
*   **FPS**: 2-3 frames/second.
*   **Works on**: iPhone 12 Pro+ (with LiDAR).

### ❌ OUT OF SCOPE (Not in MVP)
*   Turn-by-turn navigation (too complex).
*   Text/sign recognition (OCR).
*   Face recognition (privacy concerns).
*   Indoor mapping (not needed).
*   Cloud sync (can be offline).
*   Multi-language (only Vietnamese).
*   Android support (iOS first).
*   Wearable integration (phone only).
*   Community features (too early).
*   Payment/subscription (free MVP).

---

## MINIMUM SUCCESS CRITERIA (MVP)

**Technical Metrics:**
*   [ ] Detection accuracy: Precision ≥70%, Recall ≥60%
*   [ ] Distance RMSE: <1.5m for objects within 5m
*   [ ] Latency: <500ms (95th percentile)
*   [ ] Battery: ≥3 hours continuous use
*   [ ] Crash rate: <0.5%
*   [ ] App size: <80MB

**User Metrics:**
*   [ ] 5 beta users complete 1-hour session each
*   [ ] Average satisfaction: ≥3.5/5
*   [ ] False positive rate: <20%
*   [ ] At least 3 "helpful" feedback per user

**Business Metrics:**
*   [ ] Partnership with 1 NGO (Blind Association)
*   [ ] 50 users signed up for beta
*   [ ] 5+ testimonials collected
*   [ ] 1 media mention (blog/news)

---

## DEVELOPMENT PHASES (High Level)

### Phase 1: MVP Core (Priority Now)
**Timeline**: A few weeks.
**Features**: C1, C2, C3, C4, C5, U1, U2, D1, R1, R2.
**Deliverable**:
*   Working app on iPhone 12 Pro.
*   5 beta users test successfully.
*   Basic data logging.

### Phase 2: Production Ready (Next)
**Timeline**: 1-2 months after MVP.
**Features**: Object tracking, Context awareness, Alert scheduling, Adaptive thresholds, Settings screen, Onboarding flow.
**Deliverable**: App Store ready, 50-100 users, Proven reliability.

### Phase 3: Scale (Future)
**Timeline**: 3-6 months after MVP.
**Features**: Android support, Multi-language, Cloud sync, B2B features.
**Deliverable**: 500+ users, NGO partnerships, Revenue generation.

---

## HARDWARE REQUIREMENTS (MVP)

**Minimum:**
*   **Device**: iPhone 12 Pro (6.1") - LiDAR capable.
*   **OS**: iOS 15.0+.
*   **Specs**: 6GB RAM, 64GB storage (32GB available).

**Why LiDAR essential:**
*   Accuracy: 5x better than monocular.
*   Range: 5m vs 2-3m.
*   Works in darkness.
*   Real-time (30 FPS depth).
*   Safety-critical for visually impaired.

**Testing devices:**
*   Primary: iPhone 12 Pro.
*   Secondary: iPhone 13 Pro (verify newer gen).
*   Fallback: iPhone 11 (test monocular mode - Phase 2).

---

TECH STACK (MVP)
Frontend:
- React Native 0.73+
- TypeScript (strict mode)

Backend:
- Python (Mandatory)

ML Models:
- YOLO11n (object detection) - 6.5MB
- MiDaS v3 Small (depth) - 13MB
- TensorFlow Lite (inference)

Database:
- supabase

Audio:
- react-native-tts (Vietnamese)
- react-native-sound (tones)

Sensors:
- react-native-vision-camera
- ARKit (LiDAR access)
- react-native-sensors (IMU)

Testing:
- Jest (unit tests)
- Detox (E2E tests)

DevOps:
- GitHub Actions (Build Cloud)
- Vercel (Backend Hosting)
- Sentry (crash reporting)
- TestFlight / Sideloadly (beta distribution)

## DEPLOYMENT STRATEGY
- **Frontend (iOS):** Build via GitHub Actions (unsigned .ipa), install via Sideloadly for testing. Local dev via Expo dev-client.
- **Backend (Python):** Deploy to Vercel for API and Analytics processing.
- **Database:** Supabase (Cloud).

---

## FILE STRUCTURE (Implemented)
```
root/
├── hpws-backend/            # Python Backend (Mandatory)
│   ├── src/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
├── hpws-mobile/
├── docs/                    # Project documentation
│   ├── product-mvp.md
│   ├── hpws-mvp-guideline.md
│   └── project-rules.md
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/
│   ├── components/          # UI components
│   │   ├── CameraView.tsx
│   │   ├── StatusDisplay.tsx
│   │   └── SettingsScreen.tsx
│   ├── engine/              # Core logic
│   │   ├── AttentionRiskEngine.ts
│   │   ├── ObjectDetector.ts
│   │   ├── DepthEstimator.ts
│   │   └── AudioInterface.ts
│   ├── utils/               # Helpers
│   │   ├── storage.ts
│   │   ├── permissions.ts
│   │   └── analytics.ts
│   ├── models/              # ML models
│   │   ├── yolo11.tflite
│   │   └── midas_small.tflite
│   └── App.tsx              # Entry point
├── assets/                  # Sounds, images
├── tests/                   # Unit tests
└── package.json
```

---

## SYSTEM ARCHITECTURE
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
