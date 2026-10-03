# Unsaid Desktop Shell Runner (PowerShell)
$ErrorActionPreference = "SilentlyContinue"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching Unsaid Desktop Shell..." -ForegroundColor White
Write-Host "  A private place for the things you don't know how to say out loud." -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Cyan

$serverRunning = $false
try {
    $res = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 1
    if ($res.StatusCode -eq 200) { $serverRunning = $true }
} catch {}

if (-not $serverRunning) {
    Write-Host "[INFO] Starting local server in background..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# Launch standalone window using Edge or Chrome App Mode
$edgePath = "msedge.exe"
$chromePath = "chrome.exe"
$appUrl = "http://localhost:5173"
$windowArgs = "--app=$appUrl --window-size=1140,840 --app-id=unsaid-desktop"

$launched = $false
try {
    Start-Process -FilePath $edgePath -ArgumentList $windowArgs -ErrorAction Stop
    $launched = $true
} catch {
    try {
        Start-Process -FilePath $chromePath -ArgumentList $windowArgs -ErrorAction Stop
        $launched = $true
    } catch {
        Start-Process $appUrl
        $launched = $true
    }
}

if ($launched) {
    Write-Host "[SUCCESS] Unsaid Desktop Shell launched." -ForegroundColor Green
}
