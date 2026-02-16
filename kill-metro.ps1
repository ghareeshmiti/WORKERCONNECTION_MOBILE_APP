# Kill Metro Bundler Processes
# Run this script to stop all Metro bundler instances

Write-Host "Stopping Metro bundler processes..." -ForegroundColor Cyan

# Find processes on port 8081
$port8081 = netstat -ano | findstr :8081
if ($port8081) {
    Write-Host "Found process on port 8081" -ForegroundColor Yellow
    $pid8081 = ($port8081 -split '\s+')[-1]
    if ($pid8081) {
        taskkill /PID $pid8081 /F
        Write-Host "✓ Killed process on port 8081 (PID: $pid8081)" -ForegroundColor Green
    }
}
else {
    Write-Host "✓ Port 8081 is already free" -ForegroundColor Green
}

# Find processes on port 8082
$port8082 = netstat -ano | findstr :8082
if ($port8082) {
    Write-Host "Found process on port 8082" -ForegroundColor Yellow
    $pid8082 = ($port8082 -split '\s+')[-1]
    if ($pid8082) {
        taskkill /PID $pid8082 /F
        Write-Host "✓ Killed process on port 8082 (PID: $pid8082)" -ForegroundColor Green
    }
}
else {
    Write-Host "✓ Port 8082 is already free" -ForegroundColor Green
}

Write-Host ""
Write-Host "All Metro bundler processes stopped!" -ForegroundColor Green
Write-Host "You can now run: npm start" -ForegroundColor Cyan
