# Quick Start Guide - FIDO-Miti Mobile App

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js >= 22.11.0
- ✅ Android Studio installed
- ✅ JDK 17 or higher
- ✅ Android SDK (API 33+)
- ✅ Android device or emulator

## Step-by-Step Setup

### 1. Install Dependencies (Already Done ✅)
```bash
cd FIDOMitiApp
npm install
```

**Installed packages:**
- @supabase/supabase-js
- @react-native-async-storage/async-storage
- zustand
- react-native-qrcode-svg

### 2. Configure Environment

**Create `.env` file:**
```bash
cd FIDOMitiApp
copy .env.example .env
```

**Edit `.env` with your credentials:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
API_BASE_URL=https://your-api-server.com
FIDO_SERVER_URL=https://your-fido-server.com
APP_ENV=development
```

**Update `src/lib/supabase.ts`:**
```typescript
const SUPABASE_URL = 'YOUR_ACTUAL_URL';
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_KEY';
```

### 3. Add Assets

**Copy AP Government Logo:**
```bash
# Copy your logo file to:
FIDOMitiApp/assets/ap-logo.png
```

**Update LoginScreen.tsx (line 67):**
```typescript
// Change from:
source={require('../../assets/ap-logo.png')}
// To your actual asset path if different
```

### 4. Android Setup

**Option A: Using Android Studio**
1. Open Android Studio
2. Open AVD Manager
3. Create/Start an Android emulator (API 33+)

**Option B: Using Physical Device**
1. Enable Developer Options on your Android phone
2. Enable USB Debugging
3. Connect via USB
4. Verify connection: `adb devices`

### 5. Run the App

**Terminal 1 - Start Metro Bundler:**
```bash
cd FIDOMitiApp
npm start
```

**Terminal 2 - Run on Android:**
```bash
cd FIDOMitiApp
npm run android
```

**Or run both in one command:**
```bash
cd FIDOMitiApp
npm run android
# Metro will start automatically
```

### 6. Test the App

**Login Flow:**
1. Enter any 12-digit number (e.g., `123456789012`)
2. Click "Send OTP"
3. Enter any 6-digit number (e.g., `123456`)
4. Click "Verify & Login"

**Dashboard Features:**
1. View Overview tab with stats
2. Check Attendance records
3. View Profile information
4. Click "Show Digital Card" to see QR code

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npm start -- --reset-cache
```

### Android Build Errors
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Port Already in Use
```bash
# Kill process on port 8081
npx react-native start --port 8082
```

### Dependencies Issues
```bash
# Reinstall node_modules
rm -rf node_modules
npm install
```

### Gradle Issues
```bash
cd android
./gradlew clean
./gradlew assembleDebug --stacktrace
```

## Development Tips

### Hot Reload
- Press `r` in Metro terminal to reload
- Shake device or press `Ctrl+M` (emulator) for dev menu
- Enable "Fast Refresh" in dev menu

### Debug Mode
1. Open dev menu (shake device)
2. Select "Debug"
3. Chrome DevTools will open
4. Use Console for logs

### View Logs
```bash
# Android logs
npx react-native log-android

# Or use adb
adb logcat | grep ReactNative
```

### Inspect Element
1. Open dev menu
2. Select "Show Inspector"
3. Tap elements to inspect

## Next Steps After Setup

1. **Configure Supabase**
   - Update credentials in `src/lib/supabase.ts`
   - Test database connection

2. **Test Authentication**
   - Implement real OTP API
   - Connect to backend

3. **Add Real Data**
   - Fetch actual worker profiles
   - Load real attendance records

4. **Customize Branding**
   - Update colors in styles
   - Add organization logo

5. **Implement Remaining Features**
   - Schemes tab details
   - Document downloads
   - GPS attendance

## Useful Commands

```bash
# Start Metro
npm start

# Run on Android
npm run android

# Run on iOS (if configured)
npm run ios

# Run tests
npm test

# Lint code
npm run lint

# Build release APK
cd android
./gradlew assembleRelease
```

## File Structure Reference

```
FIDOMitiApp/
├── src/
│   ├── screens/         # Main screens
│   ├── components/      # Reusable components
│   ├── lib/            # Core utilities
│   ├── store/          # State management
│   ├── types/          # TypeScript types
│   ├── features/       # Feature modules
│   ├── hooks/          # Custom hooks
│   └── services/       # API services
├── android/            # Android native code
├── assets/             # Images, fonts
└── App.tsx            # Root component
```

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed info
2. Review `MOBILE_README.md` for full documentation
3. Check React Native docs: https://reactnative.dev
4. Check Supabase RN guide: https://supabase.com/docs/guides/getting-started/tutorials/with-react-native

---

**Ready to go!** 🚀

Run `npm run android` and start developing!
