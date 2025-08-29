import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface HealthCheckResponse {
  data: {
    status: string
    timestamp: string
    services: {
      mongodb?: string
      milvus?: string
    }
  }
}

export function useHealthCheck() {
  const { data, error, isLoading, isError } = useQuery<HealthCheckResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('/api/health')
      if (!response.ok) {
        throw new Error('Health check failed')
      }
      return response.json()
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 0, // Don't retry on failure for faster error detection
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale
    gcTime: 0 // Don't cache failed requests
  })

  // Determine if backend is online based on response
  const isBackendOnline = !isError && !error && data?.data?.status === 'healthy'

  return {
    isBackendOnline,
    isLoading,
    error,
    isError,
    healthData: data?.data
  }
}
