@echo off
echo Building Japan Earthquake Viewer...
call mvn clean package
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo Build successful!
echo Running application...
java -jar target/japan-earthquake-viewer-1.0-SNAPSHOT.jar
pause