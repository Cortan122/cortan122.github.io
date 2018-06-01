@echo off
where node >nul 2>nul
if %errorlevel%==0 (
  echo you have node installed +
) else (
  echo you need to install node -
  rem goto exit
)
where gcc >nul 2>nul
if %errorlevel%==0 (
  echo you have gcc installed +
) else (
  echo you need to install gcc -
  rem goto exit
)
where strip >nul 2>nul
if %errorlevel%==0 (
  echo you have strip installed +
) else (
  echo you need to install strip -
  rem goto exit
)
where python >nul 2>nul
if %errorlevel%==0 (
  echo you have python installed +
) else (
  echo you need to install python -
  rem goto exit
)
where pip >nul 2>nul
if %errorlevel%==0 (
  echo you have pip installed +
  pip list | findstr r2pipe >nul 2>nul
  if %errorlevel%==0 (
    echo you have r2pipe installed +
  ) else (
    echo you need to pip install r2pipe -
    rem goto exit
  )
) else (
  echo you need to install pip -
  rem goto exit
)
rem :exit
