# Supabase Setup & Configuration

**Component:** Database Infrastructure  
**Owner:** Engineering  
**Status:** ✅ Complete  
**Last Updated:** October 1, 2025

---

## Overview

This guide covers the complete Supabase setup for StartupAI's two-site architecture. Supabase provides our PostgreSQL database, authentication, storage, and vector search capabilities.

**Project Details:**
- **Name:** StartupAI
- **Reference ID:** `eqxropalhxjeyvfcoyxg`
- **Region:** East US (North Virginia)
- **Dashboard:** https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg
- **Created:** September 29, 2025

**Related Documentation:**
- [Architecture Specification](../../../../startupai.site/docs/technical/high_level_architectural_spec.md#9-database-architecture)
- [Implementation Plan](../../../../startupai.site/docs/technical/two-site-implementation-plan.md#21-supabase-setup--configuration)

---

## Quick Start (30 minutes)

### Prerequisites
- GitHub account
- OpenAI API key (for embeddings)
- Password manager for storing credentials

### Setup Steps

#### 1. Create Project (5 minutes)
1. Go to https://supabase.com/dashboard
2. Sign in with GitHub
3. Click **"New Project"**
4. Configure:
   - **Name:** `startupai-production` (or `startupai-dev`)
   - **Database Password:** Generate strong password *(save securely)*
   - **Region:** `us-east-1` (or closest to your users)
   - **Pricing Plan:** Free tier
5. Click **"Create new project"**
6. Wait ~2 minutes for provisioning

#### 2. Enable Extensions (3 minutes)
Navigate: **Database** → **Extensions**

Enable these extensions (toggle ON):
- ✅ **`pgvector`** - Vector similarity search (CRITICAL)
- ✅ **`uuid-ossp`** - UUID generation
- ✅ **`pg_net`** - HTTP requests from database
- ✅ **`hstore`** - Key-value storage

#### 3. Configure Connection Pooling (2 minutes)
Navigate: **Settings** → **Database**

1. Scroll to **Connection Pooling**
2. Enable **Transaction Mode** (required for serverless)
3. Note the pooled connection string

#### 4. Collect Credentials (5 minutes)
Navigate: **Settings** → **API**

Copy these values:
```bash
Project URL: https://[PROJECT-REF].supabase.co
anon key: eyJh...
service_role key: eyJh...
```

Navigate: **Settings** → **Database**

Copy the connection string (**Transaction mode**, port 6543)

#### 5. Update Environment Variables (5 minutes)

**Marketing Site:** `/home/chris/startupai.site/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Product Site Frontend:** `/home/chris/app.startupai.site/frontend/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Backend:** `/home/chris/app.startupai.site/backend/.env`
```bash
# Copy from .env.example and fill in:
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
OPENAI_API_KEY=sk-...
```

#### 6. Verify Setup (5 minutes)
```bash
# Test Supabase CLI
cd /home/chris/app.startupai.site
pnpm exec supabase projects list

# Should display your project
```

**SQL Verification:**
Run in Supabase SQL Editor:
```sql
-- Verify extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pgvector', 'uuid-ossp', 'pg_net', 'hstore');
-- Should return 4 rows
```

---

## Detailed Configuration

### Extensions Explained

**pgvector (CRITICAL)**
- Enables vector similarity search
- Required for semantic search with embeddings
- Supports HNSW indexes for fast queries
- Used with OpenAI embeddings (1536 dimensions)

**uuid-ossp**
- Generates UUIDs for primary keys
- Better than serial IDs for distributed systems
- Required by Drizzle ORM schema

**pg_net**
- Makes HTTP requests from database
- Used for webhooks and external API calls
- Enables database triggers to call services

**hstore**
- Key-value storage within PostgreSQL
- Flexible metadata storage
- Used for dynamic properties

### Connection Strings

**Pooled (Transaction Mode) - Port 6543**
- Use for: Netlify Functions, serverless, short-lived connections
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
- Benefits: Connection pooling, better for serverless
- Used in: Frontend, Backend API calls

**Direct - Port 5432**
- Use for: Migrations, long-running processes
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- Benefits: Full PostgreSQL features
- Used in: Drizzle migrations, database admin

### Security Configuration

**Row-Level Security (RLS)**
Must be enabled on all tables before production:

```sql
-- Enable RLS on a table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);
```

**API Key Usage:**
- `anon key`: Client-side (respects RLS policies)
- `service_role key`: Server-side only (bypasses RLS)

**Environment Variable Security:**
- ❌ Never commit `.env` to Git
- ❌ Never expose service role key in client code
- ✅ Use `NEXT_PUBLIC_` prefix only for anon key
- ✅ Store sensitive keys in Netlify dashboard

---

## Storage Buckets

After initial setup, create these buckets:

Navigate: **Storage** → **Create bucket**

| Bucket | Public | Purpose |
|--------|--------|---------|
| `user-uploads` | Private | User-uploaded evidence files |
| `generated-reports` | Private | AI-generated reports |
| `project-assets` | Private | Project-related files |
| `public-assets` | Public | Shared public resources |

**Storage Policies (Example):**
```sql
-- Users can upload to their own folder
CREATE POLICY "Users upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
CREATE POLICY "Users read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Authentication Setup

Configure after database setup:

Navigate: **Authentication** → **Providers**

Enable:
- ✅ Email (with magic link)
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Azure AD (for enterprise)

**Email Templates:**
Customize: **Authentication** → **Email Templates**
- Confirmation email
- Password reset
- Magic link

---

## Troubleshooting

### Connection Issues
**Problem:** Cannot connect to database
- Verify project is fully provisioned (check dashboard)
- Check password is URL-encoded (special characters)
- Ensure firewall allows connections
- Verify region matches in connection string

### Extension Issues
**Problem:** pgvector not available
- Check Supabase version (requires v0.8.0+)
- Some extensions require database restart (automatic)
- Wait a few minutes after project creation

### Performance Issues
**Problem:** Slow queries
- Use pooled connection for serverless
- Add indexes to frequently queried columns
- Enable query plan analysis in SQL Editor
- Monitor with: **Database** → **Logs**

### Authentication Issues
**Problem:** Login not working
- Verify anon key is set in frontend
- Check redirect URLs in provider settings
- Ensure RLS policies allow read access
- Test with: **Authentication** → **Users**

---

## Monitoring & Maintenance

### Database Health
Navigate: **Database** → **Health**

Monitor:
- Connection count
- Query performance
- Disk usage
- Memory usage

### Logs
Navigate: **Logs**

View:
- Database logs
- API logs
- Auth logs
- Storage logs

### Backups
Navigate: **Database** → **Backups**

- Automatic daily backups (Free tier: 7 days)
- Manual backups on demand
- Point-in-time recovery (Pro plan)

---

## Next Steps

After Supabase setup:
1. ✅ Complete this guide
2. → [Drizzle ORM Schema Implementation](./migrations/README.md)
3. → Create database tables
4. → Set up RLS policies
5. → Configure authentication providers
6. → Create storage buckets

---

## Setup Completion Status

### ✅ Completed (October 1, 2025)
- [x] Supabase project identified (StartupAI - `eqxropalhxjeyvfcoyxg`)
- [x] Supabase CLI initialized (`supabase init`)
- [x] API keys retrieved and documented
- [x] Environment variables configured:
  - [x] `backend/.env` created with service role key
  - [x] `frontend/.env.local` created with anon key
- [x] Connection strings configured (URL-encoded passwords)
- [x] .env files added to .gitignore (already configured)

### ⚠️ Manual Steps Required
- [ ] Enable 4 PostgreSQL extensions via Dashboard:
  - [ ] `vector` (pgvector for semantic search)
  - [ ] `uuid-ossp` (UUID generation)  
  - [ ] `pg_net` (HTTP requests)
  - [ ] `hstore` (key-value storage)
  - **Location:** https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/database/extensions

- [ ] Add OpenAI API key to `backend/.env`:
  ```bash
  OPENAI_API_KEY=sk-your-actual-key
  ```

### 🔑 Project Credentials

**API Keys:**
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeHJvcGFsaHhqZXl2ZmNveXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDk5ODEsImV4cCI6MjA3NDcyNTk4MX0.Muq6OvplTkSfjb02NihiQKqBLn3gh9YLBNWUQgwV-yU`
- Service Role Key: (stored in `backend/.env`)

**Connection Strings:**
- Project URL: `https://eqxropalhxjeyvfcoyxg.supabase.co`
- Pooled (Transaction): `postgresql://postgres.eqxropalhxjeyvfcoyxg:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- Direct: `postgresql://postgres:[PASSWORD]@db.eqxropalhxjeyvfcoyxg.supabase.co:5432/postgres`

---

## Reference

**Official Documentation:**
- Supabase Docs: https://supabase.com/docs
- pgvector: https://github.com/pgvector/pgvector
- Drizzle ORM: https://orm.drizzle.team

**Project Links:**
- Dashboard: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg
- SQL Editor: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql
- Extensions: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/database/extensions
- Logs: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/logs

---

**Status:** ✅ 95% Complete (extensions pending)  
**Next:** Enable extensions → Drizzle ORM Schema Setup
