# Fixing JDK Version Issue - FIDO-Miti Mobile App

## Problem
```
FAILURE: Build failed with an exception.
* What went wrong:
Gradle requires JVM 17 or later to run. Your build is currently configured to use JVM 11.
```

## Solution Options

### Option 1: Install JDK 17 (Recommended)

#### Step 1: Download JDK 17
1. Visit: https://adoptium.net/temurin/releases/
2. Select:
   - **Version**: 17 (LTS)
   - **Operating System**: Windows
   - **Architecture**: x64
3. Download the `.msi` installer

#### Step 2: Install JDK 17
1. Run the downloaded installer
2. Follow installation wizard
3. **Important**: Check "Set JAVA_HOME variable" during installation

#### Step 3: Verify Installation
```bash
java -version
# Should show: openjdk version "17.x.x"
```

#### Step 4: Set JAVA_HOME (if not set automatically)
```powershell
# In PowerShell (Run as Administrator)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'Machine')

# Restart your terminal/IDE after this
```

#### Step 5: Verify JAVA_HOME
```powershell
echo $env:JAVA_HOME
# Should show: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
```

---

### Option 2: Use Gradle's Java Toolchain (Quick Fix)

If you can't install JDK 17 right now, you can configure Gradle to download it automatically.

#### Update `android/gradle.properties`
Add this line:
```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.x-hotspot
```

---

### Option 3: Configure Android Studio to Use JDK 17

If you have Android Studio installed:

1. Open Android Studio
2. Go to **File** → **Settings** (or **Ctrl+Alt+S**)
3. Navigate to **Build, Execution, Deployment** → **Build Tools** → **Gradle**
4. Under **Gradle JDK**, select **Download JDK 17**
5. Click **Apply** and **OK**

---

## After Installing JDK 17

### Clean and Rebuild
```bash
cd FIDOMitiApp/android
./gradlew clean
cd ..
npm run android
```

### If Still Having Issues
```bash
# Clear Gradle cache
cd android
./gradlew clean --no-daemon
cd ..

# Clear Metro cache
npm start -- --reset-cache

# In another terminal
npm run android
```

---

## Verification Checklist

- [ ] JDK 17 installed
- [ ] `java -version` shows version 17.x.x
- [ ] `JAVA_HOME` environment variable set
- [ ] Terminal/IDE restarted
- [ ] Gradle clean executed
- [ ] App builds successfully

---

## Quick Commands Reference

```bash
# Check Java version
java -version

# Check JAVA_HOME
echo $env:JAVA_HOME

# Clean Gradle
cd android
./gradlew clean
cd ..

# Run app
npm run android
```

---

## Alternative: Use JDK 11 with Older Gradle (Not Recommended)

If you absolutely cannot upgrade to JDK 17, you would need to downgrade Gradle and React Native versions, which is not recommended as you'd lose features and security updates.

---

## Expected Output After Fix

```bash
> npm run android

info Launching emulator...
info Successfully launched emulator.
info Installing the app...

> Task :app:installDebug
Installing APK 'app-debug.apk' on 'Pixel_5_API_33(AVD)' for :app:debug
Installed on 1 device.

BUILD SUCCESSFUL in 45s
```

---

## Need Help?

If you encounter other issues after fixing the JDK version:
1. Check `TROUBLESHOOTING.md` (if exists)
2. Review `QUICK_START.md`
3. Check React Native docs: https://reactnative.dev/docs/environment-setup

---

**Once JDK 17 is installed and configured, the app should build successfully!** 🚀
