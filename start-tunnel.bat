@echo off
echo ========================================
echo Crisis Cred - Starting with Localtunnel
echo ========================================
echo.
echo This will start your server and create a public URL
echo for WhatsApp Cloud API to send webhooks.
echo.
echo Press Ctrl+C to stop the server and tunnel.
echo.
echo ========================================
echo.

cd /d "%~dp0"
npm run tunnel:localtunnel
