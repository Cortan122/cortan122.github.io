@echo off
chcp 65001 >nul 2>nul
where node >nul 2>nul
if %errorlevel%==0 (
  rem echo %errorlevel% 
) else (
  echo you need to install node
  goto exit
)
where gcc >nul 2>nul
if %errorlevel%==0 (
  rem echo %errorlevel% 
) else (
  echo you need to install gcc
  goto exit
)
where strip >nul 2>nul
if %errorlevel%==0 (
  rem echo %errorlevel% 
) else (
  echo you need to install strip
  goto exit
)
node passwder.js
:exit
pause
