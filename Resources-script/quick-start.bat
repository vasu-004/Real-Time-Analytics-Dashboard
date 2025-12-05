@echo off
REM ============================================================================
REM Quick Start Script for Real-Time Analytics Dashboard (Windows)
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║        Real-Time Analytics Dashboard                           ║
echo ║        Quick Start (Demo Mode)                                 ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo ✅ Python detected
echo.

REM Start dashboard
cd dashboard

echo Starting dashboard server...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Dashboard will open at: http://localhost:8080
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Running in DEMO MODE (simulated data)
echo To use real AWS data, see docs/SETUP.md
echo.
echo Press Ctrl+C to stop the server
echo.

REM Open browser (wait 2 seconds for server to start)
start "" http://localhost:8080
timeout /t 2 /nobreak >nul

REM Start Python HTTP server
python -m http.server 8080
