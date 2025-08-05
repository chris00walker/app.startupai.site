// Test Configuration - Infrastructure as Code for Testing
// Ensures consistent test environments and API response structures

export const TEST_CONFIG = {
  // API Response Structures - Must match real backend
  API_RESPONSES: {
    HEALTH_HEALTHY: {
      data: {
        status: 'healthy',
        timestamp: '2025-08-05T15:00:00.000Z',
        services: {
          mongodb: 'connected',
          milvus: 'connected'
        }
      }
    },
    HEALTH_UNHEALTHY: {
      data: {
        status: 'ok', // Wrong status to test error handling
        timestamp: '2025-08-05T15:00:00.000Z',
        services: {
          mongodb: 'connected'
        }
      }
    },
    CLIENTS_EMPTY: {
      data: {
        clients: []
      }
    },
    CLIENTS_WITH_DATA: {
      data: {
        clients: [
          {
            id: 'test-client-123',
            name: 'Test Client',
            status: 'active'
          }
        ]
      }
    }
  },

  // Test Environment Settings
  ENVIRONMENT: {
    API_BASE_URL: '/api',
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 0
  },

  // Query Client Configuration for Tests
  QUERY_CLIENT_CONFIG: {
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  }
};

// Helper function to create consistent test query client
export const createTestQueryClient = () => {
  const { QueryClient } = require('@tanstack/react-query');
  return new QueryClient(TEST_CONFIG.QUERY_CLIENT_CONFIG);
};
