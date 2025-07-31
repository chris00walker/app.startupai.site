# Multi-Agent Platform Deployment Guide

This guide provides detailed instructions for deploying the Multi-Agent Intelligence Platform to cloud services.

## Deployment Architecture

The platform consists of multiple services that need to be deployed:

1. **Frontend** (Next.js static site)
2. **Backend** (Node.js API server)
3. **Database** (MongoDB)
4. **Vector Database** (Milvus)
5. **Observability** (Prometheus, Grafana)

## Option 1: Frontend on Netlify + Backend on Render (Truly Free)

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

### Deploying the Backend to Render (Free Tier)

1. Sign up at https://render.com/ (no credit card required for free tier)

2. Create a new web service:
   - Click "New" → "Web Service"
   - Connect to your GitHub account
   - Select your `multi-agent-intelligence-platform` repository

3. Configure the service:
   - Name: `multi-agent-backend`
   - Root directory: `/backend`
   - Runtime: `Node`
   - Build command: `npm install`
   - Start command: `npm start`

4. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `MONGODB_URI`: MongoDB connection string (use MongoDB Atlas free tier)
   - `NODE_ENV`: `production`
   - `PORT`: `3002`

5. Create a MongoDB database:
   - Sign up for MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string and add it as `MONGODB_URI` in Render

6. Deploy the service

7. Update Netlify environment:
   - Go back to your Netlify site settings
   - Update `NEXT_PUBLIC_API_URL` with your Render backend URL

## Option 2: Full Stack on Cyclic (Free Tier)

Cyclic.sh offers a simple way to deploy full-stack applications for free:

1. Sign up at https://www.cyclic.sh/ (free tier available)

2. Connect your GitHub repository

3. Select your `multi-agent-intelligence-platform` repository

4. Set the root directory to `/backend`

5. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `MONGODB_URI`: MongoDB connection string

6. Deploy the application

7. For the frontend, you can still use Netlify with the backend URL from Cyclic

## Option 3: Frontend on Netlify + Backend on Fly.io (Free Tier)

1. Install the Fly.io CLI: `curl -L https://fly.io/install.sh | sh`

2. Sign up at https://fly.io/ (free tier available)

3. Create a `Dockerfile` in your backend directory if it doesn't exist

4. Deploy using `flyctl launch` from your backend directory

5. Set environment variables using `flyctl secrets set`

## Option 4: Full Stack on Railway (Free Credit)

While Railway eventually requires payment, they offer $5 in free credit which should be sufficient for testing:

1. Sign up at https://railway.app/

2. Connect your GitHub repository

3. Deploy using the Docker Compose file

4. Set environment variables

## Environment Variables

### Backend Required Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string (MongoDB Atlas free tier works well)
- `NODE_ENV`: `production`
- `PORT`: `3002`

### Frontend Required Variables

- `NEXT_PUBLIC_API_URL`: URL of the deployed backend API

## Free Database Options

### MongoDB Atlas (Recommended Free Option)

1. Sign up at https://www.mongodb.com/cloud/atlas (no credit card for free tier)

2. Create a free M0 cluster

3. Add your IP address to the whitelist (or allow 0.0.0.0/0 for testing)

4. Create a database user

5. Get your connection string and use it as `MONGODB_URI`

### Limitations of Free Tiers

- **Render Free Tier**: Sleeps after 15 minutes of inactivity, wakes up in ~30 seconds
- **MongoDB Atlas Free**: 512MB storage limit, shared RAM
- **Cyclic Free Tier**: Limited to 1GB storage, sleeps after inactivity
- **Fly.io Free Tier**: Generous but with some resource limitations

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
