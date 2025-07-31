# Multi-Agent Intelligence Platform

A professional-grade multi-agent intelligence platform designed for consulting businesses. This platform provides advanced AI capabilities for client intake, agent orchestration, task management, and real-time analytics.

## Features

- **Client Intake System**: Professional intake forms with PII redaction
- **Agent Orchestration**: Multi-agent workflow management
- **Task Management**: Kanban-style task boards with progress tracking
- **Real-time Analytics**: Prometheus metrics with Grafana dashboards
- **Vector Database**: Milvus integration for advanced AI features
- **Compliance**: Built-in PII redaction and security measures

## Architecture

The platform consists of:

- **Frontend**: Next.js 15 with React Query and Tailwind CSS
- **Backend**: Node.js/Express with MongoDB and Milvus
- **Infrastructure**: Docker Compose for local development
- **Observability**: OpenTelemetry with Prometheus and Grafana

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- OpenAI API key

## Local Development

1. Clone the repository
2. Set up environment variables (see `.env.example` files)
3. Run `docker-compose up -d` to start all services
4. Access the frontend at http://localhost:3000

## Environment Variables

### Backend (`.env`)

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string
- `MILVUS_HOST`: Milvus host (default: localhost)
- `MILVUS_PORT`: Milvus port (default: 19530)

### Frontend (`.env.local`)

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3002/api)

## Deployment

### GitHub Actions Deployment

This repository includes a GitHub Actions workflow that automatically builds Docker images for both the frontend and backend services. The workflow is triggered on pushes to the `main` branch.

### Cloud Platform Deployment Options

Since this is a multi-container application with complex dependencies (MongoDB, Milvus, etc.), you'll need a cloud platform that supports Docker Compose or Kubernetes:

1. **AWS**: Use AWS ECS with Docker Compose or EKS with Kubernetes
2. **Google Cloud**: Use Cloud Run or Google Kubernetes Engine
3. **Azure**: Use Azure Container Instances or Azure Kubernetes Service
4. **DigitalOcean**: Use App Platform which supports Docker Compose
5. **Railway**: Supports Docker Compose deployments
6. **Render**: Supports Docker Compose deployments

### Deployment Steps

1. Choose a cloud platform that supports Docker Compose
2. Create an account and set up your deployment environment
3. Configure the environment variables in your cloud platform:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - Database connection strings for MongoDB and Milvus
4. Deploy the `docker-compose.yaml` file to your cloud platform
5. Update the frontend's `NEXT_PUBLIC_API_URL` to point to your deployed backend

### Free Deployment Options

For a free deployment option, consider:

1. **Railway** (railway.app): Offers $5 credit free, supports Docker Compose
2. **Render** (render.com): Free tier available for web services
3. **Fly.io**: Free tier with some limitations

### Netlify Deployment (Frontend Only)

Since Netlify primarily supports static sites and serverless functions, you can deploy the frontend to Netlify while running the backend separately:

1. **Deploy the frontend to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set the build command to `npm run build`
   - Set the publish directory to `.next`
   - Add `NEXT_PUBLIC_API_URL` as an environment variable in Netlify pointing to your backend

2. **Run the backend separately**:
   - You'll need to deploy the backend to a platform that supports Docker Compose or containers
   - Options include Railway, Render, or AWS ECS

**Note**: Netlify won't be able to run your full multi-container application as it doesn't support Docker Compose. You'll need a separate backend deployment.

## Testing

- Frontend: `npm test` (100% test coverage)
- Backend: `npm test` (100% test coverage)

## Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:3002/api
- Prometheus: http://localhost:9464/metrics
- Grafana: http://localhost:3001

## License

ISC
