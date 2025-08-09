# GCP Bootstrap (Cloud SQL + Secrets + IAM)


ROLE: Cloud Platform Engineer (Deterministic, Non-interactive)


## Goal

Provision minimal GCP resources to run the thin-slice backend on Cloud Run with Postgres (Cloud SQL) and managed secrets. Emit exact outputs for CI/deploy.


## Inputs (canonical)

- Project ID: `<GCP_PROJECT_ID>`
- Region: `us-central1` (override via env)
- Service name: `strategyzer-backend`
- Database name: `strategyzer`
- Secrets: names for `DATABASE_URL`, `OPENAI_API_KEY`, etc.


## Constraints

- GCP-native only (no MongoDB)
- Secret Manager for secrets
- Least-privilege IAM
- Idempotent (safe to rerun)


## Outputs

- Cloud SQL Postgres instance id
- DB connection name for Cloud Run
- Secret Manager secret names and versions
- Service account emails and roles
- `.env.example` entries for local dev


## Steps (Idempotent)

1) Enable APIs
   - `services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com vpcaccess.googleapis.com`
2) Cloud SQL Postgres
   - Create instance (or ensure exists), DB, and user
   - Generate `DATABASE_URL` (use generated password; store only in Secret Manager)
3) Secret Manager
   - Create `DATABASE_URL` secret and add latest version
   - Create app secrets (OPENAI_API_KEY, etc.) as empty placeholders unless provided
4) Service Accounts & IAM
   - Create `cloud-run-invoker` SA and `cloud-run-runtime` SA (if not existing)
   - Grant minimum roles: `roles/run.invoker`, `roles/cloudsql.client`, `roles/secretmanager.secretAccessor`, `roles/logging.logWriter`, `roles/monitoring.metricWriter`
5) Optional: Serverless VPC Access connector (egress to Cloud SQL if needed)
6) Emit artifacts
   - Print DB connection name, secret names, SA emails
   - Write `docs/engineering/50-infra/cloud-run/env.example` and `docs/engineering/50-infra/secrets-management.md` sections


## Validation

- `gcloud sql instances describe <instance>` succeeds
- `gcloud secrets versions access latest --secret=DATABASE_URL` returns a value (redact on display)
- `gcloud iam service-accounts list` includes the created SAs


## Output Format (STRICT)

1) List of created/verified resources with IDs
2) Commands run (dry-run first if requested)
3) Next steps for Cloud Run deploy and local docker-compose


## Example Commands (template)

```bash
PROJECT_ID=<GCP_PROJECT_ID>
REGION=us-central1
INSTANCE=pg-strategyzer
DB=strategyzer
DB_USER=app
DB_PASS=$(openssl rand -base64 24)

# Enable APIs
gcloud services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com vpcaccess.googleapis.com --project $PROJECT_ID

# Cloud SQL Postgres (create if not exists)
gcloud sql instances create $INSTANCE --database-version=POSTGRES_15 --cpu=2 --memory=4GiB --region=$REGION --project=$PROJECT_ID || true
gcloud sql databases create $DB --instance=$INSTANCE --project=$PROJECT_ID || true
gcloud sql users create $DB_USER --instance=$INSTANCE --password=$DB_PASS --project=$PROJECT_ID || true

# DATABASE_URL
CONN_NAME=$(gcloud sql instances describe $INSTANCE --project=$PROJECT_ID --format='value(connectionName)')
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@//cloudsql/$CONN_NAME/$DB?sslmode=disable"

# Secrets
printf %s "$DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=- --replication-policy=automatic --project=$PROJECT_ID || \
  printf %s "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL --data-file=- --project=$PROJECT_ID

# Service accounts
RUNTIME_SA=backend-runtime@$PROJECT_ID.iam.gserviceaccount.com
gcloud iam service-accounts create backend-runtime --display-name="Backend Runtime" --project=$PROJECT_ID || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$RUNTIME_SA \
  --role=roles/cloudsql.client

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$RUNTIME_SA \
  --role=roles/secretmanager.secretAccessor

# Output
echo "CONNECTION_NAME=$CONN_NAME"
echo "RUNTIME_SA=$RUNTIME_SA"
```
