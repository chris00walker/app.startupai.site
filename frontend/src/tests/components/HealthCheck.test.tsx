import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import HomePage from '../../pages/index';
import { TEST_CONFIG, createTestQueryClient } from '../config/testConfig';

// Systematic MSW Server Setup using Infrastructure as Code approach
const server = setupServer(
  http.get('/api/health', () => {
    return HttpResponse.json(TEST_CONFIG.API_RESPONSES.HEALTH_HEALTHY);
  }),
  http.get('/api/clients', () => {
    return HttpResponse.json(TEST_CONFIG.API_RESPONSES.CLIENTS_EMPTY);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Health Check Integration Tests - Systematic Approach', () => {
  it('should show AI Services Online when backend returns healthy status', async () => {
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // Wait for the component to load and check for online status
    await waitFor(() => {
      expect(screen.getByText('Services Online')).toBeInTheDocument();
    }, { timeout: TEST_CONFIG.ENVIRONMENT.TIMEOUT });
  });

  it('should show Backend Services Offline when health check fails', async () => {
    // Override with error response
    server.use(
      http.get('/api/health', () => {
        return new HttpResponse(JSON.stringify({ error: 'Service unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );

    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // Should show offline status
    await screen.findByText('Services Offline');
  });

  it('should detect wrong status value (contract test)', async () => {
    // Use the wrong status response from config
    server.use(
      http.get('/api/health', () => {
        return HttpResponse.json(TEST_CONFIG.API_RESPONSES.HEALTH_UNHEALTHY);
      })
    );

    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // Should show offline because status is 'ok' instead of 'healthy'
    await screen.findByText('Services Offline');
  });
});
