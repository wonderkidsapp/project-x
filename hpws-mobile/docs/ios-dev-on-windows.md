## The Final Solution: GitHub Actions + Sideloadly (FREE)

This workflow allows you to build and test the app on your iPhone 12 Pro without a Mac and without an Apple Developer paid account ($99).

### Phase 1: Build the App (Cloud)
1. **Push Code to GitHub**: Put this project into a GitHub repository.
2. **Trigger Build**: Go to the **Actions** tab in your GitHub repo. Find the workflow **"Build iOS Unsigned"** and click **"Run workflow"**.
3. **Download Result**: After ~15 minutes, download the `hpws-ios-unsigned` artifact (it will be an `.ipa` file).

### Phase 2: Install to iPhone (Windows)
1. **Download Sideloadly**: Install [Sideloadly](https://sideloadly.io/) on your Windows PC.
2. **Connect iPhone**: Connect your iPhone 12 Pro via USB.
3. **Sign & Install**:
   - Open Sideloadly.
   - Drag the downloaded `.ipa` into Sideloadly.
   - Enter your **Apple ID** (Free account).
   - Click **Start**.
4. **Trust Development**: On your iPhone, go to **Settings > General > VPN & Device Management** and "Trust" your Apple ID.

### Phase 3: Daily Development (Fast Refresh)
Once the app is on your iPhone, you don't need to build it again unless you change native plugins.
1. Run `npx expo start` on your Windows terminal.
2. Open the **HPWS** app on your iPhone.
3. It will connect to your local Windows server. Code changes will refresh instantly!

---

## Technical Features Support
- [x] **LiDAR**: Supported (Native build).
- [x] **Sensors**: Supported (Native build).
- [x] **Fast TFLite AI**: Supported (Native build).
- [x] **Cost**: $0 (Free Apple ID + GitHub Actions).
