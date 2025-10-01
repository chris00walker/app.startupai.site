#!/bin/bash
# Supabase CLI Setup Script for StartupAI
# This script automates the Supabase project setup process

set -e  # Exit on error

echo "🚀 StartupAI Supabase Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if logged in
echo -e "${BLUE}Step 1: Checking authentication...${NC}"
if ! pnpm exec supabase projects list > /dev/null 2>&1; then
    echo -e "${YELLOW}Not logged in. Opening browser for authentication...${NC}"
    pnpm exec supabase login
    echo -e "${GREEN}✓ Logged in successfully${NC}"
else
    echo -e "${GREEN}✓ Already logged in${NC}"
fi

echo ""

# Step 2: Check for existing "StartupAI" project
echo -e "${BLUE}Step 2: Checking for existing 'StartupAI' project...${NC}"

# Get projects in table format and extract StartupAI reference
PROJECT_REF=$(pnpm exec supabase projects list 2>/dev/null | grep "StartupAI" | awk '{print $4}')
REGION=$(pnpm exec supabase projects list 2>/dev/null | grep "StartupAI" | awk '{print $5, $6, $7}' | sed 's/ *$//')

if [ ! -z "$PROJECT_REF" ]; then
    echo -e "${GREEN}✓ Found existing 'StartupAI' project!${NC}"
    echo -e "${GREEN}  Project Reference: ${PROJECT_REF}${NC}"
    echo -e "${GREEN}  Region: ${REGION}${NC}"
    PROJECT_NAME="StartupAI"
    
    # Ask for database password
    echo ""
    echo -e "${YELLOW}Enter the database password for your StartupAI project:${NC}"
    read -s DB_PASSWORD
    echo ""
    
    # Skip project creation, go to linking
    CREATE_NEW=false
else
    echo -e "${YELLOW}StartupAI project not found.${NC}"
    echo ""
    
    # Show all projects
    echo "Existing projects:"
    pnpm exec supabase projects list
    
    echo ""
    read -p "Do you want to create a new project? (y/n): " CREATE_NEW

    if [[ $CREATE_NEW != "y" ]]; then
        echo "Setup cancelled. If you want to link an existing project, use:"
        echo "  pnpm exec supabase link --project-ref YOUR_PROJECT_REF"
        exit 0
    fi

    echo ""

    # Step 3: Get organization ID
    echo -e "${BLUE}Step 3: Getting organization ID...${NC}"
    pnpm exec supabase orgs list

    echo ""
    read -p "Enter your Organization ID from above: " ORG_ID

    # Step 4: Project configuration
    echo ""
    echo -e "${BLUE}Step 4: Project configuration${NC}"
    read -p "Enter project name (e.g., startupai-production): " PROJECT_NAME
    read -p "Enter region (e.g., us-east-1): " REGION

    # Generate a strong password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo -e "${YELLOW}Generated database password: ${DB_PASSWORD}${NC}"
    echo -e "${YELLOW}⚠️  Save this password in your password manager NOW!${NC}"
    read -p "Press Enter when you've saved the password..."

    echo ""

    # Step 5: Create project
    echo -e "${BLUE}Step 5: Creating Supabase project...${NC}"
    echo "This may take 2-3 minutes..."

    pnpm exec supabase projects create "$PROJECT_NAME" \
      --org-id "$ORG_ID" \
      --db-password "$DB_PASSWORD" \
      --region "$REGION" \
      --output json > /tmp/supabase-project.json

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Project created successfully!${NC}"
        
        # Extract project details
        PROJECT_REF=$(cat /tmp/supabase-project.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo ""
        echo -e "${GREEN}Project Reference: ${PROJECT_REF}${NC}"
        
        # Wait for project to be ready
        echo ""
        echo -e "${BLUE}Step 6: Waiting for project to be ready...${NC}"
        sleep 30  # Give it time to initialize
        
    else
        echo -e "${YELLOW}❌ Failed to create project${NC}"
        exit 1
    fi
fi

# Step 7: Link project locally
echo ""
echo -e "${BLUE}Step 7: Linking project to local directory...${NC}"
echo "You will be prompted for your database password..."
SUPABASE_DB_PASSWORD="$DB_PASSWORD" pnpm exec supabase link --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Project linked successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Manual linking required. Run:${NC}"
    echo "  pnpm exec supabase link --project-ref $PROJECT_REF"
fi

# Step 8: Initialize local config
echo ""
echo -e "${BLUE}Step 8: Initializing local Supabase config...${NC}"
if [ ! -d "supabase" ]; then
    pnpm exec supabase init
    echo -e "${GREEN}✓ Supabase config initialized${NC}"
else
    echo -e "${YELLOW}Supabase directory already exists, skipping init${NC}"
fi

# Step 9: Enable PostgreSQL Extensions
echo ""
echo -e "${BLUE}Step 9: Enabling PostgreSQL extensions...${NC}"
echo "Enabling: vector (pgvector), uuid-ossp, pg_net, hstore"

# Note: Extension name is 'vector' not 'pgvector'
pnpm exec supabase db execute --project-ref "$PROJECT_REF" \
  --sql "CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;" || echo "Warning: vector extension may need manual enable"

pnpm exec supabase db execute --project-ref "$PROJECT_REF" \
  --sql "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" WITH SCHEMA extensions;" || echo "Warning: uuid-ossp may need manual enable"

pnpm exec supabase db execute --project-ref "$PROJECT_REF" \
  --sql "CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;" || echo "Warning: pg_net may need manual enable"

pnpm exec supabase db execute --project-ref "$PROJECT_REF" \
  --sql "CREATE EXTENSION IF NOT EXISTS hstore WITH SCHEMA extensions;" || echo "Warning: hstore may need manual enable"

echo -e "${GREEN}✓ Extensions enabled${NC}"

# Step 10: Get API keys
echo ""
echo -e "${BLUE}Step 10: Fetching API keys...${NC}"
pnpm exec supabase projects api-keys --project-ref "$PROJECT_REF" > /tmp/supabase-keys.txt
cat /tmp/supabase-keys.txt

# Extract keys from output
ANON_KEY=$(grep "anon" /tmp/supabase-keys.txt | awk '{print $NF}')
SERVICE_KEY=$(grep "service_role" /tmp/supabase-keys.txt | awk '{print $NF}')

# Step 11: Create .env file
echo ""
echo -e "${BLUE}Step 11: Creating environment files...${NC}"

# Backend .env
cat > backend/.env << EOF
# ===============================================
# StartupAI Backend Environment - AUTO-GENERATED
# ===============================================
# Generated: $(date)
# Project: $PROJECT_NAME
# Reference: $PROJECT_REF

# LLM API KEYS (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GOOGLE_API_KEY=your-google-ai-key-here

# CREWAI CONFIGURATION
CREWAI_TELEMETRY_OPT_OUT=true

# SUPABASE CONFIGURATION
SUPABASE_URL=https://${PROJECT_REF}.supabase.co
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}

# DATABASE CONFIGURATION
DATABASE_URL=postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres

# API CONFIGURATION
API_HOST=0.0.0.0
API_PORT=8000

# ENVIRONMENT
ENVIRONMENT=development
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓ Created backend/.env${NC}"

# Frontend .env.local
cat > frontend/.env.local << EOF
# StartupAI Frontend Environment - AUTO-GENERATED
# Generated: $(date)

NEXT_PUBLIC_SUPABASE_URL=https://${PROJECT_REF}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
DATABASE_URL=postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true
EOF

echo -e "${GREEN}✓ Created frontend/.env.local${NC}"

# Step 12: Verify extensions
echo ""
echo -e "${BLUE}Step 12: Verifying extensions...${NC}"
pnpm exec supabase db execute --project-ref "$PROJECT_REF" \
  --sql "SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp', 'pg_net', 'hstore');"

# Step 13: Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Supabase Setup Complete!${NC}"
echo "================================"
echo ""
echo "📋 Summary:"
echo "  Project Name: $PROJECT_NAME"
echo "  Project Ref:  $PROJECT_REF"
echo "  Region:       $REGION"
echo "  Dashboard:    https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""
echo "🔑 Credentials (SAVE THESE):"
echo "  Database Password: $DB_PASSWORD"
echo "  Project URL:       https://${PROJECT_REF}.supabase.co"
echo ""
echo "📁 Files Created:"
echo "  ✓ backend/.env"
echo "  ✓ frontend/.env.local"
echo "  ✓ supabase/config.toml"
echo ""
echo "⚠️  IMPORTANT:"
echo "  1. Save database password in your password manager"
echo "  2. Add your OpenAI API key to backend/.env"
echo "  3. Never commit .env files to Git"
echo ""
echo "🎯 Next Steps:"
echo "  1. Enable PostgreSQL extensions (see docs)"
echo "  2. Run: pnpm exec supabase db remote commit (to pull schema)"
echo "  3. Proceed to Drizzle ORM setup"
echo ""
echo "📖 Documentation:"
echo "  Local: docs/engineering/30-data/supabase-setup.md"
echo "  Remote: https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""

# Cleanup
rm -f /tmp/supabase-project.json /tmp/supabase-keys.txt

echo -e "${GREEN}Setup script completed! 🎉${NC}"
