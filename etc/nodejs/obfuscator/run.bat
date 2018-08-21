@echo off
rem node main.js
if "%~1"=="" goto blank
node "%~1"
goto end
:blank
node main.js
:end
pause