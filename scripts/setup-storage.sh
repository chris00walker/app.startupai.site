#!/bin/bash

# Storage Buckets Setup Script
# Configures Supabase storage buckets for StartupAI platform

set -e

echo "🪣 Setting up Supabase Storage Buckets..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with:"
    echo "   pnpm install --save-dev supabase"
    exit 1
fi

# Check if in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: supabase/config.toml not found"
    echo "   Run this script from the app.startupai.site root directory"
    exit 1
fi

echo ""
echo "📋 This script will create 4 storage buckets:"
echo "   1. user-uploads      (private, 50MB limit)"
echo "   2. generated-reports (private, 100MB limit)"
echo "   3. project-assets    (private, 50MB limit)"
echo "   4. public-assets     (public, 10MB limit)"
echo ""

# Apply the migration
echo "🔄 Applying storage bucket migration..."
cd supabase
supabase db push

echo ""
echo "✅ Storage buckets configured successfully!"
echo ""
echo "📊 Bucket Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. user-uploads"
echo "   Purpose: User-uploaded evidence files"
echo "   Access: Private, user-scoped"
echo "   Format: {userId}/filename"
echo "   Size Limit: 50MB"
echo "   Types: Images, PDFs, CSV, Excel"
echo ""
echo "2. generated-reports"
echo "   Purpose: AI-generated business reports"
echo "   Access: Private, user-scoped"
echo "   Format: {userId}/{reportId}.pdf"
echo "   Size Limit: 100MB"
echo "   Types: PDF, JSON, Markdown, DOCX"
echo ""
echo "3. project-assets"
echo "   Purpose: Project-specific files"
echo "   Access: Private, project-scoped"
echo "   Format: {userId}/{projectId}/filename"
echo "   Size Limit: 50MB"
echo "   Types: Images, PDFs, SVG"
echo ""
echo "4. public-assets"
echo "   Purpose: Public platform assets"
echo "   Access: Public read, authenticated write"
echo "   Format: {userId}/filename"
echo "   Size Limit: 10MB"
echo "   Types: Images only"
echo ""
echo "🔐 All buckets have Row Level Security (RLS) enabled"
echo "📝 See supabase/migrations/00003_storage_buckets.sql for details"
echo ""
