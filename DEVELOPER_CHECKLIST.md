# Developer Checklist - FIDO-Miti Mobile App

## 🎯 Before You Start

- [ ] Read `QUICK_START.md` for setup instructions
- [ ] Read `IMPLEMENTATION_SUMMARY.md` for current status
- [ ] Read `MOBILE_README.md` for full documentation
- [ ] Review `MOBILE_APP_IMPLEMENTATION_PLAN.md` for roadmap

## ✅ Initial Setup Tasks

### Environment Configuration
- [ ] Create `.env` file from `.env.example`
- [ ] Add Supabase URL to `.env`
- [ ] Add Supabase Anon Key to `.env`
- [ ] Update `src/lib/supabase.ts` with credentials
- [ ] Verify Supabase connection

### Assets
- [ ] Add AP government logo to `assets/ap-logo.png`
- [ ] Update LoginScreen to use correct logo path
- [ ] Add app icon (if needed)
- [ ] Add splash screen (if needed)

### Dependencies
- [x] Install core dependencies (already done)
- [ ] Test all imports work correctly
- [ ] Verify no dependency conflicts

### Testing
- [ ] Run app on Android emulator
- [ ] Test login flow
- [ ] Test dashboard navigation
- [ ] Test Digital Card QR code
- [ ] Verify data fetching from Supabase

## 🚧 Stage 2 Completion Tasks (25% Remaining)

### Schemes Tab Implementation
- [ ] Create `src/components/SchemeCard.tsx`
- [ ] Create `src/components/SchemeFilter.tsx`
- [ ] Implement scheme list rendering in Dashboard
- [ ] Add filter by type (Central, State, Welfare Board)
- [ ] Add search functionality
- [ ] Implement scheme details modal
- [ ] Add "Apply" button functionality
- [ ] Connect to Supabase schemes table

### Document Downloads
- [ ] Install `react-native-fs` or `react-native-blob-util`
- [ ] Create `src/services/documentService.ts`
- [ ] Implement PDF download functionality
- [ ] Add document viewer (optional)
- [ ] Handle download permissions
- [ ] Show download progress
- [ ] Store downloaded files locally

### Profile Enhancements
- [ ] Add edit profile functionality
- [ ] Implement photo upload
- [ ] Add family members section
- [ ] Display health insurance details
- [ ] Show bank account info (masked)

## 📋 Stage 3 Tasks (GPS & Camera)

### GPS-based Attendance
- [ ] Install `react-native-geolocation-service`
- [ ] Request location permissions
- [ ] Create `src/features/attendance/AttendanceScreen.tsx`
- [ ] Implement geofencing logic
- [ ] Add check-in/check-out buttons
- [ ] Show current location on map (optional)
- [ ] Implement offline queue for attendance
- [ ] Sync attendance when online

### Camera Integration
- [ ] Install `react-native-vision-camera`
- [ ] Request camera permissions
- [ ] Create `src/components/CameraCapture.tsx`
- [ ] Implement photo capture for grievances
- [ ] Add photo preview before submit
- [ ] Compress images before upload
- [ ] Upload to Supabase storage
- [ ] Implement profile photo update

### Grievance System
- [ ] Create `src/screens/GrievanceScreen.tsx`
- [ ] Create `src/components/GrievanceForm.tsx`
- [ ] Add category selection
- [ ] Implement photo attachment
- [ ] Add GPS location to grievance
- [ ] Submit to Supabase
- [ ] Show grievance history
- [ ] Implement status tracking

## 📋 Stage 4 Tasks (Polish & Deploy)

### Push Notifications
- [ ] Install `@react-native-firebase/messaging`
- [ ] Configure Firebase project
- [ ] Request notification permissions
- [ ] Implement FCM token registration
- [ ] Create notification handler
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Add notification preferences

### Offline Mode
- [ ] Implement network status detection
- [ ] Create offline indicator UI
- [ ] Queue failed API requests
- [ ] Implement retry logic
- [ ] Cache critical data locally
- [ ] Sync when connection restored
- [ ] Show sync status to user

### Error Handling
- [ ] Create global error boundary
- [ ] Implement error logging service
- [ ] Add user-friendly error messages
- [ ] Create retry mechanisms
- [ ] Add crash reporting (optional)

### Performance Optimization
- [ ] Implement React.memo for components
- [ ] Add useMemo/useCallback where needed
- [ ] Optimize image loading
- [ ] Implement lazy loading
- [ ] Profile app performance
- [ ] Reduce bundle size

### Production Build
- [ ] Update app version in `package.json`
- [ ] Update app version in `android/app/build.gradle`
- [ ] Configure ProGuard rules
- [ ] Generate release keystore
- [ ] Update `android/gradle.properties` with keystore info
- [ ] Build release APK
- [ ] Test release build thoroughly
- [ ] Generate AAB for Play Store

## 🔐 Security Checklist

- [ ] Remove all console.log statements
- [ ] Ensure no hardcoded credentials
- [ ] Implement secure storage for sensitive data
- [ ] Add certificate pinning (optional)
- [ ] Implement biometric authentication
- [ ] Add session timeout
- [ ] Implement secure PIN storage
- [ ] Review Supabase RLS policies

## 📱 UI/UX Improvements

- [ ] Add loading skeletons
- [ ] Implement pull-to-refresh everywhere
- [ ] Add empty state illustrations
- [ ] Improve error state UI
- [ ] Add success animations
- [ ] Implement haptic feedback
- [ ] Add accessibility labels
- [ ] Test with screen readers
- [ ] Support dark mode (optional)

## 🧪 Testing Checklist

### Manual Testing
- [ ] Test on multiple Android versions
- [ ] Test on different screen sizes
- [ ] Test with slow network
- [ ] Test offline mode
- [ ] Test with real data
- [ ] Test edge cases
- [ ] Test error scenarios

### Automated Testing (Optional)
- [ ] Set up Jest tests
- [ ] Write unit tests for utilities
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Set up E2E tests (Detox)

## 📚 Documentation Tasks

- [ ] Update README with new features
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Document troubleshooting steps
- [ ] Add code comments
- [ ] Create architecture diagram
- [ ] Document deployment process

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All features tested
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security review complete
- [ ] Documentation updated

### Play Store Preparation
- [ ] Create app listing
- [ ] Prepare screenshots
- [ ] Write app description
- [ ] Set up privacy policy
- [ ] Configure app permissions
- [ ] Set up content rating

### Post-deployment
- [ ] Monitor crash reports
- [ ] Track user feedback
- [ ] Monitor performance metrics
- [ ] Plan next iteration

## 💡 Nice-to-Have Features

- [ ] Multi-language support (Telugu, Hindi, English)
- [ ] Voice commands
- [ ] Chatbot for help
- [ ] Analytics integration
- [ ] In-app updates
- [ ] Referral system
- [ ] Rewards/gamification
- [ ] Social sharing

## 📞 Key Contacts & Resources

### Documentation
- React Native: https://reactnative.dev
- Supabase: https://supabase.com/docs
- Zustand: https://docs.pmnd.rs/zustand

### Tools
- Android Studio: https://developer.android.com/studio
- VS Code: https://code.visualstudio.com
- Postman: https://www.postman.com

### Libraries to Consider
- Navigation: `@react-navigation/native`
- Forms: `react-hook-form`
- Date handling: `date-fns`
- Charts: `react-native-chart-kit`
- Maps: `react-native-maps`

---

## ✨ Current Status Summary

**Completed:** Stage 1 (100%), Stage 2 (75%)
**In Progress:** Stage 2 (Schemes tab, Document downloads)
**Next Up:** Stage 3 (GPS, Camera, Grievances)

**Last Updated:** February 12, 2026
**Version:** 0.0.1 (Development)

---

**Good luck with the implementation! 🚀**

Remember to:
1. Test frequently
2. Commit often
3. Document changes
4. Ask for help when needed
