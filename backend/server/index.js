import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import routes from './routes.js';

// Load environment variables
dotenv.config();

// Initialize OpenTelemetry SDK with Prometheus exporter
const prometheusExporter = new PrometheusExporter({ startServer: true }, () => {
  console.log('Prometheus scrape endpoint: http://localhost:9464/metrics');
});
const sdk = new NodeSDK({
  metricExporter: prometheusExporter,
  metricInterval: 1000,
});
sdk.start();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

// Create Express app
const app = express();
app.use(cors());

// PII redaction middleware (scans incoming requests)
import { redactPIIMiddleware } from './utils/complianceMiddleware.js';
app.use(express.json(), redactPIIMiddleware);

// Root route - API status and information
app.get('/', (req, res) => {
  res.json({
    name: 'Strategyzer AI Backend',
    version: '1.0.0',
    status: 'operational',
    description: 'AI-powered business strategy platform backend',
    endpoints: {
      health: '/api/health',
      security: '/api/security',
      monitoring: '/api/monitoring',
      collaboration: '/api/collaboration'
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register API routes
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
