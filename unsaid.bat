@echo off
setlocal
cd /d "%~dp0"
node bin/unsaid.js %*
endlocal
