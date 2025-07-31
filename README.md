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

This application can be deployed to any cloud platform that supports Docker containers. For cloud deployment, update the environment variables to point to your production services.

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
