@echo off
setlocal
title Unsaid Desktop Launcher

echo ========================================================
echo   Launching Unsaid Desktop Shell...
echo   A private place for the things you don't know how to say out loud.
echo ========================================================

cd /d "%~dp0"

:: Check if server is running on port 5173
curl -s http://localhost:5173/ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Unsaid server is already running.
    goto launch_app
)

echo [INFO] Starting Unsaid local server in the background...
start /min cmd /c "npm run dev"

:: Wait up to 10 seconds for server to be responsive
echo [INFO] Waiting for local server to initialize...
for /l %%i in (1, 1, 10) do (
    timeout /t 1 /nobreak >nul
    curl -s http://localhost:5173/ >nul 2>&1
    if !ERRORLEVEL! EQU 0 goto launch_app
)

:launch_app
echo [INFO] Launching standalone desktop window...

:: Attempt to open in Microsoft Edge App Mode
start "" msedge.exe --app="http://localhost:5173" --window-size="1140,840" --app-id="unsaid-desktop" 2>nul
if %ERRORLEVEL% EQU 0 goto done

:: Fallback to Chrome App Mode
start "" chrome.exe --app="http://localhost:5173" --window-size="1140,840" --app-id="unsaid-desktop" 2>nul
if %ERRORLEVEL% EQU 0 goto done

:: Default fallback to default browser
start "" "http://localhost:5173"

:done
echo [SUCCESS] Unsaid Desktop Shell launched!
endlocal
exit /b 0
