@echo off
REM ============================================================================
REM SECURE ADMIN DEPLOYMENT SCRIPT (Windows)
REM ============================================================================

echo.
echo 🔒 Starting secure admin setup...
echo.

REM Проверка Supabase CLI
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found!
    echo Install it with: npm install -g supabase
    exit /b 1
)

echo ✅ Supabase CLI found
echo.

REM Проверка логина
echo 📝 Checking Supabase login...
supabase projects list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Not logged in to Supabase
    echo Run: supabase login
    exit /b 1
)

echo ✅ Logged in to Supabase
echo.

REM Деплой Edge Functions
echo 🚀 Deploying Edge Functions...
echo.

echo Deploying admin-auth...
supabase functions deploy admin-auth --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo ✅ admin-auth deployed successfully
) else (
    echo ❌ Failed to deploy admin-auth
    exit /b 1
)

echo.
echo Deploying admin-validate...
supabase functions deploy admin-validate --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo ✅ admin-validate deployed successfully
) else (
    echo ❌ Failed to deploy admin-validate
    exit /b 1
)

echo.
echo 🎉 Deployment completed successfully!
echo.
echo Next steps:
echo 1. Go to Supabase Dashboard → SQL Editor
echo 2. Run the setup-secure-admin.sql script
echo 3. Test the authentication at /admin
echo.
echo Monitoring:
echo - View logs: supabase functions logs admin-auth --tail
echo - View attempts: SELECT * FROM admin_login_attempts;
echo - View sessions: SELECT * FROM admin_sessions;
echo.

pause
