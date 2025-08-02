# Multi-Agent Intelligence Platform

A professional-grade multi-agent intelligence platform designed for consulting businesses. This platform provides advanced AI capabilities for client intake, agent orchestration, task management, and real-time analytics.


## Live Demo

The platform is currently deployed and accessible at:

 
- **Main Dashboard**: http://34.27.49.185:3000
- **Backend API**: http://34.27.49.185:4000
- **Prometheus**: http://34.27.49.185:9090
- **Grafana**: http://34.27.49.185:3001


## Features

 
- **Client Management**: Professional intake forms with comprehensive business details
- **AI Agent Orchestration**: Multi-agent workflow management (Discovery, Validation, Scale)
- **Task Management**: Kanban-style task boards with progress tracking
- **Real-time Analytics**: Prometheus metrics with Grafana dashboards
- **Vector Database**: Milvus integration for advanced AI features
- **Compliance**: Built-in PII redaction and security measures
- **Professional UI**: Modern, clean interface suitable for client presentations


## Architecture

The platform consists of:


- **Frontend**: Next.js 15 with React Query and Tailwind CSS
- **Backend**: Node.js/Express with MongoDB and Milvus
- **Infrastructure**: Docker Compose for deployment
- **Observability**: OpenTelemetry with Prometheus and Grafana

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- OpenAI API key
- Google Cloud Platform account (for deployment)

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/chris00walker/multi-agent-intelligence-platform.git
   cd multi-agent-intelligence-platform
   ```

2. Install dependencies:

   ```bash
   # Backend
   cd backend && npm install && cd ..
   
   # Frontend
   cd frontend && npm install && cd ..
   ```

3. Set up environment variables:

   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your values
   
   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   # Edit frontend/.env.local with your values
   ```

4. Start the development server:

   ```bash
   docker-compose up
   ```

5. Access the application:

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Deployment

The platform is deployed on Google Cloud Platform using the comprehensive deployment guide:

[GCP Deployment Guide](GCP_DEPLOYMENT_GUIDE.md)

This deployment includes all services (frontend, backend, MongoDB, Milvus, Prometheus, Grafana) running on a single GCP Compute Engine instance.

## Development Workflow

1. Make changes to code locally
2. Test with `docker-compose up`
3. Commit and push to GitHub
4. SSH to GCP instance and pull changes
5. Rebuild and restart services as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
