#!/bin/bash

# ============================================================================
# SECURE ADMIN DEPLOYMENT SCRIPT
# ============================================================================

echo "🔒 Starting secure admin setup..."
echo ""

# Проверка Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Проверка логина
echo "📝 Checking Supabase login..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Деплой Edge Functions
echo "🚀 Deploying Edge Functions..."
echo ""

echo "Deploying admin-auth..."
supabase functions deploy admin-auth --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ admin-auth deployed successfully"
else
    echo "❌ Failed to deploy admin-auth"
    exit 1
fi

echo ""
echo "Deploying admin-validate..."
supabase functions deploy admin-validate --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ admin-validate deployed successfully"
else
    echo "❌ Failed to deploy admin-validate"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Go to Supabase Dashboard → SQL Editor"
echo "2. Run the setup-secure-admin.sql script"
echo "3. Test the authentication at /admin"
echo ""
echo "Monitoring:"
echo "- View logs: supabase functions logs admin-auth --tail"
echo "- View attempts: SELECT * FROM admin_login_attempts;"
echo "- View sessions: SELECT * FROM admin_sessions;"
echo ""
