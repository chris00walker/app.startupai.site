#!/bin/bash
# Production Deployment Script for Trial Guardrails
# Run this script to complete all deployment steps

set -e  # Exit on error

echo "🚀 Starting Production Deployment for Trial Guardrails"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verify Database Function
echo -e "${BLUE}Step 1: Verifying Database Function${NC}"
echo "Please run this SQL in Supabase SQL Editor:"
echo ""
echo -e "${YELLOW}SELECT proname FROM pg_proc WHERE proname = 'set_updated_at_timestamp';${NC}"
echo ""
echo "Expected: Should return 1 row"
echo "If missing, the function is defined in: supabase/migrations/00005_user_roles_and_plans.sql"
echo ""
read -p "Press Enter when you've verified the function exists..."
echo -e "${GREEN}✓ Function verified${NC}"
echo ""

# Step 2: Configure Netlify Environment Variables
echo -e "${BLUE}Step 2: Configure Netlify Environment Variables${NC}"
echo "Go to: https://app.netlify.com/sites/app-startupai-site/settings/env"
echo ""
echo "Add these 5 variables (get values from .env.local):"
echo ""
echo "1. NEXT_PUBLIC_SUPABASE_URL"
echo "2. NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "3. SUPABASE_SERVICE_ROLE_KEY (SECRET - never expose to client)"
echo "4. NEXT_PUBLIC_SITE_URL = https://app-startupai-site.netlify.app"
echo "5. DATABASE_URL"
echo ""
read -p "Press Enter when you've configured all 5 variables..."
echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Step 3: Apply Database Migration
echo -e "${BLUE}Step 3: Apply Database Migration${NC}"
echo "Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql"
echo ""
echo "Copy and paste the contents of:"
echo "  supabase/migrations/00007_trial_usage_counters.sql"
echo ""
echo "Then run this verification query:"
echo -e "${YELLOW}SELECT * FROM trial_usage_counters LIMIT 1;${NC}"
echo ""
read -p "Press Enter when migration is applied..."
echo -e "${GREEN}✓ Migration applied${NC}"
echo ""

# Step 4: Deploy to Netlify (already done via git push)
echo -e "${BLUE}Step 4: Deploy to Netlify${NC}"
echo "Code has already been pushed to GitHub (commits 4ad8716 and 039c152)"
echo "Netlify should be auto-deploying now..."
echo ""
echo "Monitor deployment at:"
echo "  https://app.netlify.com/sites/app-startupai-site/deploys"
echo ""
read -p "Press Enter when Netlify deployment is complete..."
echo -e "${GREEN}✓ Deployment complete${NC}"
echo ""

# Step 5: Verify Deployment
echo -e "${BLUE}Step 5: Verify Deployment${NC}"
echo ""

echo "A. Test API Endpoint:"
echo -e "${YELLOW}curl -X POST https://app-startupai-site.netlify.app/api/trial/allow \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"action\":\"projects.create\"}'${NC}"
echo ""
echo "Expected: {\"allowed\":true,\"remaining\":2} (or similar)"
echo ""

echo "B. Check Database Table (in Supabase SQL Editor):"
echo -e "${YELLOW}SELECT * FROM trial_usage_counters ORDER BY created_at DESC LIMIT 5;${NC}"
echo ""

echo "C. Verify RLS Policies (in Supabase SQL Editor):"
echo -e "${YELLOW}SELECT * FROM trial_usage_counters WHERE user_id = auth.uid();${NC}"
echo ""

read -p "Press Enter when you've verified all checks..."
echo -e "${GREEN}✓ Verification complete${NC}"
echo ""

# Success Summary
echo ""
echo "======================================================"
echo -e "${GREEN}🎉 Production Deployment Complete!${NC}"
echo "======================================================"
echo ""
echo "✅ Database function verified"
echo "✅ Netlify environment variables configured"
echo "✅ Database migration applied"
echo "✅ Code deployed to production"
echo "✅ Deployment verified"
echo ""
echo "Trial guardrails are now live in production! 🚀"
echo ""
echo "Next steps:"
echo "  - Monitor error logs for 24 hours"
echo "  - Test trial user experience"
echo "  - Document any issues in docs/operations/implementation-status.md"
echo ""
