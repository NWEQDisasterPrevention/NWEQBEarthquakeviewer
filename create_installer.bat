@echo off
echo Building Japan Earthquake Viewer...
call mvn clean package
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo Creating installer...
mkdir target\installer 2>nul

REM Check if Inno Setup is installed
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" (
    "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" installer\setup.iss
) else if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" (
    "%ProgramFiles%\Inno Setup 6\ISCC.exe" installer\setup.iss
) else (
    echo Inno Setup not found. Please install Inno Setup 6 to create the installer.
    echo You can download it from: https://jrsoftware.org/isdl.php
    pause
    exit /b 1
)

echo Installer created successfully in target\installer directory!
pause