@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Backend Python environment is missing. See .doc\MOBILE-AUTH-LOCAL-SETUP.md.
  exit /b 1
)

if not exist ".env" (
  echo Backend .env is missing. Configure it using .env.example first.
  exit /b 1
)

".venv\Scripts\python.exe" run.py
exit /b %errorlevel%
