chcp 866 >nul 2>nul
:start
cls
rem gcc simple.c -o run.exe
gcc shell.c -o debug.exe
pause
goto start
