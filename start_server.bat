@echo off
cd /d D:\File\Dev\VScode\ChatBuff
D:\File\Dev\VScode\ChatBuff\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
