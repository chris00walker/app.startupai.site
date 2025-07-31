# Multi-Agent Platform Deployment Guide

This guide provides detailed instructions for deploying the Multi-Agent Intelligence Platform to cloud services.

## Deployment Architecture

The platform consists of multiple services that need to be deployed:

1. **Frontend** (Next.js static site)
2. **Backend** (Node.js API server)
3. **Database** (MongoDB)
4. **Vector Database** (Milvus)
5. **Observability** (Prometheus, Grafana)

## Option 1: Frontend on Netlify + Backend on Railway (Recommended)

### Deploying the Frontend to Netlify

1. Log in to your Netlify account at https://app.netlify.com/

2. Create a new site:
   - Click "Add new site" → "Import an existing project"
   - Connect to your GitHub account
   - Select your `multi-agent-intelligence-platform` repository

3. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

4. Set environment variables:
   - Go to "Site settings" → "Build & deploy" → "Environment"
   - Add variable:
     - Key: `NEXT_PUBLIC_API_URL`
     - Value: `https://your-backend-url.com/api` (placeholder for now)

5. Deploy the site:
   - Click "Deploy site"

### Deploying the Backend to Railway

1. Sign up at https://railway.app/

2. Create a new project:
   - Click "+ New Project" → "Deploy from GitHub repo"
   - Connect to your GitHub account
   - Select your `multi-agent-intelligence-platform` repository

3. Configure the service:
   - Set the root directory to `/backend`
   - Railway will automatically detect it's a Node.js project
   - Set environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `MONGODB_URI`: MongoDB connection string (Railway can provision this)
     - `MILVUS_HOST`: Milvus host
     - `MILVUS_PORT`: 19530
     - `PROMETHEUS_PORT`: 9464

4. Provision MongoDB:
   - In your Railway project, click "+ New" → "Database" → "MongoDB"
   - Railway will automatically set the `MONGODB_URI` environment variable

5. Deploy the service

6. Update Netlify environment:
   - Go back to your Netlify site settings
   - Update `NEXT_PUBLIC_API_URL` with your Railway backend URL

## Option 2: Full Stack on Railway

Railway supports Docker Compose deployments, making it possible to deploy the entire stack:

1. Sign up at https://railway.app/

2. Create a new project from your GitHub repository

3. Railway will automatically detect the `docker-compose.yaml` file

4. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key

5. Deploy the entire stack

## Option 3: Full Stack on Render

1. Sign up at https://render.com/

2. Create a new web service from your GitHub repository

3. Configure to use the `docker-compose.yaml` file

4. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key

5. Deploy the entire stack

## Environment Variables

### Backend Required Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string (if not using Railway's provisioned database)
- `MILVUS_HOST`: Milvus host (if using external Milvus)
- `MILVUS_PORT`: Milvus port (default: 19530)
- `PROMETHEUS_PORT`: Prometheus port (default: 9464)

### Frontend Required Variables

- `NEXT_PUBLIC_API_URL`: URL of the deployed backend API

## Testing Your Deployment

After deployment, verify that:

1. The frontend loads correctly
2. The backend API is accessible
3. The connection between frontend and backend is working
4. All services are running without errors

## Troubleshooting

### Common Issues

1. **Frontend not connecting to backend**:
   - Check that `NEXT_PUBLIC_API_URL` is correctly set in Netlify
   - Ensure the backend URL is accessible

2. **Backend failing to start**:
   - Check that all required environment variables are set
   - Verify the MongoDB connection
   - Check logs for error messages

3. **Services not communicating**:
   - Ensure all services are on the same network (when using Docker Compose)
   - Check that ports are correctly exposed

### Getting Help

If you encounter issues:

1. Check the application logs in your deployment platform
2. Verify all environment variables are correctly set
3. Ensure your OpenAI API key is valid and has the necessary permissions
