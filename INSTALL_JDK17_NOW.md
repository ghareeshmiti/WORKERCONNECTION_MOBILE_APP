# URGENT: Install JDK 17 - Step by Step Guide

## The Problem
Your system has JDK 11, but React Native 0.84.0 requires JDK 17 or later.
**The app CANNOT run until this is fixed.**

---

## FASTEST Solution: Download & Install JDK 17

### Step 1: Download JDK 17 (5 minutes)

**Option A: Eclipse Temurin (Recommended)**
1. Open browser: https://adoptium.net/temurin/releases/
2. Select:
   - Version: **17 - LTS**
   - Operating System: **Windows**
   - Architecture: **x64**
   - Package Type: **JDK**
3. Click **Download .msi** (around 160 MB)

**Option B: Oracle JDK**
1. Open browser: https://www.oracle.com/java/technologies/downloads/#java17
2. Download: **Windows x64 Installer** (jdk-17_windows-x64_bin.exe)

**Option C: Microsoft OpenJDK**
1. Open browser: https://learn.microsoft.com/en-us/java/openjdk/download
2. Download: **Microsoft Build of OpenJDK 17**

---

### Step 2: Install JDK 17 (2 minutes)

1. **Run the installer** you just downloaded
2. **IMPORTANT**: During installation, check these options:
   - ✅ **Set JAVA_HOME variable**
   - ✅ **Add to PATH**
   - ✅ **JavaSoft (Oracle) registry keys** (if available)
3. Click **Next** → **Install** → **Finish**

---

### Step 3: Verify Installation (1 minute)

**Close ALL terminals and IDE windows, then open a NEW PowerShell:**

```powershell
# Check Java version
java -version
# Should show: openjdk version "17.x.x"

# Check JAVA_HOME
echo $env:JAVA_HOME
# Should show: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
# (or similar path)
```

**If java -version still shows 11:**
```powershell
# Manually set JAVA_HOME (Run PowerShell as Administrator)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.12-hotspot', 'Machine')

# Add to PATH
$oldPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = "$env:JAVA_HOME\bin;$oldPath"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')

# RESTART PowerShell after this
```

---

### Step 4: Build the App (2 minutes)

**In a NEW PowerShell window:**

```powershell
cd "C:\Hareesh\FIDO-Miti new\FIDO-Miti\FIDOMitiApp"

# Clean previous build
cd android
./gradlew clean
cd ..

# Run the app
npm run android
```

---

## Alternative: Use Android Studio's JDK

If you have Android Studio installed:

1. Open **Android Studio**
2. Go to **File** → **Settings** (Ctrl+Alt+S)
3. Navigate to: **Build, Execution, Deployment** → **Build Tools** → **Gradle**
4. Under **Gradle JDK**: 
   - If JDK 17 is listed, select it
   - If not, click **Download JDK** → Select **Version 17** → **Download**
5. Click **Apply** → **OK**
6. Close Android Studio
7. Try running `npm run android` again

---

## Troubleshooting

### "java -version still shows 11"
- **Solution**: Restart your computer (this ensures environment variables are loaded)

### "JAVA_HOME not set"
```powershell
# Run as Administrator
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.12-hotspot', 'Machine')
```

### "Multiple Java versions installed"
- **Solution**: Make sure JDK 17 is first in your PATH
- Or uninstall JDK 11 if not needed

---

## Expected Success Output

After installing JDK 17, you should see:

```bash
> npm run android

info Installing the app...

> Task :app:installDebug
Installing APK 'app-debug.apk' on 'Pixel_5_API_33(AVD)'
Installed on 1 device.

BUILD SUCCESSFUL in 45s
```

---

## Quick Reference

| Step | Command | Expected Output |
|------|---------|-----------------|
| Check Java | `java -version` | `openjdk version "17.x.x"` |
| Check JAVA_HOME | `echo $env:JAVA_HOME` | Path to JDK 17 |
| Clean build | `cd android && ./gradlew clean` | `BUILD SUCCESSFUL` |
| Run app | `npm run android` | App launches on emulator |

---

## Download Links (Copy-Paste Ready)

- **Temurin JDK 17**: https://adoptium.net/temurin/releases/
- **Oracle JDK 17**: https://www.oracle.com/java/technologies/downloads/#java17
- **Microsoft OpenJDK 17**: https://learn.microsoft.com/en-us/java/openjdk/download

---

## ⏱️ Time Estimate

- Download: 3-5 minutes
- Install: 2 minutes
- Configure: 1 minute
- Build app: 2-3 minutes
- **Total: ~10 minutes**

---

## 🎯 Bottom Line

**You MUST install JDK 17 to proceed.** There's no workaround - React Native 0.84.0 requires it.

Once installed, the app will build successfully! 🚀

---

**Need help?** Open `FIX_JDK_VERSION.md` for more detailed troubleshooting.
