@echo off
rem node main.js

:start
if "%~1"=="" goto blank
node "%~1"
goto end

:blank
node main.js
goto end

:end
pause
cls
goto start