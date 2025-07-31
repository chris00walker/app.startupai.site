import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '../../src/pages/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock the API module
jest.mock('../../src/services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: { clients: [] } })),
}));

describe('HomePage', () => {
  it('renders loading state initially', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Loading client portfolio.../i)).toBeInTheDocument();
  });
});
