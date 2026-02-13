# FIDO-Miti Mobile App

## Overview
Native Android mobile application for the FIDO-Miti platform, enabling workers and citizens to access government services through "One State - One Card" initiative.

## Features Implemented

### ✅ Stage 1: Foundation (COMPLETED)
- [x] Project structure with proper folder organization
- [x] Supabase integration with AsyncStorage
- [x] AuthContext for authentication management
- [x] Zustand store for global state
- [x] Login screen with Aadhaar/OTP flow
- [x] Worker Dashboard with tabs

### 🚧 Stage 2: Dashboard & Profile (IN PROGRESS)
- [x] Home Dashboard with summary cards
- [ ] Digital Worker Card with QR code
- [ ] Profile view with document download

### 📋 Stage 3: Feature Integration (PLANNED)
- [ ] GPS-based Attendance module
- [ ] Camera integration for Grievances
- [ ] FIDO2/Passkey registration

### 📋 Stage 4: Polish & Deployment (PLANNED)
- [ ] Push Notifications
- [ ] Offline sync logic
- [ ] Production APK/AAB generation

## Project Structure

```
FIDOMitiApp/
├── src/
│   ├── screens/          # Main app screens
│   │   ├── LoginScreen.tsx
│   │   └── DashboardScreen.tsx
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-specific modules
│   ├── lib/             # Core utilities
│   │   ├── supabase.ts
│   │   └── AuthContext.tsx
│   ├── store/           # Zustand state management
│   │   └── appStore.ts
│   ├── types/           # TypeScript definitions
│   │   └── index.ts
│   ├── hooks/           # Custom React hooks
│   └── services/        # API services
├── assets/              # Images, fonts, etc.
├── android/             # Android native code
└── App.tsx             # Root component
```

## Setup Instructions

### Prerequisites
- Node.js >= 22.11.0
- React Native CLI
- Android Studio with SDK
- JDK 17+

### Installation

1. **Install Dependencies**
   ```bash
   cd FIDOMitiApp
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Setup Android**
   ```bash
   # Install Android dependencies
   cd android
   ./gradlew clean
   cd ..
   ```

4. **Run the App**
   ```bash
   # Start Metro bundler
   npm start

   # In another terminal, run Android
   npm run android
   ```

## Dependencies

### Core
- `react-native`: 0.84.0
- `react`: 19.2.3
- `typescript`: ^5.8.3

### State & Data
- `@supabase/supabase-js`: Latest
- `@react-native-async-storage/async-storage`: Latest
- `zustand`: Latest

### UI Components
- `react-native-safe-area-context`: ^5.5.2
- `react-native-qrcode-svg`: Latest

### Planned Additions
- `react-native-geolocation-service`: GPS tracking
- `react-native-vision-camera`: Photo capture
- `react-native-keychain`: Secure storage
- `@react-navigation/native`: Navigation (if needed)

## Configuration

### Supabase Setup
Update `src/lib/supabase.ts` with your credentials:
```typescript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Android Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Development Workflow

1. **Start Metro**: `npm start`
2. **Run on Device/Emulator**: `npm run android`
3. **Debug**: Shake device → "Debug" or `Ctrl+M` (emulator)
4. **Reload**: `r` in Metro terminal or double-tap `R` on device

## Building for Production

```bash
cd android
./gradlew assembleRelease
# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### Android build errors
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Dependency conflicts
```bash
rm -rf node_modules
npm install
```

## Next Steps

1. **Add Assets**: Copy AP government logo to `assets/ap-logo.png`
2. **Configure Supabase**: Update credentials in `.env`
3. **Test Login**: Use existing worker credentials
4. **Implement QR Code**: Add QR generation for worker ID
5. **Add Navigation**: Implement React Navigation for better UX

## Contributing

This is a government project. For contributions, please follow the established coding standards and submit changes through proper channels.

## License

Government of Andhra Pradesh - All Rights Reserved
