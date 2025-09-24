# CWC Agentic Platform

**Professional-grade multi-agent intelligence platform for AI-powered business consulting.**

This is the main application platform that provides advanced AI capabilities for client intake, agent orchestration, task management, and real-time analytics. Users access this platform through the StartupAI marketing website authentication flow.

**What Users Do:**
Once authenticated, founders and entrepreneurs use this platform to transform their business ideas into actionable strategies. They work through guided workflows to create Business Model Canvases, validate assumptions with AI-powered research, receive expert recommendations from specialized agents (Discovery, Validation, Scale), and track their progress through interactive dashboards. The platform replaces traditional consulting engagements by providing instant, personalized business intelligence that evolves with their startup journey.

## Live Demo

The platform is accessible at:

- **Production**: http://34.27.49.185:3000 (GCP deployment)
- **Local Development**: http://localhost:3001 (auto-assigned port)
- **Backend API**: http://localhost:4000
- **Monitoring**: 
  - Prometheus: http://34.27.49.185:9090
  - Grafana: http://34.27.49.185:3001

## Features

- **Client Management**: Professional intake forms with comprehensive business details
- **AI Agent Orchestration**: Multi-agent workflow management (Discovery, Validation, Scale)
- **Task Management**: Kanban-style task boards with progress tracking
- **Real-time Analytics**: Prometheus metrics with Grafana dashboards
- **Vector Database**: Milvus integration for advanced AI features
- **Authentication Integration**: Receives authenticated users from StartupAI website
- **Compliance**: Built-in PII redaction and security measures
- **Professional UI**: ShadCN components with modern interface

## Architecture

**Monorepo Structure:**
- **Frontend**: Next.js 15.5.3 with React Query and Tailwind CSS
- **Backend**: Node.js/Express with MongoDB and Milvus
- **Infrastructure**: Docker Compose for deployment
- **Observability**: OpenTelemetry with Prometheus and Grafana

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript 5.8.3
- **Runtime**: React 19.1.1
- **Styling**: Tailwind CSS
- **Components**: ShadCN/UI components (25+ components, manual setup)
- **State Management**: TanStack React Query
- **Data Fetching**: Axios
- **Build Tool**: Turbopack

### Backend
- **Runtime**: Node.js/Express
- **Database**: MongoDB (primary), Milvus (vector database)
- **Authentication**: Full session management system
- **API**: RESTful architecture
- **Testing**: Jest, Playwright (unit, integration, E2E)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Prometheus + Grafana + OpenTelemetry
- **Deployment**: Self-hosted on GCP
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- OpenAI API key
- Google Cloud Platform account (for deployment)

## Local Development

### Option 1: Frontend Only (Recommended for development)

1. Clone the repository:
   ```bash
   git clone https://github.com/chris00walker/multi-agent-intelligence-platform.git
   cd multi-agent-intelligence-platform
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend && npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   # or from root: npm run start:frontend
   ```

4. Access the application:
   - Frontend: http://localhost:3001 (auto-assigned if 3000 is in use)

### Option 2: Full Stack with Docker

1. Follow steps 1-2 above, then install backend dependencies:
   ```bash
   cd backend && npm install && cd ..
   ```

2. Set up environment variables:
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your values
   
   # Frontend  
   cp frontend/.env.local.example frontend/.env.local
   # Edit frontend/.env.local with your values
   ```

3. Start all services:
   ```bash
   docker-compose up
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001

## Available Scripts

### Root Level
- `npm run start:frontend` - Start frontend development server
- `npm run start:backend` - Start backend development server
- `npm run build:frontend` - Build frontend for production
- `npm run build:backend` - Build backend for production
- `npm run test:frontend` - Run frontend tests
- `npm run test:backend` - Run backend tests
- `npm run docker:up` - Start all services with Docker
- `npm run docker:down` - Stop all Docker services

### Frontend (in /frontend directory)
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run test` - Run Jest tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:coverage` - Run tests with coverage

## Deployment

The platform is deployed on Google Cloud Platform using the comprehensive deployment guide:

[GCP Deployment Guide](GCP_DEPLOYMENT_GUIDE.md)

This deployment includes all services (frontend, backend, MongoDB, Milvus, Prometheus, Grafana) running on a single GCP Compute Engine instance.

## Integration with StartupAI Website

This platform integrates with the StartupAI marketing website for user authentication:

### Authentication Flow
1. Users visit StartupAI website (http://localhost:3000)
2. Users authenticate through login form
3. Users are redirected to this platform (http://localhost:3001)
4. JWT tokens are shared between platforms for session management

### Running Both Platforms Locally
```bash
# Terminal 1: Start StartupAI website
cd /path/to/startupai.site
npm run dev  # Runs on port 3000

# Terminal 2: Start CWC Agentic Platform  
cd /path/to/cwc-agentic-platform
npm run start:frontend  # Runs on port 3001
```

### Project Structure
```text
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # ShadCN components (25+ components)
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   └── canvas/          # Business canvas components
│   ├── pages/               # Next.js pages
│   ├── services/            # API services
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utilities
backend/
├── routes/                  # Express routes
├── models/                  # Database models
├── middleware/              # Express middleware
└── services/                # Business logic
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Playwright for user workflows
- **Coverage**: Comprehensive test coverage reporting

### Backend Testing  
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Database and API testing
- **Contract Tests**: API contract validation

### Available Test Commands
```bash
# Frontend tests
npm run test:unit
npm run test:integration  
npm run test:e2e
npm run test:coverage

# Backend tests
npm run test:backend

# All tests
npm run test
```

## Development Workflow

1. Make changes to code locally
2. Run tests: `npm run test`
3. Test integration with StartupAI website
4. Commit and push to GitHub
5. Deploy to GCP instance
6. Monitor with Prometheus/Grafana

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
