@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Creating Kintsungi virtual environment...
    where py >nul 2>nul
    if errorlevel 1 (
        echo Python launcher ^(py^) was not found. Install Python 3.10+ and try again.
        pause
        exit /b 1
    )
    py -3 -m venv .venv
    if errorlevel 1 (
        echo Could not create the virtual environment.
        pause
        exit /b 1
    )
)

echo Installing Kintsungi dependencies...
".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -e ".\packages\markitdown[all]" flask
if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
)

echo Starting Kintsungi at http://127.0.0.1:5000
start "" /b "%ComSpec%" /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5000"
".venv\Scripts\python.exe" "kintsungi_server.py"

endlocal