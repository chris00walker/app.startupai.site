# Full Application Deployment Script

This guide will help you deploy your complete multi-agent intelligence platform using Docker Compose on Fly.io without modifying your code.

## Prerequisites

1. A GitHub account (which you already have)
2. An OpenAI API key
3. A Fly.io account (free, no credit card required for basic testing)

## Step 1: Install Fly CLI

Run this command in your terminal:

```bash
curl -L https://fly.io/install.sh | sh
```

Then add Fly to your PATH (the installer will show you the exact command):

```bash
export FLYCTL_INSTALL="/home/$(whoami)/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"
```

## Step 2: Sign up for Fly.io

```bash
flyctl auth signup
```

This will open a browser window where you can sign up using GitHub, Google, or email.

## Step 3: Prepare Your Application

Before deploying, we need to make a few minor adjustments to work with Fly.io's environment.

### 3.1: Check Your Current Environment Variables

Make sure your `.env` file in the backend directory has all required variables:

```bash
cd /home/chris/andrewCave/backend
ls -la .env
```

If it doesn't exist, create it based on `.env.example`:

```bash
cp .env.example .env
```

### 3.2: Update Docker Compose for Fly.io

We need to make a small adjustment to your docker-compose.yaml file to work better with Fly.io.

Create a new file called `fly.docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:6
    restart: unless-stopped
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db

  milvus:
    image: milvusdb/milvus:v2.3.0
    restart: unless-stopped
    command: ["milvus", "run", "standalone"]
    environment:
      - ETCD_ENDPOINTS=etcd:2379
      - MINIO_ADDRESS=minio:9000
    ports:
      - '19530:19530'
    depends_on:
      - etcd
      - minio

  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    ports:
      - '2379:2379'
      - '2380:2380'

  minio:
    image: minio/minio:RELEASE.2023-07-21T19-02-38Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    command: minio server /data
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    ports:
      - '3002:3002'
    environment:
      - NODE_ENV=production
      - PORT=3002
      - MONGODB_URI=mongodb://mongo:27017/multi-agent-platform
      - MILVUS_HOST=milvus
      - MILVUS_PORT=19530
      - PROMETHEUS_PORT=9464
    depends_on:
      - mongo
      - milvus
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3002/api
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mongo_data:
  minio_data:
```

## Step 4: Deploy to Fly.io

### 4.1: Launch the Application

From your project root directory:

```bash
cd /home/chris/andrewCave
flyctl launch
```

When prompted:
- Choose to create a new app
- Choose a unique app name (or let Fly generate one)
- Select your preferred region
- When asked if you want to deploy now, say "No"

### 4.2: Configure for Docker Compose

Edit the generated `fly.toml` file to work with Docker Compose:

```toml
app = "your-app-name"
primary_region = "your-region"

[build]
  dockerfile = "./backend/Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3002"
  MONGODB_URI = "mongodb://mongo:27017/multi-agent-platform"
  MILVUS_HOST = "milvus"
  MILVUS_PORT = "19530"
  PROMETHEUS_PORT = "9464"

[http_service]
  internal_port = 3002
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
```

### 4.3: Set Secrets

Set your OpenAI API key:

```bash
flyctl secrets set OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 4.4: Deploy the Application

```bash
flyctl deploy
```

## Step 5: Access Your Application

Once deployed, you can access your application at:

```
https://your-app-name.fly.dev
```

## Step 6: Testing

### 6.1: Check Application Status

```bash
flyctl status
```

### 6.2: View Logs

```bash
flyctl logs
```

### 6.3: Test API Endpoints

You can test your API endpoints using curl:

```bash
curl https://your-app-name.fly.dev/api/health
```

## Troubleshooting

### Common Issues

1. **Resource Limits**: If your application fails to start due to memory issues:
   ```bash
   flyctl scale memory 512
   ```

2. **Port Issues**: Make sure your application listens on the port specified in the PORT environment variable.

3. **Database Connection**: If you have issues with MongoDB, check the connection string in your environment variables.

### Getting Help

If you encounter issues:

1. Check the application logs: `flyctl logs`
2. Verify all environment variables are correctly set: `flyctl secrets list`
3. Ensure your OpenAI API key is valid

## Next Steps

Once your application is running successfully:

1. Test all functionality through the web interface
2. Verify that all agents are working correctly
3. Check that data is being stored in MongoDB
4. Test the Milvus integration for vector operations

This deployment maintains your complete application architecture without requiring code changes, allowing you to test the full functionality of your multi-agent intelligence platform.
