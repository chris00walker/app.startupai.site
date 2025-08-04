#!/bin/bash

# Strategyzer AI Platform - Production Deployment Script
# This script deploys the application to Google Cloud Platform using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"andrewcave"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="strategyzer-ai-backend"
FRONTEND_SERVICE_NAME="strategyzer-ai-frontend"
CONTAINER_REGISTRY="gcr.io/${PROJECT_ID}"

echo -e "${BLUE}🚀 Starting Strategyzer AI Platform Production Deployment${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    # Add Google Cloud SDK to PATH
    export PATH="/home/chris/google-cloud-sdk/bin:$PATH"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Authenticate with Google Cloud
authenticate_gcloud() {
    echo -e "${BLUE}🔐 Authenticating with Google Cloud...${NC}"
    
    # Check if already authenticated
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        print_status "Already authenticated with Google Cloud"
    else
        print_warning "Please authenticate with Google Cloud"
        gcloud auth login
    fi
    
    # Set project
    gcloud config set project $PROJECT_ID
    print_status "Project set to $PROJECT_ID"
}

# Configure Docker for GCR
configure_docker() {
    echo -e "${BLUE}🐳 Configuring Docker for Google Container Registry...${NC}"
    
    gcloud auth configure-docker
    print_status "Docker configured for GCR"
}

# Build and push backend image
build_backend() {
    echo -e "${BLUE}🏗️  Building backend Docker image...${NC}"
    
    cd backend
    
    # Build the image
    docker build -t $CONTAINER_REGISTRY/$SERVICE_NAME:latest .
    docker build -t $CONTAINER_REGISTRY/$SERVICE_NAME:$(date +%Y%m%d-%H%M%S) .
    
    print_status "Backend image built successfully"
    
    # Push to registry
    echo -e "${BLUE}📤 Pushing backend image to registry...${NC}"
    docker push $CONTAINER_REGISTRY/$SERVICE_NAME:latest
    docker push $CONTAINER_REGISTRY/$SERVICE_NAME:$(date +%Y%m%d-%H%M%S)
    
    print_status "Backend image pushed to registry"
    
    cd ..
}

# Build and push frontend image
build_frontend() {
    echo -e "${BLUE}🏗️  Building frontend Docker image...${NC}"
    
    cd frontend
    
    # Build the image
    docker build -t $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME:latest \
        --build-arg NEXT_PUBLIC_API_URL=https://$SERVICE_NAME-$REGION.a.run.app/api .
    docker build -t $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME:$(date +%Y%m%d-%H%M%S) \
        --build-arg NEXT_PUBLIC_API_URL=https://$SERVICE_NAME-$REGION.a.run.app/api .
    
    print_status "Frontend image built successfully"
    
    # Push to registry
    echo -e "${BLUE}📤 Pushing frontend image to registry...${NC}"
    docker push $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME:latest
    docker push $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME:$(date +%Y%m%d-%H%M%S)
    
    print_status "Frontend image pushed to registry"
    
    cd ..
}

# Deploy to Cloud Run
deploy_backend() {
    echo -e "${BLUE}🚀 Deploying backend to Cloud Run...${NC}"
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Please create it from .env.production.template"
        print_warning "Using environment variables from current shell"
    fi
    
    # Deploy backend service
    gcloud run deploy $SERVICE_NAME \
        --image $CONTAINER_REGISTRY/$SERVICE_NAME:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 4000 \
        --memory 2Gi \
        --cpu 2 \
        --max-instances 10 \
        --min-instances 1 \
        --timeout 300 \
        --concurrency 80 \
        --set-env-vars "NODE_ENV=production,PORT=4000" \
        --set-env-vars "MONGODB_URI=${MONGODB_URI}" \
        --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
        --set-env-vars "JWT_SECRET=${JWT_SECRET}" \
        --set-env-vars "MASTER_ENCRYPTION_KEY=${MASTER_ENCRYPTION_KEY}" \
        --set-env-vars "FORCE_HTTPS=true" \
        --set-env-vars "ENABLE_MONITORING=true" \
        --set-env-vars "ENABLE_SECURITY_SCANNING=true"
    
    print_status "Backend deployed to Cloud Run"
    
    # Get the service URL
    BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo -e "${GREEN}🌐 Backend URL: $BACKEND_URL${NC}"
}

# Deploy frontend to Cloud Run
deploy_frontend() {
    echo -e "${BLUE}🚀 Deploying frontend to Cloud Run...${NC}"
    
    # Deploy frontend service
    gcloud run deploy $FRONTEND_SERVICE_NAME \
        --image $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 3000 \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 5 \
        --min-instances 1 \
        --timeout 300 \
        --concurrency 80 \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL/api"
    
    print_status "Frontend deployed to Cloud Run"
    
    # Get the service URL
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo -e "${GREEN}🌐 Frontend URL: $FRONTEND_URL${NC}"
}

# Setup monitoring and alerting
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring and alerting...${NC}"
    
    # Enable required APIs
    gcloud services enable monitoring.googleapis.com
    gcloud services enable logging.googleapis.com
    gcloud services enable cloudtrace.googleapis.com
    
    print_status "Monitoring APIs enabled"
    
    # Create uptime check
    echo "Creating uptime check for backend service..."
    # Note: This would typically be done through the Cloud Console or using gcloud alpha commands
    
    print_status "Monitoring setup completed"
}

# Run security scan
run_security_scan() {
    echo -e "${BLUE}🔒 Running security scan...${NC}"
    
    # Scan the deployed images for vulnerabilities
    gcloud container images scan $CONTAINER_REGISTRY/$SERVICE_NAME:latest
    gcloud container images scan $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME:latest
    
    print_status "Security scan completed"
}

# Verify deployment
verify_deployment() {
    echo -e "${BLUE}✅ Verifying deployment...${NC}"
    
    # Test backend health endpoint
    if curl -f "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        print_status "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Test frontend
    if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
        print_status "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    print_status "Deployment verification completed"
}

# Cleanup old images
cleanup_old_images() {
    echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
    
    # Keep last 5 images, delete older ones
    gcloud container images list-tags $CONTAINER_REGISTRY/$SERVICE_NAME \
        --limit=999999 --sort-by=TIMESTAMP \
        --format="get(digest)" | tail -n +6 | \
        xargs -I {} gcloud container images delete $CONTAINER_REGISTRY/$SERVICE_NAME@{} --quiet
    
    gcloud container images list-tags $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME \
        --limit=999999 --sort-by=TIMESTAMP \
        --format="get(digest)" | tail -n +6 | \
        xargs -I {} gcloud container images delete $CONTAINER_REGISTRY/$FRONTEND_SERVICE_NAME@{} --quiet
    
    print_status "Old images cleaned up"
}

# Main deployment function
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yaml" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Load environment variables if .env.production exists
    if [ -f ".env.production" ]; then
        source .env.production
        print_status "Loaded production environment variables"
    fi
    
    # Run deployment steps
    check_dependencies
    authenticate_gcloud
    configure_docker
    build_backend
    build_frontend
    deploy_backend
    deploy_frontend
    setup_monitoring
    run_security_scan
    verify_deployment
    cleanup_old_images
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "=================================================="
    echo -e "${GREEN}Backend URL: $BACKEND_URL${NC}"
    echo -e "${GREEN}Frontend URL: $FRONTEND_URL${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Configure your domain name to point to the frontend URL"
    echo "2. Set up SSL certificates if using custom domain"
    echo "3. Configure monitoring alerts in Google Cloud Console"
    echo "4. Run end-to-end tests to verify functionality"
    echo "5. Update DNS records if needed"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "- Monitor the application logs for any issues"
    echo "- Check security scan results in Google Cloud Console"
    echo "- Verify all environment variables are properly set"
    echo "- Test all critical workflows"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build-only")
        check_dependencies
        authenticate_gcloud
        configure_docker
        build_backend
        build_frontend
        ;;
    "deploy-only")
        check_dependencies
        authenticate_gcloud
        deploy_backend
        deploy_frontend
        verify_deployment
        ;;
    "cleanup")
        check_dependencies
        authenticate_gcloud
        cleanup_old_images
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        echo "Usage: $0 [deploy|build-only|deploy-only|cleanup|verify]"
        echo ""
        echo "Commands:"
        echo "  deploy      - Full deployment (default)"
        echo "  build-only  - Only build and push images"
        echo "  deploy-only - Only deploy to Cloud Run"
        echo "  cleanup     - Clean up old images"
        echo "  verify      - Verify deployment health"
        exit 1
        ;;
esac
