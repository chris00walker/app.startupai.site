// Strategyzer AI Platform API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  // Check if response is ok (status 200-299)
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `API request failed with status ${response.status}`;

    // Try to parse error message from response
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } else {
      const text = await response.text();
      errorMessage = text || errorMessage;
    }

    throw new Error(errorMessage);
  }

  // Parse JSON response
  return response.json();
};

const api = {
  get: (endpoint: string) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include' // Include cookies for authentication
    }).then(handleResponse),

  post: (endpoint: string, data: any) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(data)
    }).then(handleResponse),

  put: (endpoint: string, data: any) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(data)
    }).then(handleResponse),

  delete: (endpoint: string) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include' // Include cookies for authentication
    }).then(handleResponse),

  // Canvas-specific API methods
  canvas: {
    getByClient: (clientId: string) => api.get(`/canvas/client/${clientId}`),
    getById: (canvasId: string) => api.get(`/canvas/${canvasId}`),
    generateValueProposition: (data: { clientId: string; title?: string; description?: string }) => 
      api.post('/canvas/generate/value-proposition', data),
    generateBusinessModel: (data: { clientId: string; title?: string; description?: string }) => 
      api.post('/canvas/generate/business-model', data),
    generateCompleteFramework: (data: { clientId: string; autoExport?: boolean }) => 
      api.post('/canvas/workflow/complete-framework', data),
    getWorkflowStatus: (clientId: string) => api.get(`/canvas/workflow/status/${clientId}`),
    exportCanvas: (canvasId: string, format: string = 'svg', theme: string = 'professional') => 
      api.post(`/canvas/${canvasId}/export`, { format, theme }),
    updateCanvas: (canvasId: string, data: any) => api.put(`/canvas/${canvasId}`, data),
    deleteCanvas: (canvasId: string) => api.delete(`/canvas/${canvasId}`),
    getStatistics: () => api.get('/canvas/stats/overview')
  }
};

export default api;
