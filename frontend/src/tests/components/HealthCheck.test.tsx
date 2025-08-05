import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import HomePage from '../../pages/index';

// Mock the API responses
const server = setupServer(
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: '2025-08-05T15:00:00.000Z',
      services: {
        mongodb: 'connected',
        milvus: 'connected'
      }
    });
  }),
  http.get('/api/clients', () => {
    return HttpResponse.json({ clients: [] });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Health Check Integration Tests', () => {
  const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  it('should show "AI Services Online" when backend returns healthy status', async () => {
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Backend Services Offline')).not.toBeInTheDocument();
    });

    // Should show online status (green indicator)
    const onlineIndicator = screen.getByText('AI Active');
    expect(onlineIndicator).toBeInTheDocument();
  });

  it('should show "Backend Services Offline" when health check fails', async () => {
    // Override the health endpoint to return error
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

    await waitFor(() => {
      expect(screen.getByText('Backend Services Offline')).toBeInTheDocument();
    });
  });

  it('should enforce frontend-backend health contract', async () => {
    // This test ensures the status value contract is maintained
    server.use(
      http.get('/api/health', () => {
        return HttpResponse.json({
          status: 'healthy', // Must be 'healthy', not 'ok'
          timestamp: '2025-08-05T15:00:00.000Z',
          services: { mongodb: 'connected' }
        });
      })
    );

    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should NOT show offline when status is 'healthy'
      expect(screen.queryByText('Backend Services Offline')).not.toBeInTheDocument();
    });
  });

  it('should fail if backend returns wrong status value', async () => {
    // This test would catch the 'ok' vs 'healthy' mismatch
    server.use(
      http.get('/api/health', () => {
        return HttpResponse.json({
          status: 'ok', // Wrong status value
          timestamp: '2025-08-05T15:00:00.000Z',
          services: { mongodb: 'connected' }
        });
      })
    );

    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should show offline because status is 'ok' instead of 'healthy'
      expect(screen.getByText('Backend Services Offline')).toBeInTheDocument();
    });
  });
});
