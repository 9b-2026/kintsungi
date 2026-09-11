@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo MarkItDown virtual environment not found.
    echo Run the setup commands in web\README.md first.
    pause
    exit /b 1
)

echo Starting MarkItDown Studio at http://127.0.0.1:5000
start "" /b "%ComSpec%" /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5000"
".venv\Scripts\python.exe" "web\app.py"

endlocal