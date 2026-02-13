# Set JAVA_HOME to JDK 17
# Run this script as Administrator

# Find JDK 17 installation
$jdk17Paths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17.0.18+8-hotspot",
    "C:\Program Files\Eclipse Adoptium\jdk-17.0.18-hotspot",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\OpenJDK\jdk-17",
    "C:\Program Files\Microsoft\jdk-17"
)

$jdk17Path = $null
foreach ($path in $jdk17Paths) {
    if (Test-Path $path) {
        $jdk17Path = $path
        break
    }
}

if ($null -eq $jdk17Path) {
    Write-Host "❌ JDK 17 not found in common locations!" -ForegroundColor Red
    Write-Host "Please check where JDK 17 is installed and update this script." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common locations:" -ForegroundColor Cyan
    $jdk17Paths | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

Write-Host "✅ Found JDK 17 at: $jdk17Path" -ForegroundColor Green

# Set JAVA_HOME
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $jdk17Path, 'Machine')
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $jdk17Path, 'User')

# Update PATH
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')

# Remove old JDK paths
$machinePath = ($machinePath -split ';' | Where-Object { $_ -notlike '*jdk-11*' }) -join ';'
$userPath = ($userPath -split ';' | Where-Object { $_ -notlike '*jdk-11*' }) -join ';'

# Add JDK 17 to PATH if not already there
if ($machinePath -notlike "*$jdk17Path\bin*") {
    $machinePath = "$jdk17Path\bin;$machinePath"
}

[System.Environment]::SetEnvironmentVariable('Path', $machinePath, 'Machine')

Write-Host ""
Write-Host "✅ JAVA_HOME set to: $jdk17Path" -ForegroundColor Green
Write-Host "✅ PATH updated" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Close ALL PowerShell windows and open a NEW one!" -ForegroundColor Yellow
Write-Host "Then verify with: java -version" -ForegroundColor Cyan
