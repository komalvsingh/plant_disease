@echo off
echo Starting all Python applications...

:: Start your Python scripts
start cmd /k python chat.py
start cmd /k python climate.py
start cmd /k python market.py
:: Add more scripts as needed

echo All applications have been started in separate windows.
echo Close this window when you want to stop all applications.
echo (Note: You'll need to manually close each application window)