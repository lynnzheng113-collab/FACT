@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel%==0 goto open
start "FACT prototype server" cmd /k "npm.cmd run dev -- --host 127.0.0.1"
timeout /t 2 /nobreak >nul
:open
start "" "http://127.0.0.1:5173/"
endlocal
